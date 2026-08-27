import { el, clear } from './dom.js';
import { renderCapture } from './capture.js';
import { analyzeWithProgress, preloadModels } from './analyze.js';
import { renderRegisterForm } from './register.js';
import { allRecords } from '../db/store.js';
import { infer } from '../lib/infer.js';
import { explain, formatPercent } from '../lib/explain.js';
import { getBrand } from '../lib/brands.js';

function bar(brand, p) {
  return el(
    'div',
    { class: 'bar' },
    el('span', { class: 'swatch', style: `background:${brand.color}` }),
    el('span', { class: 'bname', text: brand.name }),
    el('span', { class: 'track' }, el('i', { style: `width:${(p * 100).toFixed(1)}%;background:${brand.color}` })),
    el('span', { class: 'pct', text: formatPercent(p, 1) }),
  );
}

export function renderResult({ result, face, dataUrl, extra = null }) {
  const e = explain(result, face);
  return el(
    'div',
    { class: 'result' },
    dataUrl ? el('img', { class: 'shot', src: dataUrl, alt: '撮影した顔' }) : null,
    el('p', { class: 'verdict-label', text: 'いちばんそれっぽいのは' }),
    el('h2', { class: 'verdict', text: e.headline }),
    el('div', { class: 'bars' }, result.top.map((t) => bar(getBrand(t.brandId), t.p))),
    el('p', { class: 'breakdown', text: `今回の判定に効いたのは ${e.breakdown}` }),
    el('ul', { class: 'reasons' }, e.reasons.map((r) => el('li', { text: r }))),
    extra,
    el('ul', { class: 'notes' }, e.notes.map((n) => el('li', { text: n }))),
  );
}

export async function renderJudge() {
  const page = el('div', { class: 'page' }, el('h1', { text: '判定' }));
  const slot = el('div');
  page.append(slot);

  function showCapture() {
    clear(slot);
    const prep = el('p', { class: 'hint', text: '' });
    slot.append(
      el('p', { class: 'lead', text: '顔を撮ると、吸っていそうな銘柄を上位3つ返します。写真は端末の外に出ません。' }),
      renderCapture({ onCaptured: run }),
      prep,
    );
    // カメラに顔を合わせているあいだに読み込みを済ませておく
    preloadModels(prep);
  }

  function showError(msg) {
    clear(slot);
    slot.append(el('p', { class: 'error', text: msg }), el('button', { text: 'やり直す', onClick: showCapture }));
  }

  async function run({ canvas, dataUrl }) {
    clear(slot);
    const status = el('p', { class: 'loading', text: '' });
    slot.append(status);
    try {
      const face = await analyzeWithProgress(canvas, status);
      if (!face) {
        showError('顔を見つけられませんでした。明るいところで、正面から撮り直してください。');
        return;
      }
      const records = await allRecords();
      const result = infer({ face, records });
      clear(slot);
      slot.append(
        renderResult({
          result,
          face,
          dataUrl,
          extra: renderRegisterForm({ face, dataUrl, onSaved: () => {} }),
        }),
      );
      slot.append(el('button', { text: 'もう一度撮る', onClick: showCapture }));
      window.__app.lastResult = { result, face };
    } catch (err) {
      showError(`解析に失敗しました: ${err.message}`);
    }
  }

  showCapture();
  return page;
}
