// モデルの読み込みと顔の解析。判定と登録の両方が使う。

import { loadModels, analyzeFace } from '../face/detector.js';

export async function analyzeWithProgress(canvas, statusEl) {
  statusEl.textContent = 'モデルを読み込んでいます…（初回は約7MB）';
  await loadModels((done, total) => {
    statusEl.textContent = `モデルを読み込んでいます…（${done}/${total}）`;
  });
  statusEl.textContent = '顔を解析しています…';
  return analyzeFace(canvas);
}
