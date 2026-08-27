import { describe, it, expect } from 'vitest';
import { makeRecord, validateRecord, stripPhoto, DESCRIPTOR_LENGTH } from './record.js';

const descriptor = () => new Array(DESCRIPTOR_LENGTH).fill(0.1);
const base = () => ({
  label: 'のぞみ',
  brandId: 'mevius',
  face: { descriptor: descriptor(), age: 33, gender: 'male', genderProb: 0.9 },
  photo: 'data:image/jpeg;base64,AAAA',
  consent: true,
});

describe('レコード', () => {
  it('IDと作成日時が自動で入る', () => {
    const r = makeRecord(base());
    expect(typeof r.id).toBe('string');
    expect(r.id.length).toBeGreaterThan(0);
    expect(Number.isFinite(r.createdAt)).toBe(true);
  });

  it('IDと作成日時を渡せば尊重する', () => {
    const r = makeRecord({ ...base(), id: 'fixed-id', createdAt: 1000 });
    expect(r.id).toBe('fixed-id');
    expect(r.createdAt).toBe(1000);
  });

  it('photo と consent は省略できる', () => {
    const { photo, consent, ...rest } = base();
    const r = makeRecord(rest);
    expect(r.photo).toBeNull();
    expect(r.consent).toBe(false);
  });

  it('正しいレコードは検証を通る', () => {
    expect(validateRecord(makeRecord(base())).ok).toBe(true);
  });

  it('存在しない銘柄IDは弾く', () => {
    const r = makeRecord({ ...base(), brandId: 'nope' });
    const v = validateRecord(r);
    expect(v.ok).toBe(false);
    expect(v.errors.join('')).toContain('銘柄');
  });

  it('ベクトルの次元が違えば弾く', () => {
    const r = makeRecord({ ...base(), face: { ...base().face, descriptor: [1, 2, 3] } });
    expect(validateRecord(r).ok).toBe(false);
  });

  it('ベクトルに数値以外が混じれば弾く', () => {
    const d = descriptor();
    d[5] = NaN;
    const r = makeRecord({ ...base(), face: { ...base().face, descriptor: d } });
    expect(validateRecord(r).ok).toBe(false);
  });

  it('性別が想定外なら弾く', () => {
    const r = makeRecord({ ...base(), face: { ...base().face, gender: 'x' } });
    expect(validateRecord(r).ok).toBe(false);
  });

  it('photo が画像のdataURLでなければ弾く', () => {
    const r = makeRecord({ ...base(), photo: 'https://example.com/a.jpg' });
    expect(validateRecord(r).ok).toBe(false);
  });

  it('stripPhoto は写真だけを落とし、他は変えない', () => {
    const r = makeRecord(base());
    const s = stripPhoto(r);
    expect(s.photo).toBeNull();
    expect(s.id).toBe(r.id);
    expect(s.face.descriptor).toEqual(r.face.descriptor);
    expect(r.photo).not.toBeNull();
  });
});
