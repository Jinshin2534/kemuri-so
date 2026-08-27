import { describe, it, expect } from 'vitest';
import { BRANDS } from './brands.js';
import { infer, faceWeight, DEFAULT_INFER } from './infer.js';

const vec = (first = 0) => {
  const v = new Array(128).fill(0);
  v[0] = first;
  return v;
};
const rec = (brandId, first) => ({ brandId, face: { descriptor: vec(first) } });
const face = (over = {}) => ({ age: 40, gender: 'male', descriptor: vec(0), ...over });
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

describe('顔の重み', () => {
  it('登録0件なら0', () => {
    expect(faceWeight(0)).toBe(0);
  });

  it('k件たまると 0.5 になる', () => {
    expect(faceWeight(DEFAULT_INFER.k)).toBeCloseTo(0.5, 10);
  });

  it('件数が増えると単調に増え、1を超えない', () => {
    let prev = -1;
    for (const n of [0, 1, 5, 20, 100, 1000]) {
      const w = faceWeight(n);
      expect(w).toBeGreaterThan(prev);
      expect(w).toBeLessThan(1);
      prev = w;
    }
  });
});

describe('推論の合成', () => {
  it('登録0件のとき事後分布は事前分布と完全に一致する', () => {
    const r = infer({ face: face(), records: [] });
    expect(r.w).toBe(0);
    for (const id of Object.keys(r.prior)) {
      expect(r.posterior[id]).toBeCloseTo(r.prior[id], 12);
    }
  });

  it('登録0件のとき手元データの寄与は0、統計の寄与は1', () => {
    const r = infer({ face: face(), records: [] });
    expect(r.contribution.data).toBeCloseTo(0, 12);
    expect(r.contribution.stats).toBeCloseTo(1, 12);
  });

  it('事後分布は全26銘柄を持ち、合計が1', () => {
    const r = infer({ face: face(), records: [rec('mevius', 0.01)] });
    expect(Object.keys(r.posterior).length).toBe(BRANDS.length);
    expect(sum(r.posterior)).toBeCloseTo(1, 10);
  });

  it('寄与率は合計1で、どちらも0以上', () => {
    const records = Array.from({ length: 30 }, (_, i) => rec('wakaba', 0.001 * i));
    const r = infer({ face: face(), records });
    expect(r.contribution.data + r.contribution.stats).toBeCloseTo(1, 10);
    expect(r.contribution.data).toBeGreaterThan(0);
    expect(r.contribution.stats).toBeGreaterThanOrEqual(0);
  });

  it('近い顔の登録が十分たまると、統計では弱い銘柄でも1位になる', () => {
    const weak = infer({ face: face(), records: [] });
    const weakRank = Object.entries(weak.posterior).sort((a, b) => b[1] - a[1]).findIndex(([id]) => id === 'wakaba');
    expect(weakRank).toBeGreaterThan(0);

    const records = Array.from({ length: 60 }, (_, i) => rec('wakaba', 0.0005 * i));
    const r = infer({ face: face(), records });
    expect(r.top[0].brandId).toBe('wakaba');
  });

  it('top は上位3件が確率の降順で並ぶ', () => {
    const r = infer({ face: face(), records: [rec('iqos', 0.01)] });
    expect(r.top.length).toBe(3);
    expect(r.top[0].p).toBeGreaterThanOrEqual(r.top[1].p);
    expect(r.top[1].p).toBeGreaterThanOrEqual(r.top[2].p);
  });

  it('同じ入力なら必ず同じ結果（決定論）', () => {
    const args = { face: face(), records: [rec('iqos', 0.01), rec('kool', 0.4)] };
    expect(infer(args)).toEqual(infer(args));
  });

  it('登録件数を n として返す', () => {
    const r = infer({ face: face(), records: [rec('iqos', 0.01), rec('kool', 0.4)] });
    expect(r.n).toBe(2);
  });
});
