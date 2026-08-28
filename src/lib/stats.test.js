import { describe, it, expect } from 'vitest';
import { CATEGORIES } from './brands.js';
import {
  AGE_BANDS, AGE_BAND_LABELS, SMOKING_RATE,
  CATEGORY_SHARE, CATEGORY_AGE_SKEW, CATEGORY_GENDER_SKEW,
  SOURCES, allStats,
} from './stats.js';

describe('統計テーブル', () => {
  it('全ての数値が value / source / estimated の形をしている', () => {
    const stats = allStats();
    expect(stats.length).toBeGreaterThan(0);
    for (const s of stats) {
      expect(typeof s.value).toBe('number');
      expect(Number.isFinite(s.value)).toBe(true);
      expect(typeof s.estimated).toBe('boolean');
      expect(s.source === null || typeof s.source === 'string').toBe(true);
    }
  });

  it('推定でない数値には必ず出典がある', () => {
    for (const s of allStats()) {
      if (!s.estimated) expect(s.source).toBeTruthy();
    }
  });

  it('カテゴリシェアは全カテゴリを覆い、合計が1になる', () => {
    expect(Object.keys(CATEGORY_SHARE).sort()).toEqual([...CATEGORIES].sort());
    const sum = Object.values(CATEGORY_SHARE).reduce((a, s) => a + s.value, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('年代・性別の偏り係数は全カテゴリ×全年代で正の値', () => {
    for (const c of CATEGORIES) {
      for (const band of AGE_BANDS) {
        expect(CATEGORY_AGE_SKEW[c][band].value).toBeGreaterThan(0);
      }
      expect(CATEGORY_GENDER_SKEW[c].male.value).toBeGreaterThan(0);
      expect(CATEGORY_GENDER_SKEW[c].female.value).toBeGreaterThan(0);
    }
  });

  it('加熱式は若い年代ほど係数が大きい', () => {
    const h = CATEGORY_AGE_SKEW.heated;
    expect(h['20s'].value).toBeGreaterThan(h['40s'].value);
    expect(h['40s'].value).toBeGreaterThan(h['70s+'].value);
  });

  it('全年代帯に日本語ラベルがある', () => {
    for (const band of AGE_BANDS) expect(AGE_BAND_LABELS[band]).toBeTruthy();
  });

  it('喫煙率は男性のほうが女性より高い（令和5年調査の実データ）', () => {
    expect(SMOKING_RATE.male.value).toBeGreaterThan(SMOKING_RATE.female.value);
    expect(SMOKING_RATE.male.estimated).toBe(false);
  });

  it('年代別の喫煙率はすべて実データで、推定が混じっていない', () => {
    for (const band of AGE_BANDS) {
      expect(SMOKING_RATE.byBand[band].male.estimated).toBe(false);
      expect(SMOKING_RATE.byBand[band].female.estimated).toBe(false);
    }
  });

  it('年代帯は厚労省の表と同じ6区分', () => {
    expect(AGE_BANDS).toEqual(['20s', '30s', '40s', '50s', '60s', '70s+']);
  });

  it('加熱式とリトルシガーのシェアは販売実績からの実データ', () => {
    expect(CATEGORY_SHARE.heated.estimated).toBe(false);
    expect(CATEGORY_SHARE.littlecigar.estimated).toBe(false);
  });

  it('出典一覧にURLがある', () => {
    expect(SOURCES.length).toBeGreaterThan(0);
    for (const s of SOURCES) expect(s.url).toMatch(/^https:\/\//);
  });
});
