// 事前分布と kNN 尤度を合成する。
//
//   posterior(b) ∝ prior(b) × L(b)^w      w = n / (n + k)
//
// w は「顔をどれだけ信じるか」。登録0件なら w=0 で L^0=1 になり、
// 事後分布は事前分布そのものになる（テストで保証している）。
//
// contribution は「事前分布からどれだけ動いたか」を total variation distance で測ったもの。
// これを画面に出すことで、判定がまだ統計頼みであることを隠さずに済む。
//
// 名前を data にしているのは、動かしているのが「顔の近さ」だけではないから。
// 手元のレコードが特定の銘柄に偏っていれば、顔が似ていなくても分布は動く。
// それを「顔が◯%効いた」と書くのは言い過ぎになる。

import { buildPrior } from './prior.js';
import { likelihood } from './knn.js';

export const DEFAULT_INFER = Object.freeze({ k: 20, topN: 3 });

export function faceWeight(n, k = DEFAULT_INFER.k) {
  return n / (n + k);
}

export function infer({ face, records = [], config = {} }) {
  const { k, topN, ...knnConfig } = { ...DEFAULT_INFER, ...config };

  const prior = buildPrior({ age: face.age, gender: face.gender });
  const n = records.length;
  const w = faceWeight(n, k);
  const like = likelihood(face.descriptor, records, knnConfig);

  const raw = {};
  let total = 0;
  for (const id of Object.keys(prior)) {
    const v = prior[id] * Math.pow(like[id], w);
    raw[id] = v;
    total += v;
  }

  const posterior = {};
  for (const id of Object.keys(raw)) posterior[id] = raw[id] / total;

  let tv = 0;
  for (const id of Object.keys(prior)) tv += Math.abs(posterior[id] - prior[id]);
  const dataContribution = tv / 2;

  const top = Object.entries(posterior)
    .map(([brandId, p]) => ({ brandId, p }))
    .sort((a, b) => b.p - a.p || a.brandId.localeCompare(b.brandId))
    .slice(0, topN);

  return {
    prior,
    likelihood: like,
    posterior,
    top,
    n,
    w,
    contribution: { data: dataContribution, stats: 1 - dataContribution },
  };
}
