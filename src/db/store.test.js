// IndexedDB を触る層のテスト。fake-indexeddb で本物と同じAPIを叩いている。
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { makeRecord, DESCRIPTOR_LENGTH } from '../lib/record.js';
import { allRecords, countRecords, putRecord, putRecords, deleteRecord, clearRecords } from './store.js';

const descriptor = () => new Array(DESCRIPTOR_LENGTH).fill(0.1);
const mk = (id, over = {}) =>
  makeRecord({
    id,
    createdAt: over.createdAt ?? 1000,
    label: id,
    brandId: over.brandId ?? 'mevius',
    face: { descriptor: descriptor(), age: 30, gender: 'male', genderProb: 0.9 },
    photo: over.photo ?? null,
    consent: true,
  });

beforeEach(async () => {
  await clearRecords();
});

describe('保存と取り出し', () => {
  it('保存したレコードを取り出せる', async () => {
    await putRecord(mk('a'));
    const all = await allRecords();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('a');
    expect(all[0].face.descriptor.length).toBe(DESCRIPTOR_LENGTH);
  });

  it('件数を数えられる', async () => {
    expect(await countRecords()).toBe(0);
    await putRecords([mk('a'), mk('b'), mk('c')]);
    expect(await countRecords()).toBe(3);
  });

  it('作成日時の昇順で返る', async () => {
    await putRecords([
      mk('c', { createdAt: 3000 }),
      mk('a', { createdAt: 1000 }),
      mk('b', { createdAt: 2000 }),
    ]);
    expect((await allRecords()).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('同じIDで保存し直すと上書きになり、件数は増えない', async () => {
    await putRecord(mk('a', { brandId: 'mevius' }));
    await putRecord(mk('a', { brandId: 'iqos' }));
    const all = await allRecords();
    expect(all.length).toBe(1);
    expect(all[0].brandId).toBe('iqos');
  });

  it('写真つきのレコードもそのまま往復する', async () => {
    const photo = 'data:image/jpeg;base64,AAAA';
    await putRecord(mk('a', { photo }));
    expect((await allRecords())[0].photo).toBe(photo);
  });
});

describe('削除', () => {
  it('IDを指定して消せる', async () => {
    await putRecords([mk('a'), mk('b')]);
    await deleteRecord('a');
    expect((await allRecords()).map((r) => r.id)).toEqual(['b']);
  });

  it('存在しないIDを消してもエラーにならない', async () => {
    await putRecord(mk('a'));
    await expect(deleteRecord('nope')).resolves.toBeUndefined();
    expect(await countRecords()).toBe(1);
  });

  it('全消しできる', async () => {
    await putRecords([mk('a'), mk('b')]);
    await clearRecords();
    expect(await countRecords()).toBe(0);
  });
});

describe('検証を通らないものは保存しない', () => {
  it('壊れたレコードは reject する', async () => {
    const bad = { ...mk('bad'), brandId: 'nonexistent' };
    await expect(putRecord(bad)).rejects.toThrow('保存できないレコードです');
    expect(await countRecords()).toBe(0);
  });

  it('putRecords は1件でも壊れていれば1件も保存しない', async () => {
    const bad = { ...mk('bad'), brandId: 'nonexistent' };
    await expect(putRecords([mk('ok1'), bad, mk('ok2')])).rejects.toThrow();
    expect(await countRecords()).toBe(0);
  });

  it('エラーメッセージに理由が入る', async () => {
    const bad = { ...mk('bad'), face: { ...mk('bad').face, descriptor: [1, 2, 3] } };
    await expect(putRecord(bad)).rejects.toThrow(/128次元/);
  });
});
