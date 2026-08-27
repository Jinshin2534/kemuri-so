import { el } from './dom.js';
import { CATEGORIES, CATEGORY_LABELS, brandsByCategory } from '../lib/brands.js';

export function renderBrandPicker({ onPick, selected = null }) {
  const node = el('div', { class: 'picker' });
  for (const c of CATEGORIES) {
    node.append(
      el('h4', { class: 'pickcat', text: CATEGORY_LABELS[c] }),
      el(
        'div',
        { class: 'pickrow' },
        brandsByCategory(c).map((b) =>
          el('button', {
            class: `chip${b.id === selected ? ' on' : ''}`,
            'data-brand': b.id,
            style: `border-left-color:${b.color}`,
            text: b.name,
            onClick: () => {
              node.querySelectorAll('.chip.on').forEach((x) => x.classList.remove('on'));
              node.querySelector(`[data-brand="${b.id}"]`).classList.add('on');
              onPick(b.id);
            },
          }),
        ),
      ),
    );
  }
  return node;
}
