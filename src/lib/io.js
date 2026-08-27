// 登録データの持ち出しと持ち寄り。
// 既定では写真を含めない。含めなければ中身は数値の列だけになり、顔には戻せない。

import { validateRecord, stripPhoto } from './record.js';

export const EXPORT_VERSION = 1;

export function exportRecords(records, { includePhoto = false, now = Date.now() } = {}) {
  return {
    version: EXPORT_VERSION,
    exportedAt: now,
    records: records.map((r) => (includePhoto ? { ...r } : stripPhoto(r))),
  };
}

export function parseImport(obj) {
  if (!obj || typeof obj !== 'object') {
    return { ok: false, records: [], errors: ['ファイルの形式が違います'] };
  }
  if (obj.version !== EXPORT_VERSION) {
    return { ok: false, records: [], errors: [`対応していないバージョンです: ${obj.version}`] };
  }
  if (!Array.isArray(obj.records)) {
    return { ok: false, records: [], errors: ['records が配列ではありません'] };
  }

  const records = [];
  const errors = [];
  obj.records.forEach((r, i) => {
    const v = validateRecord(r);
    if (v.ok) records.push(r);
    else errors.push(`${i + 1}件目を読み飛ばしました: ${v.errors.join(' / ')}`);
  });

  return { ok: true, records, errors };
}

export function mergeRecords(existing, incoming) {
  const seen = new Set(existing.map((r) => r.id));
  const records = [...existing];
  let added = 0;
  let skipped = 0;
  for (const r of incoming) {
    if (seen.has(r.id)) {
      skipped += 1;
      continue;
    }
    seen.add(r.id);
    records.push(r);
    added += 1;
  }
  return { records, added, skipped };
}
