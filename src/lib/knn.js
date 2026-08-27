// 登録済みレコードの顔ベクトルとの距離から、銘柄ごとの尤度を作る。
//
//   score(銘柄) = Σ exp(-d² / 2σ²)          … 近いレコードほど強く効く
//   αeff        = α·√(1 + Σscore) / 銘柄数   … 平滑化で0を作らない
//   L(銘柄)     = (score + αeff) / Σ(score + αeff)
//
// 平滑化を固定値にしてはいけない。face-api の顔ベクトルは他人同士だと距離が1前後になり、
// exp(-1/2σ²) は 0.02 程度にしかならない。固定 α=0.5 を26銘柄ぶん足すと合計13になり、
// 手元のデータの声（合計1前後）が完全に飲まれてしまう。
// 実際、60件登録しても事後分布がほとんど動かないという形で表に出た。
//
// √ にしているのは、証拠が増えるほど平滑化を緩めつつ、
// 「1件しかないのに言い切る」ことも防ぐため。
// 登録0件なら Σscore=0 で全銘柄が同じ値になり、結果は一様分布になる。

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

  let evidence = 0;
  for (const id of Object.keys(score)) evidence += score[id];

  const ids = Object.keys(score);
  const alphaEff = (alpha * Math.sqrt(1 + evidence)) / ids.length;

  let total = 0;
  for (const id of ids) {
    score[id] += alphaEff;
    total += score[id];
  }

  const out = {};
  for (const id of ids) out[id] = score[id] / total;
  return out;
}
