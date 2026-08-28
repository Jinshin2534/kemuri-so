import { describe, it, expect } from 'vitest';
import { BRANDS, CATEGORIES, CATEGORY_LABELS, getBrand, brandsByCategory } from './brands.js';

describe('銘柄マスタ', () => {
  it('29件ある', () => {
    expect(BRANDS.length).toBe(29);
  });

  it('IDが重複していない', () => {
    const ids = BRANDS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('全銘柄のカテゴリが CATEGORIES に含まれる', () => {
    for (const b of BRANDS) {
      expect(CATEGORIES).toContain(b.category);
    }
  });

  it('全カテゴリに日本語ラベルがあり、銘柄が1件以上ある', () => {
    for (const c of CATEGORIES) {
      expect(CATEGORY_LABELS[c]).toBeTruthy();
      expect(brandsByCategory(c).length).toBeGreaterThan(0);
    }
  });

  it('weight は正の数', () => {
    for (const b of BRANDS) {
      expect(b.weight).toBeGreaterThan(0);
    }
  });

  it('加熱式とVAPEの tarBand は null、それ以外は3段階のいずれか', () => {
    for (const b of BRANDS) {
      if (b.category === 'heated' || b.category === 'vape') {
        expect(b.tarBand).toBeNull();
      } else {
        expect(['light', 'mid', 'heavy']).toContain(b.tarBand);
      }
    }
  });

  it('色はCSSで使える16進数', () => {
    for (const b of BRANDS) {
      expect(b.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('getBrand はIDで引ける／無ければ undefined', () => {
    expect(getBrand('mevius').name).toBe('メビウス');
    expect(getBrand('nonexistent')).toBeUndefined();
  });

  it('上位20銘柄の重みが実シェアの順になっている（メビウス > セブンスター > キャメル）', () => {
    expect(getBrand('mevius').weight).toBeGreaterThan(getBrand('seven-stars').weight);
    expect(getBrand('seven-stars').weight).toBeGreaterThan(getBrand('camel').weight);
    expect(getBrand('camel').weight).toBeGreaterThan(getBrand('marlboro').weight);
  });
});
