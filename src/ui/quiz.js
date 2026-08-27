// クイズ画面。出題も採点も src/lib/quiz.js が持っているので、ここは表示と進行だけ。
// AIの解答は出題対象を除いたデータで推論している（leave-one-out）。
// 除かないとAIは自分が覚えた顔を引き当てるだけになり、比較の意味が無くなる。

import { el, clear } from './dom.js';
import { allRecords } from '../db/store.js';
import { getBrand } from '../lib/brands.js';
import { makeRng } from '../lib/rng.js';
import { makeBrandQuiz, makeFaceQuiz, aiAnswer, scoreAnswers, CHOICE_COUNT } from '../lib/quiz.js';
import { formatPercent } from '../lib/explain.js';

const COUNT = 5;

export async function renderQuiz() {
  const page = el('div', { class: 'page' }, el('h1', { text: 'クイズ' }));
  const slot = el('div');
  page.append(slot);
  const records = await allRecords();
  const photos = records.filter((r) => r.photo);
  const brandKinds = new Set(photos.map((r) => r.brandId)).size;

  function modeCard(title, desc, ok, why, onStart) {
    const node = el('div', { class: 'card' }, el('h2', { text: title }), el('p', { text: desc }));
    node.append(
      ok
        ? el('button', { class: 'primary', text: 'はじめる', onClick: onStart })
        : el('p', { class: 'hint', text: why }),
    );
    return node;
  }

  function scoreBar(name, rate, color) {
    return el(
      'div',
      { class: 'bar' },
      el('span', { class: 'swatch', style: `background:${color}` }),
      el('span', { class: 'bname', text: name }),
      el('span', { class: 'track' }, el('i', { style: `width:${(rate * 100).toFixed(1)}%;background:${color}` })),
      el('span', { class: 'pct', text: formatPercent(rate) }),
    );
  }

  function menu() {
    clear(slot);
    slot.append(
      el('p', {
        class: 'lead',
        text: '登録した人の顔から銘柄を当てます。同じ問題をAIにも解かせ、でたらめに選んだ場合と並べて出します。',
      }),
      el(
        'div',
        { class: 'cards' },
        modeCard(
          '銘柄当て',
          '顔を見て、この人が吸っている銘柄を4択で当てる。',
          photos.length >= 1,
          `写真つきの登録が1件以上必要です（今 ${photos.length} 件）`,
          () => start('brand'),
        ),
        modeCard(
          '逆引き',
          '銘柄を見て、それを吸っている人を4人から選ぶ。',
          photos.length >= CHOICE_COUNT && brandKinds >= 2,
          `写真つきの登録が${CHOICE_COUNT}件以上、銘柄が2種類以上必要です（今 ${photos.length} 件 / ${brandKinds} 銘柄）`,
          () => start('face'),
        ),
      ),
    );
  }

  async function start(mode) {
    clear(slot);
    slot.append(el('p', { class: 'loading', text: '問題とAIの解答を用意しています…' }));

    const rng = makeRng(Math.floor(Math.random() * 1e9));
    const questions =
      mode === 'brand'
        ? makeBrandQuiz(records, { rng, count: COUNT })
        : makeFaceQuiz(records, { rng, count: COUNT });

    if (questions.length === 0) {
      clear(slot);
      slot.append(
        el('p', { class: 'error', text: '出題できる登録が足りませんでした。' }),
        el('button', { text: '戻る', onClick: menu }),
      );
      return;
    }

    // 重い処理なので、描画をブロックしないように1問ずつ譲りながら計算する
    const ai = [];
    for (const q of questions) {
      await new Promise((r) => setTimeout(r, 0));
      ai.push(aiAnswer(q, records));
    }

    const user = [];
    let i = 0;

    function choiceLabel(q, id) {
      if (q.type === 'brand') return getBrand(id).name;
      const r = records.find((x) => x.id === id);
      return r?.label || '（名前なし）';
    }

    function brandQuestion(q) {
      const r = records.find((x) => x.id === q.recordId);
      return el(
        'div',
        { class: 'quiz' },
        el('img', { class: 'qface', src: r.photo, alt: '' }),
        el('p', { class: 'lead', text: 'この人が吸っている銘柄は？' }),
        el(
          'div',
          { class: 'pickrow' },
          q.choices.map((id) => {
            const b = getBrand(id);
            return el('button', {
              class: 'chip',
              style: `border-left-color:${b.color}`,
              text: b.name,
              onClick: () => answer(id),
            });
          }),
        ),
      );
    }

    function faceQuestion(q) {
      const b = getBrand(q.brandId);
      return el(
        'div',
        { class: 'quiz' },
        el('p', { class: 'lead' }, el('strong', { text: b.name }), ' を吸っているのはどの人？'),
        el(
          'div',
          { class: 'faces' },
          q.choices.map((id) => {
            const r = records.find((x) => x.id === id);
            return el(
              'button',
              { class: 'facebtn', onClick: () => answer(id) },
              el('img', { src: r.photo, alt: '' }),
              el('span', { text: r.label || '（名前なし）' }),
            );
          }),
        ),
      );
    }

    function showQuestion() {
      if (i >= questions.length) return showScore();
      const q = questions[i];
      clear(slot);
      slot.append(
        el('p', { class: 'qcount', text: `第${i + 1}問 / ${questions.length}` }),
        q.type === 'brand' ? brandQuestion(q) : faceQuestion(q),
      );
      return undefined;
    }

    function answer(choice) {
      const q = questions[i];
      user.push(choice);
      const correct = choice === q.answer;
      clear(slot);
      slot.append(
        el('p', { class: correct ? 'ok' : 'ng', text: correct ? '正解' : 'はずれ' }),
        el('p', {
          class: 'lead',
          text: `正解は ${choiceLabel(q, q.answer)}。AIは ${choiceLabel(q, ai[i])} と答えました。`,
        }),
        el('button', {
          class: 'primary',
          text: i + 1 >= questions.length ? '結果を見る' : '次の問題',
          onClick: () => {
            i += 1;
            showQuestion();
          },
        }),
      );
    }

    function showScore() {
      const s = scoreAnswers(questions, user, ai);
      clear(slot);
      slot.append(
        el('h2', { text: '結果' }),
        el(
          'div',
          { class: 'bars' },
          scoreBar('あなた', s.userRate, '#c8a45c'),
          scoreBar('AI', s.aiRate, '#5f8fbf'),
          scoreBar('でたらめ', s.chance, '#6b7280'),
        ),
        el('p', {
          class: 'hint',
          text: `${s.total}問中、あなた ${s.userCorrect}問 / AI ${s.aiCorrect}問。4択なので、でたらめに選んでも25%は当たります。この線を超えていなければ「当てられていない」ということです。`,
        }),
        el('button', { class: 'primary', text: 'もう一度', onClick: () => start(mode) }),
        el('button', { text: 'メニューへ', onClick: menu }),
      );
      return undefined;
    }

    showQuestion();
    window.__app.quiz = { questions, ai, answer, showScore };
  }

  menu();
  return page;
}
