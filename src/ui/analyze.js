// モデルの読み込みと顔の解析。判定と登録の両方が使う。
//
// loadModels は一度きりの Promise を返すので、撮影画面を開いた時点で先に呼んでおける。
// ユーザーがカメラに顔を合わせているあいだに読み込みとウォームアップが終わるのが理想。

import { loadModels, analyzeFace } from '../face/detector.js';

export function preloadModels(statusEl) {
  loadModels((done, total) => {
    statusEl.textContent =
      done >= total ? '準備できました。' : `解析の準備をしています…（${done}/${total}・初回は約7MB）`;
  }).catch(() => {
    statusEl.textContent = '解析の準備に失敗しました。撮影時にもう一度試します。';
  });
}

export async function analyzeWithProgress(canvas, statusEl) {
  statusEl.textContent = '解析の準備をしています…（初回は約7MB）';
  await loadModels((done, total) => {
    statusEl.textContent = `解析の準備をしています…（${done}/${total}）`;
  });
  statusEl.textContent = '顔を解析しています…';
  return analyzeFace(canvas);
}
