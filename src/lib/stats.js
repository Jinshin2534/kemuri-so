// 公開統計テーブル。
//
// 実データで固められるもの（2026-08-29 時点）:
//   (1) 年代・性別ごとの喫煙率 …… 厚労省 国民健康・栄養調査 第73表（e-Stat から取得）
//   (2) 紙巻 / 加熱式 / リトルシガー の販売数量 …… 日本たばこ協会
//   (3) 紙巻たばこの銘柄別シェア …… 日本たばこ協会「上位20銘柄推移」
//
// 実データが無いもの:
//   - 銘柄 × 年代 のクロス集計。どこも公表していないので CATEGORY_AGE_SKEW は推定のまま
//   - 紙巻きのレギュラー / メンソールの内訳。上位20銘柄からは割り出せない
//
// 推定値は estimated: true を立て、画面上でも「推定」と表示する。

import { CATEGORIES } from './brands.js';

const SRC_MHLW = '厚生労働省「令和5年 国民健康・栄養調査」第73表（e-Stat）';
const SRC_TIOJ_VOL = '日本たばこ協会「2025年度 販売実績」（紙巻782億本・加熱式734億本・リトルシガー約25億本）';
const SRC_TIOJ_BRAND = '日本たばこ協会「紙巻たばこ上位20銘柄推移」令和7年度（2025年度）';
const SRC_RELAZO = 'リラゾ「加熱式たばこ人気シェア率調査」2026年1月, n=4,529';

export const SOURCES = Object.freeze([
  {
    id: 'mhlw',
    title: SRC_MHLW,
    url: 'https://www.e-stat.go.jp/stat-search/files?tstat=000001041744&stat_infid=000040276090',
    note: '年齢階級（20代〜70歳以上の6区分）×男女で「毎日吸っている」「時々吸う日がある」の割合が載っている。喫煙率はこの表の実数を使っている。',
  },
  {
    id: 'tioj-volume',
    title: SRC_TIOJ_VOL,
    url: 'https://www.tioj.or.jp/data/',
    note: '業界団体の公式販売実績。紙巻・加熱式・リトルシガーの区分別に販売数量が出ている。カテゴリ間のシェアはここから計算している（人数ではなく本数のシェアである点に注意）。',
  },
  {
    id: 'tioj-brand',
    title: SRC_TIOJ_BRAND,
    url: 'https://www.tioj.or.jp/data/',
    note: '紙巻たばこの銘柄別シェアが品目単位で載っている。セブンスター7.1%、メビウス系8.4%、キャメル系6.2%など。銘柄の重みはこれをブランド単位に足し上げて作った。上位20銘柄で市場の約3割なので、裾は反映されていない。',
  },
  {
    id: 'relazo',
    title: SRC_RELAZO,
    url: 'https://relazo.net/tabacco-share/',
    note: '加熱式ユーザー4,529名へのネット調査。加熱式デバイスの年代別内訳と、アイコス/グロー/プルームの比率の根拠。',
  },
]);

const real = (value, source) => Object.freeze({ value, source, estimated: false });
const guess = (value, source = null) => Object.freeze({ value, source, estimated: true });

// 6区分。厚労省の表の区切りにそのまま合わせてある。
export const AGE_BANDS = Object.freeze(['20s', '30s', '40s', '50s', '60s', '70s+']);

export const AGE_BAND_LABELS = Object.freeze({
  '20s': '20代',
  '30s': '30代',
  '40s': '40代',
  '50s': '50代',
  '60s': '60代',
  '70s+': '70歳以上',
});

// 喫煙率。「現在習慣的に喫煙している者」＝「毎日吸っている」＋「時々吸う日がある」。
// 第73表の各セルを足したもので、推定は入っていない。
export const SMOKING_RATE = Object.freeze({
  all: real(0.157, SRC_MHLW),
  male: real(0.256, SRC_MHLW),
  female: real(0.069, SRC_MHLW),
  byBand: Object.freeze({
    '20s':  Object.freeze({ male: real(0.205, SRC_MHLW), female: real(0.052, SRC_MHLW) }),
    '30s':  Object.freeze({ male: real(0.299, SRC_MHLW), female: real(0.087, SRC_MHLW) }),
    '40s':  Object.freeze({ male: real(0.334, SRC_MHLW), female: real(0.101, SRC_MHLW) }),
    '50s':  Object.freeze({ male: real(0.316, SRC_MHLW), female: real(0.118, SRC_MHLW) }),
    '60s':  Object.freeze({ male: real(0.285, SRC_MHLW), female: real(0.070, SRC_MHLW) }),
    '70s+': Object.freeze({ male: real(0.163, SRC_MHLW), female: real(0.023, SRC_MHLW) }),
  }),
});

// カテゴリ間のシェア。
// 加熱式・紙巻・リトルシガーは日本たばこ協会の2025年度販売数量から計算した実データ。
//   紙巻 782億本 / 加熱式 734億本 / リトルシガー 約25億本
// 手巻き（シャグ）とVAPEはこの統計に含まれないので、全体の3%を占めると仮定して足し、
// 合計が1になるように正規化してある。その2つだけが推定。
export const CATEGORY_SHARE = Object.freeze({
  heated:      real(0.462, SRC_TIOJ_VOL),
  regular:     guess(0.295, SRC_TIOJ_BRAND), // 紙巻49.2%をレギュラー6:メンソール4で割った推定
  menthol:     guess(0.197, SRC_TIOJ_BRAND),
  littlecigar: real(0.016, SRC_TIOJ_VOL),
  rollyourown: guess(0.020),
  vape:        guess(0.010),
});

// 年代の偏り係数。1.0 が「その年代でも全体と同じ割合」の意味。
// 加熱式だけは「若い世代ほど加熱式の割合が多い（20代女性約61%、30代全体49.9%）」という
// 調査記述から導いた推定。他は完全な推定。
// 銘柄×年代のクロス集計はどこも公表していないので、ここは実データにできていない。
export const CATEGORY_AGE_SKEW = Object.freeze({
  heated:      Object.freeze({ '20s': guess(1.50, SRC_RELAZO), '30s': guess(1.25, SRC_RELAZO), '40s': guess(1.00, SRC_RELAZO), '50s': guess(0.75, SRC_RELAZO), '60s': guess(0.55, SRC_RELAZO), '70s+': guess(0.40, SRC_RELAZO) }),
  regular:     Object.freeze({ '20s': guess(0.65), '30s': guess(0.85), '40s': guess(1.00), '50s': guess(1.25), '60s': guess(1.45), '70s+': guess(1.60) }),
  menthol:     Object.freeze({ '20s': guess(1.30), '30s': guess(1.15), '40s': guess(1.00), '50s': guess(0.85), '60s': guess(0.75), '70s+': guess(0.65) }),
  rollyourown: Object.freeze({ '20s': guess(1.40), '30s': guess(1.20), '40s': guess(1.00), '50s': guess(0.80), '60s': guess(0.65), '70s+': guess(0.55) }),
  littlecigar: Object.freeze({ '20s': guess(0.80), '30s': guess(0.90), '40s': guess(1.00), '50s': guess(1.15), '60s': guess(1.25), '70s+': guess(1.35) }),
  vape:        Object.freeze({ '20s': guess(1.60), '30s': guess(1.20), '40s': guess(1.00), '50s': guess(0.70), '60s': guess(0.55), '70s+': guess(0.45) }),
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
