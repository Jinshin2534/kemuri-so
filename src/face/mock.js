// カメラを使わずに検証するための偽の顔。
// 同じ seed なら必ず同じ顔ベクトルを返すので、ヘッドレスでも結果を突き合わせられる。

import { makeRng } from '../lib/rng.js';

export function mockFace(seed = 1) {
  const rng = makeRng(seed);
  return {
    age: 20 + Math.floor(rng() * 50),
    gender: rng() < 0.5 ? 'male' : 'female',
    genderProb: 0.8 + rng() * 0.2,
    descriptor: Array.from({ length: 128 }, () => rng() * 0.2 - 0.1),
  };
}
