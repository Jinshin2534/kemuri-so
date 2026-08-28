import { el } from './dom.js';
import { countRecords } from '../db/store.js';

function card(title, desc, href) {
  return el('a', { class: 'card', href }, el('h2', { text: title }), el('p', { text: desc }));
}

export async function renderHome() {
  let n = 0;
  try {
    n = await countRecords();
  } catch {
    n = 0;
  }

  return el(
    'div',
    { class: 'page home' },
    el('h1', { text: 'けむり相' }),
    el('p', { class: 'lead', text: '顔を撮ると、吸っていそうな銘柄を確率で返します。当たるかどうかはクイズで確かめられます。' }),
    el(
      'div',
      { class: 'cards' },
      card('判定する', '顔を撮って、上位3銘柄と、その判定に何が効いたかを見る。', '#/judge'),
      card('クイズ', '登録した人の顔から銘柄を当てる。AI・でたらめと正解率を比べる。', '#/quiz'),
      card('登録', `顔と実際の銘柄を登録する。今 ${n} 件。`, '#/records'),
      card('データ', '書き出し・読み込みと、使っている統計の出典。', '#/data'),
    ),
    n === 0
      ? el('p', { class: 'hint', text: '登録が0件のあいだ、判定は年代と性別の統計だけで出ます。登録が増えるほど顔そのものが効いてきます。' })
      : el('p', { class: 'hint', text: `登録 ${n} 件。20件を超えたあたりから、顔の影響が統計と同じくらいになります。` }),
  );
}
