// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { el, clear, mount } from './dom.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

describe('el', () => {
  it('タグを作る', () => {
    expect(el('p').tagName).toBe('P');
  });

  it('class / text / 任意の属性を付ける', () => {
    const n = el('a', { class: 'card', text: 'ホーム', href: '#/', 'data-x': '1' });
    expect(n.className).toBe('card');
    expect(n.textContent).toBe('ホーム');
    expect(n.getAttribute('href')).toBe('#/');
    expect(n.dataset.x).toBe('1');
  });

  it('onClick などのハンドラを登録する', () => {
    const spy = vi.fn();
    el('button', { onClick: spy }).click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('null と undefined の属性は無視する', () => {
    const n = el('img', { src: null, alt: undefined, width: '10' });
    expect(n.hasAttribute('src')).toBe(false);
    expect(n.hasAttribute('alt')).toBe(false);
    expect(n.getAttribute('width')).toBe('10');
  });

  it('文字列・数値・要素・配列を子として受け取り、入れ子の配列も平らにする', () => {
    const n = el('div', {}, 'あ', 1, el('b', { text: 'い' }), [el('i'), [el('u')]]);
    expect(n.childNodes.length).toBe(5);
    expect(n.textContent).toBe('あ1い');
  });

  it('null / undefined / false の子は飛ばす（条件付き描画のため）', () => {
    const n = el('div', {}, 'あ', null, undefined, false, 'い');
    expect(n.childNodes.length).toBe(2);
  });
});

describe('clear', () => {
  it('子をすべて取り除く', () => {
    const n = el('div', {}, el('p'), el('p'), 'text');
    clear(n);
    expect(n.childNodes.length).toBe(0);
  });

  it('空の要素に呼んでも壊れない', () => {
    const n = el('div');
    clear(n);
    expect(n.childNodes.length).toBe(0);
  });
});

describe('mount', () => {
  it('#app の中身を差し替える', () => {
    document.getElementById('app').append(el('p', { text: '古い' }));
    mount(el('h1', { text: '新しい' }));
    const app = document.getElementById('app');
    expect(app.childNodes.length).toBe(1);
    expect(app.textContent).toBe('新しい');
  });
});
