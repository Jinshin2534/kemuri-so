// face-api の薄いラッパ。
// 1回の推論で 年齢・性別・128次元の顔ベクトル が同時に取れる。
//
// 重みは合計約7.1MB あり、その大半（6.3MB）は顔ベクトルを作る face_recognition_model。
// face-api のライブラリ本体も 1.3MB ある。どちらもホーム画面では読まず、
// 判定や登録に入ったときに初めて読む（そのため import まで動的にしている）。
// 2回目以降はブラウザキャッシュが効く。

export const MODEL_URL = '/models';

let faceapi = null;
let loaded = null;

export function loadModels(onProgress) {
  if (loaded) return loaded;
  loaded = (async () => {
    faceapi = await import('@vladmandic/face-api');
    const nets = [
      faceapi.nets.tinyFaceDetector,
      faceapi.nets.faceLandmark68Net,
      faceapi.nets.ageGenderNet,
      faceapi.nets.faceRecognitionNet, // 最大。最後に読む
    ];
    for (let i = 0; i < nets.length; i++) {
      await nets[i].loadFromUri(MODEL_URL);
      onProgress?.(i + 1, nets.length);
    }
  })().catch((e) => {
    loaded = null; // 失敗したら次回やり直せるようにする
    throw e;
  });
  return loaded;
}

export async function analyzeFace(input) {
  await loadModels();
  const result = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
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
