import { mount, el } from './dom.js';
import { isGatePassed, renderGate } from './gate.js';

const routes = new Map();
export const state = {};

export function registerRoute(name, renderFn) {
  routes.set(name, renderFn);
}

export function go(path) {
  const next = path.startsWith('#') ? path : `#/${path}`;
  if (location.hash === next) render();
  else location.hash = next;
}

function currentRoute() {
  return location.hash.replace(/^#\/?/, '').split('/')[0];
}

function shell(body) {
  return el(
    'div',
    { class: 'shell' },
    el(
      'header',
      { class: 'topbar' },
      el('a', { class: 'brand', href: '#/', text: 'けむり相' }),
      el(
        'nav',
        { class: 'nav' },
        el('a', { href: '#/judge', text: '判定' }),
        el('a', { href: '#/quiz', text: 'クイズ' }),
        el('a', { href: '#/records', text: '登録' }),
        el('a', { href: '#/data', text: 'データ' }),
      ),
    ),
    el('main', { class: 'main' }, body),
    el('footer', { class: 'foot' }, el('small', { text: '顔から銘柄が分かる科学的根拠はありません。写真は端末から出ません。' })),
  );
}

async function render() {
  if (!isGatePassed()) {
    mount(renderGate(render));
    return;
  }
  const name = currentRoute();
  const fn = routes.get(name) ?? routes.get('');
  const body = el('div', { class: 'page' }, el('p', { class: 'loading', text: '読み込み中…' }));
  mount(shell(body));
  const rendered = await fn();
  body.replaceWith(rendered);
}

export function start() {
  window.addEventListener('hashchange', render);
  window.__app = { ...(window.__app ?? {}), go, state, render };
  render();
}
