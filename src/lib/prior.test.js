import { describe, it, expect } from 'vitest';
import { BRANDS } from './brands.js';
import { ageBandOf, buildPrior, smokingRateFor } from './prior.js';

const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

describe('事前分布', () => {
  it('年齢を年代帯に落とす', () => {
    expect(ageBandOf(19)).toBe('20s');
    expect(ageBandOf(25)).toBe('20s');
    expect(ageBandOf(35)).toBe('30s');
    expect(ageBandOf(49)).toBe('40s');
    expect(ageBandOf(50)).toBe('50s');
    expect(ageBandOf(65)).toBe('60s');
    expect(ageBandOf(72)).toBe('70s+');
  });

  it('全銘柄をキーに持ち、合計が1になる', () => {
    const p = buildPrior({ age: 40, gender: 'male' });
    expect(Object.keys(p).length).toBe(BRANDS.length);
    expect(sum(p)).toBeCloseTo(1, 6);
  });

  it('確率はすべて正', () => {
    const p = buildPrior({ age: 40, gender: 'male' });
    for (const v of Object.values(p)) expect(v).toBeGreaterThan(0);
  });

  it('若いほうがアイコスの確率が高い', () => {
    const young = buildPrior({ age: 24, gender: 'male' });
    const old = buildPrior({ age: 68, gender: 'male' });
    expect(young.iqos).toBeGreaterThan(old.iqos);
  });

  it('年上のほうがセブンスターの確率が高い', () => {
    const young = buildPrior({ age: 24, gender: 'male' });
    const old = buildPrior({ age: 68, gender: 'male' });
    expect(old['seven-stars']).toBeGreaterThan(young['seven-stars']);
  });

  it('女性のほうがメンソールの確率が高い', () => {
    const male = buildPrior({ age: 30, gender: 'male' });
    const female = buildPrior({ age: 30, gender: 'female' });
    expect(female['mevius-menthol']).toBeGreaterThan(male['mevius-menthol']);
  });

  it('gender が unknown でも動き、男女の中間になる', () => {
    const male = buildPrior({ age: 30, gender: 'male' });
    const female = buildPrior({ age: 30, gender: 'female' });
    const unknown = buildPrior({ age: 30, gender: 'unknown' });
    expect(sum(unknown)).toBeCloseTo(1, 6);
    const lo = Math.min(male['mevius-menthol'], female['mevius-menthol']);
    const hi = Math.max(male['mevius-menthol'], female['mevius-menthol']);
    expect(unknown['mevius-menthol']).toBeGreaterThan(lo);
    expect(unknown['mevius-menthol']).toBeLessThan(hi);
  });

  it('同じ入力なら必ず同じ出力（決定論）', () => {
    expect(buildPrior({ age: 41, gender: 'female' })).toEqual(buildPrior({ age: 41, gender: 'female' }));
  });

  it('喫煙率の補足を年代・性別つきで返す', () => {
    const r = smokingRateFor({ age: 45, gender: 'male' });
    expect(r.value).toBeCloseTo(0.334, 3); // 令和5年 国民健康・栄養調査の実数
    expect(r.estimated).toBe(false);
    expect(r.source).toBeTruthy();
  });

  it('喫煙率は40代男性が最も高く、70歳以上女性が最も低い（実データの形）', () => {
    const peak = smokingRateFor({ age: 45, gender: 'male' }).value;
    for (const [age, gender] of [[25, 'male'], [75, 'male'], [45, 'female'], [25, 'female']]) {
      expect(smokingRateFor({ age, gender }).value).toBeLessThan(peak);
    }
    expect(smokingRateFor({ age: 75, gender: 'female' }).value).toBeLessThan(0.05);
  });
});
