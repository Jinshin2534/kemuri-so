// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeRecord } from '../lib/record.js';
import { exportRecords } from '../lib/io.js';
import { allRecords, putRecords, clearRecords } from '../db/store.js';
import { SOURCES } from '../lib/stats.js';
import { renderData, loadSeedOnce } from './data.js';

import { waitFor } from '../test/helpers.js';
const mk = (id, brandId = 'mevius', photo = 'data:image/jpeg;base64,AAAA') =>
  makeRecord({
    id, createdAt: 1000, label: id, brandId,
    face: { descriptor: new Array(128).fill(0.1), age: 30, gender: 'male', genderProb: 0.9 },
    photo, consent: true,
  });

beforeEach(async () => {
  await clearRecords();
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  delete globalThis.fetch;
});

describe('種データの読み込み', () => {
  it('seed.json があれば取り込む', async () => {
    const seed = exportRecords([mk('s1'), mk('s2')], { now: 1 });
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => seed }));
    expect(await loadSeedOnce()).toBe(2);
    expect((await allRecords()).map((r) => r.id).sort()).toEqual(['s1', 's2']);
  });

  it('2回目以降は取りに行かない', async () => {
    const seed = exportRecords([mk('s1')], { now: 1 });
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => seed }));
    globalThis.fetch = fetchSpy;
    await loadSeedOnce();
    expect(await loadSeedOnce()).toBe(0);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('seed.json が無くても静かに0件で済ませる', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 404 }));
    expect(await loadSeedOnce()).toBe(0);
  });

  it('壊れた seed.json でも例外にしない', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ version: 999 }) }));
    expect(await loadSeedOnce()).toBe(0);
  });

  it('通信そのものが失敗しても例外にしない', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('offline');
    });
    expect(await loadSeedOnce()).toBe(0);
  });
});

describe('データ画面', () => {
  it('件数と写真つきの数を出す', async () => {
    await putRecords([mk('a'), mk('b'), mk('c', 'iqos', null)]);
    const page = await renderData();
    expect(page.querySelector('.lead').textContent).toContain('3 件');
    expect(page.querySelector('.lead').textContent).toContain('写真つき 2 件');
  });

  it('出典を全部リンクつきで並べる', async () => {
    const page = await renderData();
    const links = [...page.querySelectorAll('.sources a')];
    expect(links.length).toBe(SOURCES.length);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(SOURCES.map((s) => s.url));
    for (const a of links) expect(a.getAttribute('href')).toMatch(/^https:\/\//);
  });

  it('推定値がいくつあるかを正直に出す', async () => {
    const page = await renderData();
    expect(page.textContent).toMatch(/数値 \d+ 個のうち、\d+ 個は推定値/);
    expect(page.textContent).toContain('銘柄 × 年代');
  });

  it('既定の書き出しに写真が入らない', async () => {
    await putRecords([mk('a')]);
    const page = await renderData();
    let written = null;
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
    globalThis.URL.revokeObjectURL = vi.fn();
    globalThis.Blob = class {
      constructor(parts) {
        written = parts.join('');
      }
    };
    page.querySelectorAll('button').forEach((b) => {
      if (b.textContent === '書き出す') b.click();
    });
    expect(written).not.toBeNull();
    expect(written).not.toContain('data:image');
    expect(JSON.parse(written).records[0].photo).toBeNull();
  });

  it('チェックを入れると写真を含める', async () => {
    await putRecords([mk('a')]);
    const page = await renderData();
    let written = null;
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
    globalThis.URL.revokeObjectURL = vi.fn();
    globalThis.Blob = class {
      constructor(parts) {
        written = parts.join('');
      }
    };
    page.querySelector('.check input[type="checkbox"]').checked = true;
    page.querySelectorAll('button').forEach((b) => {
      if (b.textContent === '書き出す') b.click();
    });
    expect(JSON.parse(written).records[0].photo).toContain('data:image');
  });

  it('全削除は確認を取り、断れば消さない', async () => {
    await putRecords([mk('a'), mk('b')]);
    const page = await renderData();
    globalThis.confirm = vi.fn(() => false);
    page.querySelector('button.danger').click();
    await new Promise((r) => setTimeout(r, 20));
    expect((await allRecords()).length).toBe(2); // 断ったので消えていない

    globalThis.confirm = vi.fn(() => true);
    page.querySelector('button.danger').click();
    await waitFor(async () => (await allRecords()).length === 0);
  });
});
