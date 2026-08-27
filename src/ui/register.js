// 「実際は何を吸っているか」を教えてもらう画面。ここが学習データの入り口。

import { el, clear } from './dom.js';
import { renderBrandPicker } from './brandPicker.js';
import { renderCapture } from './capture.js';
import { analyzeWithProgress, preloadModels } from './analyze.js';
import { makeRecord } from '../lib/record.js';
import { putRecord } from '../db/store.js';

export function renderRegisterForm({ face, dataUrl, onSaved }) {
  let brandId = null;
  const labelInput = el('input', { type: 'text', class: 'text', placeholder: '名前やニックネーム（任意）' });
  const consent = el('input', { type: 'checkbox' });
  const msg = el('p', { class: 'hint', text: '' });
  const save = el('button', { class: 'primary', text: '登録する', disabled: '' });

  save.addEventListener('click', async () => {
    save.setAttribute('disabled', '');
    try {
      const record = makeRecord({
        label: labelInput.value.trim(),
        brandId,
        face,
        photo: dataUrl ?? null,
        consent: consent.checked,
      });
      await putRecord(record);
      msg.textContent = '登録しました。次からの判定が少しだけ顔を見るようになります。';
      onSaved?.(record);
    } catch (e) {
      msg.textContent = `登録できませんでした: ${e.message}`;
      save.removeAttribute('disabled');
    }
  });

  return el(
    'div',
    { class: 'register' },
    el('h3', { text: '実際は何を吸っていますか？' }),
    el('p', {
      class: 'hint',
      text: '教えてもらえるほど判定が育ちます。写真も顔のデータも、この端末の中だけに保存されます。',
    }),
    renderBrandPicker({
      onPick: (id) => {
        brandId = id;
        save.removeAttribute('disabled');
      },
    }),
    el('label', { class: 'field' }, '表示名', labelInput),
    el('label', { class: 'check' }, consent, '自分以外を登録する場合、本人の同意を得ました'),
    save,
    msg,
  );
}

export function renderRegisterFlow({ onSaved, onCancel }) {
  const node = el('div', { class: 'flow' });

  function showCapture() {
    clear(node);
    const prep = el('p', { class: 'hint', text: '' });
    node.append(
      renderCapture({ onCaptured: run, label: 'この顔を登録する' }),
      prep,
      el('button', { text: 'やめる', onClick: () => onCancel?.() }),
    );
    preloadModels(prep);
  }

  async function run({ canvas, dataUrl }) {
    clear(node);
    const status = el('p', { class: 'loading', text: '' });
    node.append(status);
    const face = await analyzeWithProgress(canvas, status);
    clear(node);
    if (!face) {
      node.append(
        el('p', { class: 'error', text: '顔を見つけられませんでした。撮り直してください。' }),
        el('button', { text: 'やり直す', onClick: showCapture }),
      );
      return;
    }
    node.append(
      el('img', { class: 'shot', src: dataUrl, alt: '' }),
      renderRegisterForm({ face, dataUrl, onSaved: (r) => onSaved?.(r) }),
    );
  }

  showCapture();
  return node;
}
