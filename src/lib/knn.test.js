import { describe, it, expect } from 'vitest';
import { BRANDS } from './brands.js';
import { euclidean, likelihood } from './knn.js';

// 128次元のテスト用ベクトル。1要素だけ値を変えて距離を作る。
const vec = (first = 0) => {
  const v = new Array(128).fill(0);
  v[0] = first;
  return v;
};
const rec = (brandId, first) => ({ brandId, face: { descriptor: vec(first) } });
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

describe('kNN尤度', () => {
  it('ユークリッド距離を計算する', () => {
    expect(euclidean([0, 0], [3, 4])).toBeCloseTo(5, 10);
    expect(euclidean(vec(0), vec(0))).toBe(0);
  });

  it('登録0件なら一様分布になる', () => {
    const l = likelihood(vec(0), []);
    expect(Object.keys(l).length).toBe(BRANDS.length);
    for (const v of Object.values(l)) expect(v).toBeCloseTo(1 / BRANDS.length, 10);
  });

  it('合計が1になる', () => {
    const l = likelihood(vec(0), [rec('mevius', 0.01), rec('iqos', 0.9)]);
    expect(sum(l)).toBeCloseTo(1, 10);
  });

  it('顔が近いレコードの銘柄が最も高くなる', () => {
    const l = likelihood(vec(0), [rec('mevius', 0.01), rec('iqos', 2.0)]);
    const top = Object.entries(l).sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe('mevius');
  });

  it('遠いレコードしか無ければほぼ一様のまま', () => {
    const l = likelihood(vec(0), [rec('mevius', 50)]);
    expect(l.mevius).toBeCloseTo(1 / BRANDS.length, 3);
  });

  it('同じ銘柄のレコードが増えるほどその銘柄が強くなる', () => {
    const one = likelihood(vec(0), [rec('iqos', 0.01)]);
    const three = likelihood(vec(0), [rec('iqos', 0.01), rec('iqos', 0.02), rec('iqos', 0.03)]);
    expect(three.iqos).toBeGreaterThan(one.iqos);
  });

  it('全ての銘柄が0より大きい（平滑化が効いている）', () => {
    const l = likelihood(vec(0), [rec('mevius', 0.01)]);
    for (const v of Object.values(l)) expect(v).toBeGreaterThan(0);
  });

  it('未知の銘柄IDを持つレコードは無視する', () => {
    const l = likelihood(vec(0), [{ brandId: 'unknown-brand', face: { descriptor: vec(0.01) } }]);
    for (const v of Object.values(l)) expect(v).toBeCloseTo(1 / BRANDS.length, 10);
  });
});
