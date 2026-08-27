// 銘柄マスタ。
// weight は「同じカテゴリの中での相対的な人気度」で、すべて推定値。
// 銘柄単位のシェアは公開されていないため、カテゴリ間のシェアだけを stats.js が出典つきで持ち、
// カテゴリの中の配分をここが担当する。weight の絶対値に意味はなく、比だけを使う。

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
  // --- 紙巻き レギュラー ---
  { id: 'mevius',          name: 'メビウス',             maker: 'JT',  category: 'regular', tarBand: 'light', weight: 24, color: '#2e5fa3' },
  { id: 'seven-stars',     name: 'セブンスター',         maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 20, color: '#1b1b1b' },
  { id: 'marlboro',        name: 'マールボロ',           maker: 'PM',  category: 'regular', tarBand: 'heavy', weight: 16, color: '#b3111d' },
  { id: 'winston',         name: 'ウィンストン',         maker: 'JT',  category: 'regular', tarBand: 'mid',   weight: 12, color: '#c8562a' },
  { id: 'parliament',      name: 'パーラメント',         maker: 'PM',  category: 'regular', tarBand: 'light', weight: 8,  color: '#6f8fb8' },
  { id: 'lark',            name: 'ラーク',               maker: 'PM',  category: 'regular', tarBand: 'mid',   weight: 8,  color: '#3f6f4a' },
  { id: 'camel',           name: 'キャメル',             maker: 'JT',  category: 'regular', tarBand: 'mid',   weight: 6,  color: '#b58b3a' },
  { id: 'kent',            name: 'ケント',               maker: 'BAT', category: 'regular', tarBand: 'mid',   weight: 6,  color: '#4a6b8a' },
  { id: 'peace',           name: 'ピース',               maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 5,  color: '#1f4f8f' },
  { id: 'american-spirit', name: 'アメリカンスピリット', maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 5,  color: '#f0c419' },
  { id: 'hope',            name: 'ホープ',               maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 3,  color: '#2b6e5f' },
  { id: 'hi-lite',         name: 'ハイライト',           maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 3,  color: '#1c4f9c' },
  { id: 'wakaba',          name: 'わかば',               maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 3,  color: '#6f8f3a' },
  { id: 'echo',            name: 'エコー',               maker: 'JT',  category: 'regular', tarBand: 'heavy', weight: 2,  color: '#8a6f4a' },

  // --- 紙巻き メンソール ---
  { id: 'mevius-menthol',   name: 'メビウス・メンソール',   maker: 'JT',  category: 'menthol', tarBand: 'light', weight: 22, color: '#1f8f7a' },
  { id: 'marlboro-menthol', name: 'マールボロ・メンソール', maker: 'PM',  category: 'menthol', tarBand: 'mid',   weight: 18, color: '#0f7a4f' },
  { id: 'kool',             name: 'クール',                 maker: 'BAT', category: 'menthol', tarBand: 'mid',   weight: 10, color: '#2f9fbf' },
  { id: 'kent-menthol',     name: 'ケント・メンソール',     maker: 'BAT', category: 'menthol', tarBand: 'mid',   weight: 9,  color: '#3f8f9f' },
  { id: 'pianissimo',       name: 'ピアニッシモ',           maker: 'JT',  category: 'menthol', tarBand: 'light', weight: 9,  color: '#c07fa8' },
  { id: 'lark-menthol',     name: 'ラーク・メンソール',     maker: 'PM',  category: 'menthol', tarBand: 'mid',   weight: 7,  color: '#4f9f6f' },

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
