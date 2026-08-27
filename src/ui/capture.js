// 顔を1枚もらってくる部品。カメラが使えなければ写真選択に落ちる。
// 判定と登録の両方が使うので、判定のことは何も知らない。

import { el } from './dom.js';

const MAX_SIDE = 640; // これ以上大きくしても検出精度は上がらず、保存だけ重くなる

function drawToCanvas(source, w, h) {
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function renderCapture({ onCaptured, label = 'この顔で判定する' }) {
  const video = el('video', { class: 'cam', autoplay: '', playsinline: '', muted: '' });
  const status = el('p', { class: 'hint', text: 'カメラを準備しています…' });
  const shoot = el('button', { class: 'primary', text: label, disabled: '' });
  const file = el('input', { type: 'file', accept: 'image/*', class: 'file' });
  let stream = null;

  const stop = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };

  navigator.mediaDevices
    ?.getUserMedia({ video: { facingMode: 'user' } })
    .then((s) => {
      stream = s;
      video.srcObject = s;
      shoot.removeAttribute('disabled');
      status.textContent = '顔が正面に写るようにして、ボタンを押してください。';
    })
    .catch(() => {
      status.textContent = 'カメラが使えませんでした。下から写真を選んでください。';
      video.remove();
      shoot.remove();
    });

  shoot.addEventListener('click', () => {
    const canvas = drawToCanvas(video, video.videoWidth, video.videoHeight);
    stop();
    onCaptured({ canvas, dataUrl: canvas.toDataURL('image/jpeg', 0.8) });
  });

  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(img.src);
      stop();
      onCaptured({ canvas, dataUrl: canvas.toDataURL('image/jpeg', 0.8) });
    };
    img.src = URL.createObjectURL(f);
  });

  // 画面を離れたらカメラを止める。止めないとタブのインジケータが点いたままになる。
  window.addEventListener('hashchange', stop, { once: true });

  const node = el(
    'div',
    { class: 'capture' },
    video,
    status,
    shoot,
    el('label', { class: 'filelabel' }, '写真から選ぶ', file),
  );
  node.stopCamera = stop;
  return node;
}
