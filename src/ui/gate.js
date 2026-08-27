// 初回だけ出す確認。喫煙は20歳から、という前提と免責をここで一度だけ通す。

import { el } from './dom.js';

const KEY = 'kemuri-so:gate';

export function isGatePassed() {
  return localStorage.getItem(KEY) === '1';
}

export function passGate() {
  localStorage.setItem(KEY, '1');
}

export function renderGate(onPass) {
  return el(
    'div',
    { class: 'gate' },
    el('h1', { text: 'けむり相' }),
    el('p', { class: 'lead', text: '顔から吸っていそうな銘柄を当てる、遊びのアプリです。' }),
    el(
      'ul',
      { class: 'gate-list' },
      el('li', { text: '顔から銘柄が分かるという科学的根拠はありません。' }),
      el('li', { text: '喫煙を推奨するものではありません。喫煙は20歳になってから。' }),
      el('li', { text: '撮った写真と顔のデータはこの端末の中だけに保存され、送信されません。' }),
      el('li', { text: '未成年の顔を登録しないでください。' }),
      el('li', { text: '自分以外の人を登録するときは、本人の同意を得てください。' }),
    ),
    el('button', {
      class: 'primary',
      text: '20歳以上です。了解して始める',
      onClick: () => {
        passGate();
        onPass();
      },
    }),
  );
}
