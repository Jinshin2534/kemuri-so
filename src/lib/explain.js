// 判定結果を日本語にする。
// 判定そのものは infer で確定しているので、ここは言い換えるだけ。
// 「今回どれだけ統計に頼ったか」を必ず出すのがこのモジュールの役目。

import { getBrand, CATEGORY_LABELS } from './brands.js';
import { AGE_BAND_LABELS } from './stats.js';
import { ageBandOf, smokingRateFor } from './prior.js';

const GENDER_LABELS = { male: '男性', female: '女性', unknown: '性別不明' };

export function formatPercent(v, digits = 0) {
  return `${(v * 100).toFixed(digits)}%`;
}

function argmax(dist) {
  return Object.entries(dist).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
}

export function explain(result, face) {
  const band = ageBandOf(face.age);
  const bandLabel = AGE_BAND_LABELS[band];
  const genderLabel = GENDER_LABELS[face.gender] ?? GENDER_LABELS.unknown;
  const topBrand = getBrand(result.top[0].brandId);

  const reasons = [];
  reasons.push(
    `顔から推定したのは ${Math.round(face.age)}歳・${genderLabel}。${bandLabel}の${genderLabel}として見ています。`,
  );

  const [priorTopId, priorTopP] = argmax(result.prior);
  reasons.push(
    `${bandLabel}${genderLabel}の統計だけで見ると、いちばん多いのは${getBrand(priorTopId).name}（${formatPercent(priorTopP, 1)}）です。`,
  );

  if (result.n === 0) {
    reasons.push(
      '登録データがまだ0件なので、顔そのものは判定に効いていません。今の結果は統計だけで出しています。',
    );
  } else {
    const [likeTopId] = argmax(result.likelihood);
    reasons.push(
      `登録データ${result.n}件のうち、顔が近い人に多いのは${getBrand(likeTopId).name}でした。`,
    );
  }

  const rate = smokingRateFor(face);
  const notes = [
    `補足: ${bandLabel}${genderLabel}の喫煙率は約${formatPercent(rate.value)}${rate.estimated ? '（推定）' : ''}。出典: ${rate.source}`,
    '顔から銘柄が分かるという科学的根拠はありません。遊びとして見てください。',
  ];

  return {
    headline: `${topBrand.name}（${CATEGORY_LABELS[topBrand.category]}）`,
    breakdown: `統計 ${formatPercent(result.contribution.stats)} ／ 顔 ${formatPercent(result.contribution.face)}`,
    reasons,
    notes,
  };
}
