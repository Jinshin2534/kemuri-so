// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { makeRecord } from '../lib/record.js';
import { allRecords, putRecords, clearRecords } from '../db/store.js';
import { renderRecords } from './records.js';

import { waitFor } from '../test/helpers.js';
const mk = (id, brandId, { photo = 'data:image/jpeg;base64,AAAA', createdAt = 1000, label = id } = {}) =>
  makeRecord({
    id, createdAt, label, brandId,
    face: { descriptor: new Array(128).fill(0.1), age: 30, gender: 'male', genderProb: 0.9 },
    photo, consent: true,
  });

beforeEach(async () => {
  await clearRecords();
});

describe('登録一覧', () => {
  it('0件なら誘導文を出す', async () => {
    const page = await renderRecords();
    expect(page.querySelectorAll('.rec').length).toBe(0);
    expect(page.textContent).toContain('まだ登録がありません');
  });

  it('件数と、端末外に出ないことを出す', async () => {
    await putRecords([mk('a', 'mevius'), mk('b', 'iqos')]);
    const page = await renderRecords();
    expect(page.querySelector('.lead').textContent).toContain('2 件');
    expect(page.querySelector('.lead').textContent).toContain('端末の外に出ません');
  });

  it('新しいものが上に来る', async () => {
    await putRecords([
      mk('old', 'mevius', { createdAt: 1000 }),
      mk('new', 'iqos', { createdAt: 3000 }),
      mk('mid', 'kool', { createdAt: 2000 }),
    ]);
    const page = await renderRecords();
    const labels = [...page.querySelectorAll('.rec strong')].map((n) => n.textContent);
    expect(labels).toEqual(['new', 'mid', 'old']);
  });

  it('写真があればサムネ、無ければ「ベクトルのみ」と出す', async () => {
    await putRecords([mk('withPhoto', 'mevius'), mk('noPhoto', 'iqos', { photo: null })]);
    const page = await renderRecords();
    const rows = [...page.querySelectorAll('.rec')];
    const noPhotoRow = rows.find((r) => r.textContent.includes('noPhoto'));
    const photoRow = rows.find((r) => r.textContent.includes('withPhoto'));
    expect(photoRow.querySelector('img.thumb')).not.toBeNull();
    expect(noPhotoRow.querySelector('img.thumb')).toBeNull();
    expect(noPhotoRow.querySelector('.thumb.none').textContent).toBe('ベクトルのみ');
  });

  it('銘柄名と色帯を出す（ロゴ画像は使わない）', async () => {
    await putRecords([mk('a', 'seven-stars')]);
    const page = await renderRecords();
    expect(page.querySelector('.recbrand').textContent).toContain('セブンスター');
    expect(page.querySelector('.recbrand .swatch')).not.toBeNull();
  });

  it('名前が無ければ「（名前なし）」', async () => {
    await putRecords([mk('a', 'mevius', { label: '' })]);
    const page = await renderRecords();
    expect(page.querySelector('.rec strong').textContent).toBe('（名前なし）');
  });

  it('削除するとDBからも消え、一覧が描き直される', async () => {
    await putRecords([mk('a', 'mevius'), mk('b', 'iqos')]);
    const page = await renderRecords();
    expect(page.querySelectorAll('.rec').length).toBe(2);

    page.querySelector('.rec .del').click();
    await waitFor(() => page.querySelectorAll('.rec').length === 1);
    expect((await allRecords()).length).toBe(1);
  });

  it('「新しく登録する」で撮影の流れに切り替わる', async () => {
    const page = await renderRecords();
    expect(page.querySelector('.flow')).toBeNull();
    page.querySelector('button.primary').click();
    expect(page.querySelector('.flow')).not.toBeNull();
    expect(page.querySelector('.capture')).not.toBeNull();
  });
});
