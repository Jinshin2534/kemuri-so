import './styles.css';
import { registerRoute, start } from './ui/app.js';
import { renderHome } from './ui/home.js';
import { renderJudge } from './ui/judge.js';
import { renderRecords } from './ui/records.js';
import { renderQuiz } from './ui/quiz.js';
import { renderData } from './ui/data.js';

import { mockFace } from './face/mock.js';
import { makeRecord } from './lib/record.js';
import { infer } from './lib/infer.js';
import { explain } from './lib/explain.js';
import { allRecords, putRecord, clearRecords } from './db/store.js';

registerRoute('', renderHome);
registerRoute('judge', renderJudge);
registerRoute('records', renderRecords);
registerRoute('quiz', renderQuiz);
registerRoute('data', renderData);

start();

// 検証用に、seed ごとに色の違う小さな画像を作る（クイズの見た目を確かめるため）。
function swatchPhoto(seed) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `hsl(${(seed * 47) % 360} 45% 45%)`;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText(String(seed), 8, 40);
  return c.toDataURL('image/jpeg', 0.7);
}

// カメラの無い環境でも一通り確かめられるようにする検証用のフック。
// 画面から呼ぶものではなく、コンソールから叩くためのもの。
window.__app = {
  ...window.__app,
  // 顔ベクトルを直接与えて判定だけ回す（カメラもモデルも通さない）
  async feedFace(face) {
    const records = await allRecords();
    const result = infer({ face, records });
    return { result, explained: explain(result, face) };
  },
  async mockRegister(brandId, seed = 1, { label = `mock-${seed}`, withPhoto = false } = {}) {
    const record = makeRecord({
      label,
      brandId,
      face: mockFace(seed),
      photo: withPhoto ? swatchPhoto(seed) : null,
      consent: true,
    });
    await putRecord(record);
    return record.id;
  },
  async mockJudge(seed = 1) {
    const face = mockFace(seed);
    const records = await allRecords();
    const result = infer({ face, records });
    return { face, result, explained: explain(result, face) };
  },
  records: allRecords,
  reset: clearRecords,
};
