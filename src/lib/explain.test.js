import { describe, it, expect } from 'vitest';
import { getBrand, CATEGORY_LABELS } from './brands.js';
import { infer } from './infer.js';
import { explain, formatPercent } from './explain.js';

const vec = (first = 0) => {
  const v = new Array(128).fill(0);
  v[0] = first;
  return v;
};
const rec = (brandId, first) => ({ brandId, face: { descriptor: vec(first) } });
const face = (over = {}) => ({ age: 42, gender: 'male', descriptor: vec(0), ...over });

describe('文章化', () => {
  it('パーセント表記を作る', () => {
    expect(formatPercent(0.823)).toBe('82%');
    expect(formatPercent(0.823, 1)).toBe('82.3%');
  });

  it('見出しに1位の銘柄名とカテゴリが入る', () => {
    const r = infer({ face: face(), records: [] });
    const e = explain(r, face());
    const top = getBrand(r.top[0].brandId);
    expect(e.headline).toContain(top.name);
    expect(e.headline).toContain(CATEGORY_LABELS[top.category]);
  });

  it('内訳に統計と手元データの両方が入る', () => {
    const e = explain(infer({ face: face(), records: [] }), face());
    expect(e.breakdown).toContain('統計');
    expect(e.breakdown).toContain('手元のデータ');
  });

  it('登録0件なら「顔は効いていない」と明言する', () => {
    const e = explain(infer({ face: face(), records: [] }), face());
    expect(e.reasons.join('')).toContain('効いていません');
  });

  it('登録があれば顔の近い人の銘柄に触れる', () => {
    const records = [rec('kool', 0.01), rec('kool', 0.02)];
    const e = explain(infer({ face: face(), records }), face());
    expect(e.reasons.join('')).toContain('クール');
    expect(e.reasons.join('')).not.toContain('効いていません');
  });

  it('補足に喫煙率と出典が入る', () => {
    const e = explain(infer({ face: face(), records: [] }), face());
    const notes = e.notes.join('');
    expect(notes).toContain('喫煙率');
    expect(notes).toContain('厚生労働省');
  });

  it('免責が必ず入る', () => {
    const e = explain(infer({ face: face(), records: [] }), face());
    expect(e.notes.join('')).toContain('科学的根拠はありません');
  });

  it('推定年齢と性別に触れる', () => {
    const f = face({ age: 25, gender: 'female' });
    const e = explain(infer({ face: f, records: [] }), f);
    expect(e.reasons.join('')).toContain('20代');
    expect(e.reasons.join('')).toContain('女性');
  });

  it('同じ入力なら同じ文章（決定論）', () => {
    const r = infer({ face: face(), records: [rec('kool', 0.01)] });
    expect(explain(r, face())).toEqual(explain(r, face()));
  });
});
