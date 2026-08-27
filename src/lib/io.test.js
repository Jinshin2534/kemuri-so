import { describe, it, expect } from 'vitest';
import { makeRecord, DESCRIPTOR_LENGTH } from './record.js';
import { exportRecords, parseImport, mergeRecords, EXPORT_VERSION } from './io.js';

const descriptor = () => new Array(DESCRIPTOR_LENGTH).fill(0.1);
const mk = (id, brandId = 'mevius') =>
  makeRecord({
    id, createdAt: 1000, label: id, brandId,
    face: { descriptor: descriptor(), age: 30, gender: 'male', genderProb: 0.9 },
    photo: 'data:image/jpeg;base64,AAAA', consent: true,
  });

describe('書き出し', () => {
  it('既定では写真を含めない', () => {
    const out = exportRecords([mk('a'), mk('b')], { now: 5 });
    expect(out.version).toBe(EXPORT_VERSION);
    expect(out.exportedAt).toBe(5);
    expect(out.records.every((r) => r.photo === null)).toBe(true);
  });

  it('明示すれば写真を含める', () => {
    const out = exportRecords([mk('a')], { includePhoto: true, now: 5 });
    expect(out.records[0].photo).toContain('data:image/');
  });

  it('元の配列を壊さない', () => {
    const records = [mk('a')];
    exportRecords(records, { now: 5 });
    expect(records[0].photo).not.toBeNull();
  });
});

describe('読み込み', () => {
  it('正しいファイルを読める', () => {
    const out = exportRecords([mk('a'), mk('b')], { now: 5 });
    const parsed = parseImport(JSON.parse(JSON.stringify(out)));
    expect(parsed.ok).toBe(true);
    expect(parsed.records.length).toBe(2);
  });

  it('バージョンが違えば弾く', () => {
    const parsed = parseImport({ version: 999, records: [] });
    expect(parsed.ok).toBe(false);
    expect(parsed.errors.join('')).toContain('バージョン');
  });

  it('形が違うものを弾く', () => {
    expect(parseImport(null).ok).toBe(false);
    expect(parseImport({ version: EXPORT_VERSION }).ok).toBe(false);
  });

  it('壊れたレコードだけを落として、残りは読み込む', () => {
    const good = exportRecords([mk('a')], { now: 5 });
    good.records.push({ id: 'bad', brandId: 'nope' });
    const parsed = parseImport(good);
    expect(parsed.records.length).toBe(1);
    expect(parsed.errors.length).toBe(1);
  });
});

describe('マージ', () => {
  it('同じIDは増えない', () => {
    const m = mergeRecords([mk('a')], [mk('a'), mk('b')]);
    expect(m.records.length).toBe(2);
    expect(m.added).toBe(1);
    expect(m.skipped).toBe(1);
  });

  it('既存のレコードを上書きしない', () => {
    const existing = [mk('a', 'mevius')];
    const m = mergeRecords(existing, [mk('a', 'iqos')]);
    expect(m.records.find((r) => r.id === 'a').brandId).toBe('mevius');
  });

  it('元の配列を壊さない', () => {
    const existing = [mk('a')];
    mergeRecords(existing, [mk('b')]);
    expect(existing.length).toBe(1);
  });

  it('書き出して読み込んでマージすると件数が保たれる', () => {
    const records = [mk('a'), mk('b'), mk('c')];
    const parsed = parseImport(JSON.parse(JSON.stringify(exportRecords(records, { now: 5 }))));
    const m = mergeRecords([], parsed.records);
    expect(m.records.length).toBe(3);
  });
});
