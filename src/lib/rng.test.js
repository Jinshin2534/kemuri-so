import { describe, it, expect } from 'vitest';
import { makeRng, shuffle } from './rng.js';

describe('種つき乱数', () => {
  it('0以上1未満を返す', () => {
    const rng = makeRng(1);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('同じ種なら同じ列', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('違う種なら違う列', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });
});

describe('シャッフル', () => {
  it('要素を失わない', () => {
    const src = [1, 2, 3, 4, 5];
    expect(shuffle(src, makeRng(7)).sort((a, b) => a - b)).toEqual(src);
  });

  it('元の配列を壊さない', () => {
    const src = [1, 2, 3, 4, 5];
    shuffle(src, makeRng(7));
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });

  it('同じ種なら同じ並び', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(src, makeRng(3))).toEqual(shuffle(src, makeRng(3)));
  });
});
