// @vitest-environment jsdom
//
// face-api のラッパのテスト。本物のライブラリ(1.3MB)とモデル(7.1MB)は読まず、
// vi.mock で差し替えている。ここで守りたいのは
//   - モデルを1回しか読まないこと（画面を行き来するたびに7MB取りに行かない）
//   - 失敗したらやり直せること
//   - ウォームアップを必ず通ること
//   - 検出結果の詰め替えが正しいこと
// の4点。

import { describe, it, expect, vi, beforeEach } from 'vitest';

const loadCalls = [];
const detectCalls = [];
let detectResult = null;
let loadShouldFail = false;
let setBackendShouldFail = false;
const tfCalls = [];

const warmCalls = [];

function net(name, extra = {}) {
  return {
    loadFromUri: vi.fn(async (uri) => {
      if (loadShouldFail) throw new Error('network down');
      loadCalls.push(`${name}:${uri}`);
    }),
    ...extra,
  };
}

const warms = (name) => vi.fn(async () => {
  warmCalls.push(name);
});

const chain = () => {
  const c = {
    withFaceLandmarks: () => c,
    withAgeAndGender: () => c,
    withFaceDescriptor: () => c,
    then: (resolve) => Promise.resolve(detectResult).then(resolve),
  };
  return c;
};

vi.mock('@vladmandic/face-api', () => ({
  nets: {
    tinyFaceDetector: net('tinyFaceDetector'),
    faceLandmark68Net: net('faceLandmark68Net', { detectLandmarks: warms('landmarks') }),
    ageGenderNet: net('ageGenderNet', { predictAgeAndGender: warms('ageGender') }),
    faceRecognitionNet: net('faceRecognitionNet', { computeFaceDescriptor: warms('descriptor') }),
  },
  tf: {
    setBackend: vi.fn(async (b) => {
      if (setBackendShouldFail) throw new Error('no webgl');
      tfCalls.push(`setBackend:${b}`);
    }),
    ready: vi.fn(async () => {
      tfCalls.push('ready');
    }),
    getBackend: () => (setBackendShouldFail ? 'cpu' : 'webgl'),
  },
  TinyFaceDetectorOptions: class {
    constructor(opts) {
      this.opts = opts;
    }
  },
  detectSingleFace: vi.fn((input, opts) => {
    detectCalls.push({ w: input.width, h: input.height, opts: opts.opts });
    return chain();
  }),
}));

async function freshDetector() {
  vi.resetModules();
  loadCalls.length = 0;
  detectCalls.length = 0;
  tfCalls.length = 0;
  warmCalls.length = 0;
  return import('./detector.js');
}

beforeEach(() => {
  detectResult = null;
  loadShouldFail = false;
  setBackendShouldFail = false;
});

