// @vitest-environment jsdom
// 学習データの入り口。ここが壊れるとデータが1件も集まらない。
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { allRecords, clearRecords } from '../db/store.js';
import { renderRegisterForm } from './register.js';

import { waitFor } from '../test/helpers.js';
const face = () => ({
  descriptor: new Array(128).fill(0.05),
  age: 34,
  gender: 'female',
  genderProb: 0.88,
});
const PHOTO = 'data:image/jpeg;base64,AAAA';

beforeEach(async () => {
  await clearRecords();
});

describe('登録フォーム', () => {
  it('銘柄を選ぶまで登録ボタンは押せない', () => {
    const node = renderRegisterForm({ face: face(), dataUrl: PHOTO, onSaved: () => {} });
    const save = node.querySelector('button.primary');
    expect(save.hasAttribute('disabled')).toBe(true);
    node.querySelector('[data-brand="kool"]').click();
    expect(save.hasAttribute('disabled')).toBe(false);
  });

  it('選んだ銘柄・写真・顔ベクトルを保存する', async () => {
    const onSaved = vi.fn();
    const node = renderRegisterForm({ face: face(), dataUrl: PHOTO, onSaved });
    node.querySelector('[data-brand="seven-stars"]').click();
    node.querySelector('input.text').value = '  たろう  ';
    node.querySelector('button.primary').click();
    const all = await waitFor(async () => {
      const r = await allRecords();
      return r.length === 1 ? r : null;
    });
    expect(all[0].brandId).toBe('seven-stars');
    expect(all[0].label).toBe('たろう'); // 前後の空白は落とす
    expect(all[0].photo).toBe(PHOTO);
    expect(all[0].face.age).toBe(34);
    expect(all[0].face.gender).toBe('female');
    expect(all[0].face.descriptor.length).toBe(128);
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it('同意チェックの状態を持ち越す', async () => {
    const node = renderRegisterForm({ face: face(), dataUrl: PHOTO, onSaved: () => {} });
    node.querySelector('[data-brand="mevius"]').click();
    node.querySelector('.check input[type="checkbox"]').checked = true;
    node.querySelector('button.primary').click();
    const saved = await waitFor(async () => (await allRecords())[0]);
    expect(saved.consent).toBe(true);
  });

  it('写真が無くても（ベクトルだけでも）登録できる', async () => {
    const node = renderRegisterForm({ face: face(), dataUrl: null, onSaved: () => {} });
    node.querySelector('[data-brand="iqos"]').click();
    node.querySelector('button.primary').click();
    const all = await waitFor(async () => {
      const r = await allRecords();
      return r.length === 1 ? r : null;
    });
    expect(all[0].photo).toBeNull();
  });

  it('保存できたら画面に伝える', async () => {
    const node = renderRegisterForm({ face: face(), dataUrl: PHOTO, onSaved: () => {} });
    node.querySelector('[data-brand="glo"]').click();
    node.querySelector('button.primary').click();
    await waitFor(() => node.textContent.includes('登録しました'));
  });

  it('保存に失敗したら理由を出し、ボタンを押し直せる', async () => {
    const broken = { ...face(), descriptor: [1, 2, 3] }; // 次元が違う
    const node = renderRegisterForm({ face: broken, dataUrl: PHOTO, onSaved: () => {} });
    node.querySelector('[data-brand="glo"]').click();
    const save = node.querySelector('button.primary');
    save.click();
    await waitFor(() => node.textContent.includes('登録できませんでした'));
    expect(save.hasAttribute('disabled')).toBe(false);
    expect(await allRecords()).toEqual([]);
  });

  it('端末の外に出ないことを画面で断っている', () => {
    const node = renderRegisterForm({ face: face(), dataUrl: PHOTO, onSaved: () => {} });
    expect(node.textContent).toContain('この端末の中だけ');
    expect(node.textContent).toContain('同意');
  });
});
