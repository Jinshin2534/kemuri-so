// 公開統計テーブル。
//
// 重要: 「紙巻きたばこの銘柄 × 年代」のクロス集計は世の中に公開されていない。
// なので実データで固められるのは
//   (1) 年代・性別ごとの喫煙率
//   (2) 加熱式 と 紙巻き の比率、および加熱式の年代別の偏り
// の2つだけで、それ以外は推定値になる。
// 推定値は estimated: true を立て、画面上でも「推定」と表示する。

import { CATEGORIES } from './brands.js';

const SRC_MHLW = '厚生労働省「令和5年 国民健康・栄養調査」';
const SRC_RELAZO = 'リラゾ「加熱式たばこ人気シェア率調査」2026年1月, n=4,529';

export const SOURCES = Object.freeze([
  {
    id: 'mhlw',
    title: SRC_MHLW,
    url: 'https://www.mhlw.go.jp/content/10900000/001338334.pdf',
    note: '習慣的な喫煙者の割合は全体15.7%、男性25.6%、女性6.9%。40〜50代男性は3割を超える。',
  },
  {
    id: 'relazo',
    title: SRC_RELAZO,
    url: 'https://relazo.net/tabacco-share/',
    note: '加熱式ユーザー4,529名へのネット調査。紙巻きの総シェアは57.56%。加熱式デバイスの年代別内訳あり。銘柄別の内訳は無い。',
  },
]);

const real = (value, source) => Object.freeze({ value, source, estimated: false });
const guess = (value, source = null) => Object.freeze({ value, source, estimated: true });

export const AGE_BANDS = Object.freeze(['20s', '30s', '40s', '50s', '60s+']);

export const AGE_BAND_LABELS = Object.freeze({
  '20s': '20代',
  '30s': '30代',
  '40s': '40代',
  '50s': '50代',
  '60s+': '60代以上',
});

// 喫煙率。全体・男女は実データ。年代別は「40〜50代男性が3割超」という記述しか
// 公開されていないので、そこに整合する形で置いた推定値。
export const SMOKING_RATE = Object.freeze({
  all: real(0.157, SRC_MHLW),
  male: real(0.256, SRC_MHLW),
  female: real(0.069, SRC_MHLW),
  byBand: Object.freeze({
    '20s':  Object.freeze({ male: guess(0.24, SRC_MHLW), female: guess(0.08, SRC_MHLW) }),
    '30s':  Object.freeze({ male: guess(0.30, SRC_MHLW), female: guess(0.09, SRC_MHLW) }),
    '40s':  Object.freeze({ male: guess(0.33, SRC_MHLW), female: guess(0.10, SRC_MHLW) }),
    '50s':  Object.freeze({ male: guess(0.31, SRC_MHLW), female: guess(0.09, SRC_MHLW) }),
    '60s+': Object.freeze({ male: guess(0.17, SRC_MHLW), female: guess(0.04, SRC_MHLW) }),
  }),
});

// カテゴリ間のシェア。加熱式 42.44% は「紙巻き総シェア 57.56%」の裏返しで実データ。
// 残りの 57.56% をどう割るかは公開データが無いため推定。合計はちょうど 1 になる。
export const CATEGORY_SHARE = Object.freeze({
  heated:      real(0.4244, SRC_RELAZO),
  regular:     guess(0.3000),
  menthol:     guess(0.2200),
  rollyourown: guess(0.0250),
  littlecigar: guess(0.0200),
  vape:        guess(0.0106),
});

// 年代の偏り係数。1.0 が「その年代でも全体と同じ割合」の意味。
// 加熱式だけは「若い世代ほど加熱式の割合が多い（20代女性約61%、30代全体49.9%）」という
// 調査記述から導いた推定。他は完全な推定。
export const CATEGORY_AGE_SKEW = Object.freeze({
  heated:      Object.freeze({ '20s': guess(1.50, SRC_RELAZO), '30s': guess(1.25, SRC_RELAZO), '40s': guess(1.00, SRC_RELAZO), '50s': guess(0.75, SRC_RELAZO), '60s+': guess(0.50, SRC_RELAZO) }),
  regular:     Object.freeze({ '20s': guess(0.65), '30s': guess(0.85), '40s': guess(1.00), '50s': guess(1.25), '60s+': guess(1.50) }),
  menthol:     Object.freeze({ '20s': guess(1.30), '30s': guess(1.15), '40s': guess(1.00), '50s': guess(0.85), '60s+': guess(0.70) }),
  rollyourown: Object.freeze({ '20s': guess(1.40), '30s': guess(1.20), '40s': guess(1.00), '50s': guess(0.80), '60s+': guess(0.60) }),
  littlecigar: Object.freeze({ '20s': guess(0.80), '30s': guess(0.90), '40s': guess(1.00), '50s': guess(1.15), '60s+': guess(1.30) }),
  vape:        Object.freeze({ '20s': guess(1.60), '30s': guess(1.20), '40s': guess(1.00), '50s': guess(0.70), '60s+': guess(0.50) }),
});

// 性別の偏り係数。すべて推定。
export const CATEGORY_GENDER_SKEW = Object.freeze({
  heated:      Object.freeze({ male: guess(0.95), female: guess(1.20) }),
  regular:     Object.freeze({ male: guess(1.15), female: guess(0.60) }),
  menthol:     Object.freeze({ male: guess(0.90), female: guess(1.45) }),
  rollyourown: Object.freeze({ male: guess(1.20), female: guess(0.70) }),
  littlecigar: Object.freeze({ male: guess(1.10), female: guess(0.80) }),
  vape:        Object.freeze({ male: guess(1.00), female: guess(1.00) }),
});

export function allStats() {
  const out = [SMOKING_RATE.all, SMOKING_RATE.male, SMOKING_RATE.female];
  for (const band of AGE_BANDS) {
    out.push(SMOKING_RATE.byBand[band].male, SMOKING_RATE.byBand[band].female);
  }
  for (const c of CATEGORIES) {
    out.push(CATEGORY_SHARE[c]);
    for (const band of AGE_BANDS) out.push(CATEGORY_AGE_SKEW[c][band]);
    out.push(CATEGORY_GENDER_SKEW[c].male, CATEGORY_GENDER_SKEW[c].female);
  }
  return out;
}
