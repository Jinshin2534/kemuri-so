// face-api の薄いラッパ。
// 1回の推論で 年齢・性別・128次元の顔ベクトル が同時に取れる。
//
// 重みは合計約7.1MB あり、その大半（6.3MB）は顔ベクトルを作る face_recognition_model。
// face-api のライブラリ本体も 1.3MB ある。どちらもホーム画面では読まず、
// 判定や登録に入ったときに初めて読む（そのため import まで動的にしている）。
// 2回目以降はブラウザキャッシュが効く。

export const MODEL_URL = '/models';
const STEPS = 5; // ライブラリ + 4モデル + ウォームアップ を進捗として数える

let faceapi = null;
let loaded = null;

function detectorOptions() {
  return new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
}

// 初回の推論は WebGL のシェーダをコンパイルするぶん極端に重い。
// 撮影ボタンを押したあとにそれを食らうと待たされ方がつらいので、
// 読み込みのうちに一度空打ちして済ませておく。
async function warmup() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  try {
    await faceapi
      .detectSingleFace(canvas, detectorOptions())
      .withFaceLandmarks()
      .withAgeAndGender()
      .withFaceDescriptor();
  } catch {
    // ウォームアップの失敗は致命的ではない。本番の推論でエラーを出せばよい。
  }
}

export function loadModels(onProgress) {
  if (loaded) return loaded;
  loaded = (async () => {
    faceapi = await import('@vladmandic/face-api');
    onProgress?.(1, STEPS);

    // バックエンドを明示する。放っておくと CPU に落ちることがあり、
    // ResNet を回すので桁違いに遅くなる。
    try {
      await faceapi.tf.setBackend('webgl');
      await faceapi.tf.ready();
    } catch {
      await faceapi.tf.ready();
    }

    const nets = [
      faceapi.nets.tinyFaceDetector,
      faceapi.nets.faceLandmark68Net,
      faceapi.nets.ageGenderNet,
      faceapi.nets.faceRecognitionNet, // 最大。最後に読む
    ];
    for (let i = 0; i < nets.length; i++) {
      await nets[i].loadFromUri(MODEL_URL);
      onProgress?.(i + 2, STEPS);
    }

    await warmup();
    onProgress?.(STEPS, STEPS);
  })().catch((e) => {
    loaded = null; // 失敗したら次回やり直せるようにする
    throw e;
  });
  return loaded;
}

export function backendName() {
  return faceapi?.tf?.getBackend?.() ?? null;
}

export async function analyzeFace(input) {
  await loadModels();
  const result = await faceapi
    .detectSingleFace(input, detectorOptions())
    .withFaceLandmarks()
    .withAgeAndGender()
    .withFaceDescriptor();

  if (!result) return null;

  return {
    age: result.age,
    gender: result.gender === 'male' || result.gender === 'female' ? result.gender : 'unknown',
    genderProb: result.genderProbability,
    descriptor: Array.from(result.descriptor),
  };
}
