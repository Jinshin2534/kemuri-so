// @vitest-environment jsdom
// 判定結果の表示。撮影とモデルは通さず、infer の結果から画面を作る部分だけを見る。
import { describe, it, expect } from 'vitest';
import { infer } from '../lib/infer.js';
import { getBrand } from '../lib/brands.js';
import { el } from './dom.js';
import { renderResult } from './judge.js';

const vec = (first = 0) => {
  const v = new Array(128).fill(0);
  v[0] = first;
  return v;
};
const rec = (brandId, first) => ({ brandId, face: { descriptor: vec(first) } });
const face = (over = {}) => ({ age: 42, gender: 'male', descriptor: vec(0), ...over });

describe('判定結果の表示', () => {
  it('上位3銘柄をバーで出す', () => {
    const result = infer({ face: face(), records: [] });
    const node = renderResult({ result, face: face() });
    const bars = node.querySelectorAll('.bar');
    expect(bars.length).toBe(3);
    expect(bars[0].querySelector('.bname').textContent).toBe(getBrand(result.top[0].brandId).name);
  });

  it('バーの長さが確率に対応している', () => {
    const result = infer({ face: face(), records: [] });
    const node = renderResult({ result, face: face() });
    const width = node.querySelector('.bar .track i').style.width;
    expect(width).toBe(`${(result.top[0].p * 100).toFixed(1)}%`);
  });

  it('寄与の内訳を必ず出す', () => {
    const node = renderResult({ result: infer({ face: face(), records: [] }), face: face() });
    const text = node.querySelector('.breakdown').textContent;
    expect(text).toContain('統計 100%');
    expect(text).toContain('手元のデータ 0%');
  });

  it('免責を必ず出す', () => {
    const node = renderResult({ result: infer({ face: face(), records: [] }), face: face() });
    expect(node.querySelector('.notes').textContent).toContain('科学的根拠はありません');
  });

  it('写真を渡せば出し、渡さなければ img を作らない', () => {
    const result = infer({ face: face(), records: [] });
    const withPhoto = renderResult({ result, face: face(), dataUrl: 'data:image/jpeg;base64,AAAA' });
    expect(withPhoto.querySelector('img.shot')).not.toBeNull();
    const without = renderResult({ result, face: face() });
    expect(without.querySelector('img.shot')).toBeNull();
  });

  it('extra を理由と免責のあいだに差し込む', () => {
    const extra = el('div', { id: 'extra-slot' });
    const node = renderResult({ result: infer({ face: face(), records: [] }), face: face(), extra });
    const kids = [...node.children];
    expect(kids.indexOf(extra)).toBeGreaterThan(kids.indexOf(node.querySelector('.reasons')));
    expect(kids.indexOf(extra)).toBeLessThan(kids.indexOf(node.querySelector('.notes')));
  });

  it('登録があると理由の文面が変わる', () => {
    const records = [rec('kool', 0.01), rec('kool', 0.02)];
    const node = renderResult({ result: infer({ face: face(), records }), face: face() });
    const reasons = node.querySelector('.reasons').textContent;
    expect(reasons).toContain('クール');
    expect(reasons).not.toContain('効いていません');
  });
});
