// @vitest-environment jsdom
// カメラの取り回し。jsdom には getUserMedia もキャンバスの中身も無いので、
// 「カメラが取れたか / 取れなかったか」の分岐と後始末だけを見る。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderCapture } from './capture.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

function stubCamera(ok) {
  const stop = vi.fn();
  const stream = { getTracks: () => [{ stop }, { stop }] };
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(() => (ok ? Promise.resolve(stream) : Promise.reject(new Error('denied')))) },
  });
  return { stop };
}

beforeEach(() => {
  location.hash = '';
});

afterEach(() => {
  delete navigator.mediaDevices;
});

describe('カメラが使えるとき', () => {
  it('撮影ボタンが押せるようになる', async () => {
    stubCamera(true);
    const node = renderCapture({ onCaptured: () => {} });
    expect(node.querySelector('button').hasAttribute('disabled')).toBe(true);
    await tick();
    expect(node.querySelector('button').hasAttribute('disabled')).toBe(false);
    expect(node.querySelector('.hint').textContent).toContain('ボタンを押してください');
  });

  it('画面を離れるとカメラを止める（インジケータが点きっぱなしにならない）', async () => {
    const { stop } = stubCamera(true);
    renderCapture({ onCaptured: () => {} });
    await tick();
    expect(stop).not.toHaveBeenCalled();
    location.hash = '#/quiz';
    window.dispatchEvent(new Event('hashchange'));
    expect(stop).toHaveBeenCalledTimes(2); // トラック2本ぶん
  });

  it('stopCamera を直接呼んでも止まる', async () => {
    const { stop } = stubCamera(true);
    const node = renderCapture({ onCaptured: () => {} });
    await tick();
    node.stopCamera();
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it('ラベルを差し替えられる', async () => {
    stubCamera(true);
    const node = renderCapture({ onCaptured: () => {}, label: 'この顔を登録する' });
    expect(node.querySelector('button').textContent).toBe('この顔を登録する');
  });
});

describe('カメラが使えないとき', () => {
  it('動画と撮影ボタンを消して、写真選択に案内する', async () => {
    stubCamera(false);
    const node = renderCapture({ onCaptured: () => {} });
    await tick();
    expect(node.querySelector('video')).toBeNull();
    expect(node.querySelector('button')).toBeNull();
    expect(node.querySelector('.hint').textContent).toContain('写真を選んでください');
    expect(node.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('mediaDevices が無い環境（httpsでない等）でも、準備中のまま固まらない', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
    const node = renderCapture({ onCaptured: () => {} });
    await tick();
    expect(node.querySelector('.hint').textContent).toContain('写真を選んでください');
    expect(node.querySelector('button')).toBeNull();
    expect(node.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('写真選択の入力は画像だけを受け付ける', () => {
    stubCamera(false);
    const node = renderCapture({ onCaptured: () => {} });
    expect(node.querySelector('input[type="file"]').getAttribute('accept')).toBe('image/*');
  });
});
