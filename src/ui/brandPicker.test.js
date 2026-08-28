// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { BRANDS, CATEGORIES, CATEGORY_LABELS } from '../lib/brands.js';
import { renderBrandPicker } from './brandPicker.js';

describe('銘柄の選択', () => {
  it('全銘柄をボタンとして出す', () => {
    const node = renderBrandPicker({ onPick: () => {} });
    expect(node.querySelectorAll('.chip').length).toBe(BRANDS.length);
  });

  it('カテゴリごとの見出しがある', () => {
    const node = renderBrandPicker({ onPick: () => {} });
    const heads = [...node.querySelectorAll('.pickcat')].map((h) => h.textContent);
    expect(heads).toEqual(CATEGORIES.map((c) => CATEGORY_LABELS[c]));
  });

  it('押すと銘柄IDを返す', () => {
    const onPick = vi.fn();
    const node = renderBrandPicker({ onPick });
    node.querySelector('[data-brand="seven-stars"]').click();
    expect(onPick).toHaveBeenCalledWith('seven-stars');
  });

  it('選択は常に1つだけ', () => {
    const node = renderBrandPicker({ onPick: () => {} });
    node.querySelector('[data-brand="mevius"]').click();
    node.querySelector('[data-brand="iqos"]').click();
    const on = [...node.querySelectorAll('.chip.on')];
    expect(on.length).toBe(1);
    expect(on[0].dataset.brand).toBe('iqos');
  });

  it('selected を渡すと最初から選ばれている', () => {
    const node = renderBrandPicker({ onPick: () => {}, selected: 'kool' });
    expect(node.querySelector('.chip.on').dataset.brand).toBe('kool');
  });

  it('ロゴや画像を一切使わない（テキストと色帯だけ）', () => {
    const node = renderBrandPicker({ onPick: () => {} });
    expect(node.querySelectorAll('img, svg').length).toBe(0);
    for (const chip of node.querySelectorAll('.chip')) {
      expect(chip.textContent.trim().length).toBeGreaterThan(0);
    }
  });
});
