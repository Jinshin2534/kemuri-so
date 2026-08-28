// @vitest-environment jsdom
// ルーターと免責ゲート。画面の入り口なので、ここが壊れると何も表示されない。
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { el } from './dom.js';
import { registerRoute, go, start, state } from './app.js';
import { passGate } from './gate.js';

import { waitFor } from '../test/helpers.js';

const tick = (n = 0) => new Promise((r) => setTimeout(r, n));

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  localStorage.clear();
  location.hash = '';
  globalThis.fetch = vi.fn(async () => ({ ok: false, status: 404 })); // seed.json 無し
  registerRoute('', () => el('div', { class: 'page', id: 'home' }, 'ホーム'));
  registerRoute('judge', () => el('div', { class: 'page', id: 'judge' }, '判定'));
  registerRoute('quiz', async () => {
    await tick();
    return el('div', { class: 'page', id: 'quiz' }, 'クイズ');
  });
});

afterEach(() => {
  delete globalThis.fetch;
});

describe('免責ゲート', () => {
  it('通過していなければ、ルートに関係なくゲートだけ出す', async () => {
    location.hash = '#/judge';
    start();
    await waitFor(() => document.querySelector('.gate') !== null);
    expect(document.querySelector('#judge')).toBeNull();
    expect(document.querySelector('.topbar')).toBeNull();
  });

  it('ゲートを通すと、その場で本編に切り替わる', async () => {
    start();
    await waitFor(() => document.querySelector('.gate button') !== null);
    document.querySelector('.gate button').click();
    await waitFor(() => document.querySelector('#home') !== null);
    expect(document.querySelector('.gate')).toBeNull();
  });
});

describe('ルーティング', () => {
  beforeEach(() => {
    passGate();
  });

  it('ハッシュ無しならホームを出す', async () => {
    start();
    await waitFor(() => document.querySelector('.page') !== null);
    expect(document.querySelector('#home')).not.toBeNull();
  });

  it('ハッシュに応じた画面を出す', async () => {
    location.hash = '#/judge';
    start();
    await waitFor(() => document.querySelector('.page') !== null);
    expect(document.querySelector('#judge')).not.toBeNull();
  });

  it('知らないルートはホームに落とす', async () => {
    location.hash = '#/nonexistent';
    start();
    await waitFor(() => document.querySelector('.page') !== null);
    expect(document.querySelector('#home')).not.toBeNull();
  });

  it('ハッシュが変わると描き直す', async () => {
    start();
    await waitFor(() => document.querySelector('.page') !== null);
    location.hash = '#/judge';
    window.dispatchEvent(new Event('hashchange'));
    await waitFor(() => document.querySelector('#judge') !== null);
    expect(document.querySelector('#home')).toBeNull();
  });

  it('go() でも移動できる', async () => {
    start();
    await waitFor(() => document.querySelector('.page') !== null);
    go('judge');
    window.dispatchEvent(new Event('hashchange'));
    await waitFor(() => document.querySelector('#judge') !== null);
    expect(location.hash).toBe('#/judge');
  });

  it('同じルートへの go() でも描き直す', async () => {
    location.hash = '#/judge';
    start();
    await waitFor(() => document.querySelector('.page') !== null);
    const first = document.querySelector('#judge');
    go('judge');
    await waitFor(() => document.querySelector('#judge') !== first);
  });

  it('非同期の画面は、出来上がるまで読み込み中を見せる', async () => {
    // 解決のタイミングをテスト側で握る。そうしないと、描画が速すぎて
    // 読み込み中の状態を観測できないまま通ってしまう（実際それで揺れた）。
    let finish;
    registerRoute('slow', () => new Promise((resolve) => { finish = resolve; }));
    location.hash = '#/slow';
    start();

    await waitFor(() => document.querySelector('.loading') !== null);
    expect(document.querySelector('#slow')).toBeNull();

    finish(el('div', { class: 'page', id: 'slow' }, 'おそい'));
    await waitFor(() => document.querySelector('#slow') !== null);
    expect(document.querySelector('.loading')).toBeNull();
  });
});

describe('外枠', () => {
  beforeEach(() => {
    passGate();
  });

  it('ヘッダに4つの行き先、フッタに免責を出す', async () => {
    start();
    await waitFor(() => document.querySelector('.page') !== null);
    const nav = [...document.querySelectorAll('.nav a')].map((a) => a.getAttribute('href'));
    expect(nav).toEqual(['#/judge', '#/quiz', '#/records', '#/data']);
    expect(document.querySelector('.foot').textContent).toContain('科学的根拠はありません');
    expect(document.querySelector('.foot').textContent).toContain('端末から出ません');
  });

  it('検証用のフックを生やす', async () => {
    start();
    await waitFor(() => document.querySelector('.page') !== null);
    expect(typeof window.__app.go).toBe('function');
    expect(window.__app.state).toBe(state);
  });
});