describe('モデルの読み込み', () => {
  it('4つのモデルを、顔ベクトルを最後にして読む', async () => {
    const det = await freshDetector();
    await det.loadModels();
    expect(loadCalls).toEqual([
      'tinyFaceDetector:/models',
      'faceLandmark68Net:/models',
      'ageGenderNet:/models',
      'faceRecognitionNet:/models',
    ]);
  });

  it('進捗を5段階で報告する（ライブラリ + 4モデル + ウォームアップ）', async () => {
    const det = await freshDetector();
    const steps = [];
    await det.loadModels((done, total) => steps.push(`${done}/${total}`));
    expect(steps).toEqual(['1/5', '2/5', '3/5', '4/5', '5/5', '5/5']);
  });

  it('2回呼んでも読み込みは1回だけ', async () => {
    const det = await freshDetector();
    await det.loadModels();
    await det.loadModels();
    expect(loadCalls.length).toBe(4);
  });

  it('同時に呼んでも読み込みは1回だけ', async () => {
    const det = await freshDetector();
    await Promise.all([det.loadModels(), det.loadModels(), det.loadModels()]);
    expect(loadCalls.length).toBe(4);
  });

  it('バックエンドに webgl を明示指定する', async () => {
    const det = await freshDetector();
    await det.loadModels();
    expect(tfCalls).toContain('setBackend:webgl');
    expect(det.backendName()).toBe('webgl');
  });

  it('webgl が使えなくても ready を待って続行する', async () => {
    setBackendShouldFail = true;
    const det = await freshDetector();
    await expect(det.loadModels()).resolves.toBeUndefined();
    expect(tfCalls).toEqual(['ready']);
  });

  it('読み込み中にウォームアップの推論を1回走らせる', async () => {
    const det = await freshDetector();
    await det.loadModels();
    expect(detectCalls.length).toBe(1);
    expect(detectCalls[0]).toMatchObject({ w: 320, h: 320 });
  });

  it('ウォームアップで重い3つのネットを全部通す', async () => {
    // 検出チェーンだけを空打ちすると、顔の無い画像では検出時点で短絡し、
    // landmark / age-gender / descriptor が一度もコンパイルされない。
    // それだと撮影後に12秒待たされるので、各ネットを直接叩いていることを縛る。
    const det = await freshDetector();
    await det.loadModels();
    expect(warmCalls).toEqual(['landmarks', 'ageGender', 'descriptor']);
  });

  it('失敗したら reject し、次回はやり直せる', async () => {
    loadShouldFail = true;
    const det = await freshDetector();
    await expect(det.loadModels()).rejects.toThrow('network down');

    loadShouldFail = false;
    await expect(det.loadModels()).resolves.toBeUndefined();
    expect(loadCalls.length).toBe(4);
  });

  it('ウォームアップが失敗しても読み込み自体は成功する', async () => {
    const det = await freshDetector();
    const spy = vi.spyOn(document, 'createElement').mockImplementation(() => {
      throw new Error('canvas unavailable');
    });
    await expect(det.loadModels()).resolves.toBeUndefined();
    expect(loadCalls.length).toBe(4);
    spy.mockRestore();
  });

  it('読み込む前の backendName は null', async () => {
    const det = await freshDetector();
    expect(det.backendName()).toBeNull();
  });
});

describe('顔の解析', () => {
  const canvas = () => {
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 480;
    return c;
  };

  it('顔が見つからなければ null を返す', async () => {
    const det = await freshDetector();
    detectResult = null;
    expect(await det.analyzeFace(canvas())).toBeNull();
  });

  it('検出結果を {age, gender, genderProb, descriptor} に詰め替える', async () => {
    const det = await freshDetector();
    detectResult = {
      age: 41.7,
      gender: 'female',
      genderProbability: 0.93,
      descriptor: Float32Array.from({ length: 128 }, (_, i) => i / 1000),
    };
    const face = await det.analyzeFace(canvas());
    expect(face.age).toBeCloseTo(41.7, 5);
    expect(face.gender).toBe('female');
    expect(face.genderProb).toBeCloseTo(0.93, 5);
    expect(Array.isArray(face.descriptor)).toBe(true); // Float32Array のままだと保存できない
    expect(face.descriptor.length).toBe(128);
    expect(face.descriptor[5]).toBeCloseTo(0.005, 6);
  });

  it('想定外の性別は unknown に丸める', async () => {
    const det = await freshDetector();
    detectResult = { age: 30, gender: 'n/a', genderProbability: 0.5, descriptor: new Float32Array(128) };
    expect((await det.analyzeFace(canvas())).gender).toBe('unknown');
  });

  it('読み込み前に呼んでも、内部で読み込んでから解析する', async () => {
    const det = await freshDetector();
    detectResult = { age: 30, gender: 'male', genderProbability: 0.8, descriptor: new Float32Array(128) };
    await det.analyzeFace(canvas());
    expect(loadCalls.length).toBe(4);
  });

  it('検出のしきい値と入力サイズを指定している', async () => {
    const det = await freshDetector();
    await det.analyzeFace(canvas());
    expect(detectCalls.at(-1).opts).toEqual({ inputSize: 416, scoreThreshold: 0.4 });
  });
});
