// 登録済みレコードの顔ベクトルとの距離から、銘柄ごとの尤度を作る。
//
//   score(銘柄) = Σ exp(-d² / 2σ²)     … 近いレコードほど強く効く
//   L(銘柄)     = (score + α) / Σ(score + α)   … ラプラス平滑化で0を作らない
//
// 登録0件なら全銘柄が α になるので、結果は一様分布になる。これは意図した動作で、
// infer 側で「顔はまだ効いていない」状態として扱われる。

import { BRANDS } from './brands.js';

export const DEFAULT_KNN = Object.freeze({ sigma: 0.35, alpha: 0.5 });

export function euclidean(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

export function likelihood(descriptor, records, config = {}) {
  const { sigma, alpha } = { ...DEFAULT_KNN, ...config };
  const twoSigmaSq = 2 * sigma * sigma;

  const score = {};
  for (const b of BRANDS) score[b.id] = 0;

  for (const r of records) {
    if (!(r.brandId in score)) continue;
    const d = euclidean(descriptor, r.face.descriptor);
    score[r.brandId] += Math.exp(-(d * d) / twoSigmaSq);
  }

  let total = 0;
  for (const id of Object.keys(score)) {
    score[id] += alpha;
    total += score[id];
  }

  const out = {};
  for (const id of Object.keys(score)) out[id] = score[id] / total;
  return out;
}
