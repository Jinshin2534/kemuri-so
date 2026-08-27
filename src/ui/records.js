import { el, clear } from './dom.js';
import { allRecords, deleteRecord } from '../db/store.js';
import { getBrand } from '../lib/brands.js';
import { renderRegisterFlow } from './register.js';

export async function renderRecords() {
  const page = el('div', { class: 'page' }, el('h1', { text: '登録' }));
  const slot = el('div');
  page.append(slot);

  function row(r) {
    const b = getBrand(r.brandId);
    return el(
      'div',
      { class: 'rec' },
      r.photo
        ? el('img', { class: 'thumb', src: r.photo, alt: '' })
        : el('div', { class: 'thumb none', text: 'ベクトルのみ' }),
      el(
        'div',
        { class: 'recmain' },
        el('strong', { text: r.label || '（名前なし）' }),
        el('span', { class: 'recbrand' }, el('i', { class: 'swatch', style: `background:${b.color}` }), b.name),
      ),
      el('button', {
        class: 'del',
        text: '削除',
        onClick: async () => {
          await deleteRecord(r.id);
          await list();
        },
      }),
    );
  }

  async function list() {
    const records = await allRecords();
    clear(slot);
    slot.append(
      el('p', { class: 'lead', text: `この端末に ${records.length} 件。写真も顔のデータも端末の外に出ません。` }),
      el('button', { class: 'primary', text: '新しく登録する', onClick: flow }),
      el(
        'div',
        { class: 'reclist' },
        records.length === 0
          ? el('p', { class: 'hint', text: 'まだ登録がありません。判定したあとの「実際は何を吸っていますか？」からも登録できます。' })
          : records.slice().reverse().map(row),
      ),
    );
  }

  function flow() {
    clear(slot);
    slot.append(renderRegisterFlow({ onSaved: list, onCancel: list }));
  }

  await list();
  return page;
}
