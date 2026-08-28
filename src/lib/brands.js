// 銘柄マスタ。
//
// weight は「同じカテゴリの中での相対的な人気度」。比だけを使うので絶対値に意味はない。
//
// 紙巻きレギュラーの weight は、日本たばこ協会「紙巻たばこ上位20銘柄推移」令和7年度（2025年度）の
// 品目別シェアをブランド単位に足し上げた実データ（×10）。たとえば
//   セブンスター 4.4 + 2.7 = 7.1%   → 71
//   メビウス系（スーパーライト/ワン100'S/エクストラライト/無印ほか）= 8.4% → 84
//   キャメル・クラフト系 = 6.2%（うちメンソール 1.0%）
// 上位20銘柄で市場のおよそ3割なので、そこに入らない銘柄は順位の分かる過去年度と
// 実売感から置いた推定値。
//
// メンソールの内訳は上位20銘柄からは割り出せないため推定。
// 加熱式はリラゾ調査（アイコス51.7%）を根拠にしている。

export const CATEGORIES = Object.freeze([
  'regular',
  'menthol',
  'heated',
  'rollyourown',
  'littlecigar',
  'vape',
]);

export const CATEGORY_LABELS = Object.freeze({
  regular: '紙巻き（レギュラー）',
  menthol: '紙巻き（メンソール）',
  heated: '加熱式',
  rollyourown: '手巻き（シャグ）',
  littlecigar: 'リトルシガー',
  vape: 'VAPE・電子たばこ',
});

export const BRANDS = Object.freeze([
  // --- 紙巻き レギュラー（weight は上位20銘柄の実シェア×10。裾の銘柄は推定）---
  { id: 'mevius',          name: 'メビウス',             maker: 'JT',  category: 'regular', tarBand: 'light', weight: 84, color: '#2e5fa3' },
  { id: 'seven-stars',     name: 'セブンスター',         maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 71, color: '#1b1b1b' },
  { id: 'camel',           name: 'キャメル',             maker: 'JT',  category: 'regular', tarBand: 'mid',   weight: 52, color: '#b58b3a' },
  { id: 'philip-morris',   name: 'フィリップ・モリス',   maker: 'PM',  category: 'regular', tarBand: 'light', weight: 14, color: '#8a6f9f' },
  { id: 'lucky-strike',    name: 'ラッキー・ストライク', maker: 'BAT', category: 'regular', tarBand: 'mid',   weight: 14, color: '#c0392b' },
  { id: 'winston',         name: 'ウィンストン',         maker: 'JT',  category: 'regular', tarBand: 'mid',   weight: 12, color: '#c8562a' },
  { id: 'kent',            name: 'ケント',               maker: 'BAT', category: 'regular', tarBand: 'mid',   weight: 12, color: '#4a6b8a' },
  { id: 'marlboro',        name: 'マールボロ',           maker: 'PM',  category: 'regular', tarBand: 'heavy', weight: 12, color: '#b3111d' },
  { id: 'peace',           name: 'ピース',               maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 8,  color: '#1f4f8f' },
  { id: 'american-spirit', name: 'アメリカンスピリット', maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 6,  color: '#f0c419' },
  { id: 'lark',            name: 'ラーク',               maker: 'PM',  category: 'regular', tarBand: 'mid',   weight: 6,  color: '#3f6f4a' },
  { id: 'parliament',      name: 'パーラメント',         maker: 'PM',  category: 'regular', tarBand: 'light', weight: 6,  color: '#6f8fb8' },
  { id: 'hope',            name: 'ホープ',               maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 4,  color: '#2b6e5f' },
  { id: 'wakaba',          name: 'わかば',               maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 3,  color: '#6f8f3a' },
  { id: 'hi-lite',         name: 'ハイライト',           maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 3,  color: '#1c4f9c' },
  { id: 'echo',            name: 'エコー',               maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 2,  color: '#8a6f4a' },

  // --- 紙巻き メンソール（キャメル・クラフト・メンソールのみ実データ、他は推定）---
  { id: 'mevius-menthol',   name: 'メビウス・メンソール',     maker: 'JT',  category: 'menthol', tarBand: 'light', weight: 40, color: '#1f8f7a' },
  { id: 'marlboro-menthol', name: 'マールボロ・メンソール',   maker: 'PM',  category: 'menthol', tarBand: 'mid',   weight: 30, color: '#0f7a4f' },
  { id: 'camel-menthol',    name: 'キャメル・クラフト・メンソール', maker: 'JT', category: 'menthol', tarBand: 'mid', weight: 25, color: '#7fae4a' },
  { id: 'kool',             name: 'クール',                   maker: 'BAT', category: 'menthol', tarBand: 'mid',   weight: 12, color: '#2f9fbf' },
  { id: 'kent-menthol',     name: 'ケント・メンソール',       maker: 'BAT', category: 'menthol', tarBand: 'mid',   weight: 12, color: '#3f8f9f' },
  { id: 'pianissimo',       name: 'ピアニッシモ',             maker: 'JT',  category: 'menthol', tarBand: 'light', weight: 10, color: '#c07fa8' },
  { id: 'lark-menthol',     name: 'ラーク・メンソール',       maker: 'PM',  category: 'menthol', tarBand: 'mid',   weight: 8,  color: '#4f9f6f' },

  // --- 加熱式 ---
  { id: 'iqos',  name: 'アイコス（テリア／センティア）', maker: 'PM',  category: 'heated', tarBand: null, weight: 52, color: '#00817f' },
  { id: 'glo',   name: 'グロー（ネオ）',                maker: 'BAT', category: 'heated', tarBand: null, weight: 28, color: '#7a4f9f' },
  { id: 'ploom', name: 'プルームX',                     maker: 'JT',  category: 'heated', tarBand: null, weight: 20, color: '#2f4f7f' },

  // --- その他 ---
  { id: 'shag',         name: '手巻き（シャグ）', maker: '各社', category: 'rollyourown', tarBand: 'mid',   weight: 10, color: '#8a6a3a' },
  { id: 'little-cigar', name: 'リトルシガー',     maker: '各社', category: 'littlecigar', tarBand: 'heavy', weight: 10, color: '#5a3a2a' },
  { id: 'vape',         name: 'VAPE・電子たばこ', maker: '各社', category: 'vape',        tarBand: null,    weight: 10, color: '#5f6f8f' },
]);

const BY_ID = new Map(BRANDS.map((b) => [b.id, b]));

export function getBrand(id) {
  return BY_ID.get(id);
}

export function brandsByCategory(category) {
  return BRANDS.filter((b) => b.category === category);
}
