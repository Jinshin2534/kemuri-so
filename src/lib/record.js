// 登録レコードの生成と検証。IndexedDB も DOM も知らない純粋な層。

import { getBrand } from './brands.js';

export const DESCRIPTOR_LENGTH = 128;
const GENDERS = ['male', 'female', 'unknown'];

export function makeRecord({ id, createdAt, label, brandId, face, photo = null, consent = false }) {
  return {
    id: id ?? crypto.randomUUID(),
    createdAt: createdAt ?? Date.now(),
    label: label ?? '',
    brandId,
    face: {
      descriptor: Array.from(face.descriptor),
      age: face.age,
      gender: face.gender,
      genderProb: face.genderProb ?? 1,
    },
    photo,
    consent,
  };
}

export function validateRecord(r) {
  const errors = [];
  if (typeof r?.id !== 'string' || r.id.length === 0) errors.push('IDがありません');
  if (!Number.isFinite(r?.createdAt)) errors.push('作成日時が不正です');
  if (!getBrand(r?.brandId)) errors.push(`銘柄IDが存在しません: ${r?.brandId}`);

  const d = r?.face?.descriptor;
  if (!Array.isArray(d) || d.length !== DESCRIPTOR_LENGTH) {
    errors.push(`顔ベクトルは${DESCRIPTOR_LENGTH}次元である必要があります`);
  } else if (!d.every((v) => Number.isFinite(v))) {
    errors.push('顔ベクトルに数値でない値が含まれています');
  }

  if (!Number.isFinite(r?.face?.age)) errors.push('推定年齢が不正です');
  if (!GENDERS.includes(r?.face?.gender)) errors.push('性別が不正です');
  if (r?.photo !== null && !(typeof r?.photo === 'string' && r.photo.startsWith('data:image/'))) {
    errors.push('写真は data:image/ で始まるdataURLか null である必要があります');
  }
  if (typeof r?.consent !== 'boolean') errors.push('同意フラグが不正です');

  return { ok: errors.length === 0, errors };
}

export function stripPhoto(r) {
  return { ...r, photo: null };
}
