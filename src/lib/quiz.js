// 出題・AIの解答・採点。
//
// 大事な点が2つある。
//   1. 誤答は正解と同じカテゴリから優先的に選ぶ。そうしないと
//      「加熱式が1つだけ混じっている」ようなカタチになり、カテゴリを見るだけで解けてしまう。
//   2. AIは出題対象のレコードを学習データから除外してから推論する（leave-one-out）。
//      除外しないと、AIは自分が覚えたレコードを引き当てるだけになり常に正解してしまう。

import { BRANDS, getBrand } from './brands.js';
import { infer } from './infer.js';
import { shuffle } from './rng.js';

export const CHOICE_COUNT = 4;

const withPhoto = (records) => records.filter((r) => typeof r.photo === 'string' && r.photo.length > 0);

function pickDistractorBrands(answerId, rng, count) {
  const answer = getBrand(answerId);
  const sameCategory = BRANDS.filter((b) => b.category === answer.category && b.id !== answerId);
  const others = BRANDS.filter((b) => b.category !== answer.category);
  const pool = [...shuffle(sameCategory, rng), ...shuffle(others, rng)];
  return pool.slice(0, count).map((b) => b.id);
}

export function makeBrandQuiz(records, { rng, count = 5, choices = CHOICE_COUNT } = {}) {
  const pool = withPhoto(records);
  if (pool.length === 0) return [];

  return shuffle(pool, rng)
    .slice(0, count)
    .map((subject) => ({
      type: 'brand',
      recordId: subject.id,
      answer: subject.brandId,
      choices: shuffle(
        [subject.brandId, ...pickDistractorBrands(subject.brandId, rng, choices - 1)],
        rng,
      ),
    }));
}

export function makeFaceQuiz(records, { rng, count = 5, choices = CHOICE_COUNT } = {}) {
  const pool = withPhoto(records);
  const questions = [];

  for (const subject of shuffle(pool, rng)) {
    if (questions.length >= count) break;
    const others = pool.filter((r) => r.id !== subject.id && r.brandId !== subject.brandId);
    if (others.length < choices - 1) continue;
    questions.push({
      type: 'face',
      brandId: subject.brandId,
      answer: subject.id,
      choices: shuffle(
        [subject.id, ...shuffle(others, rng).slice(0, choices - 1).map((r) => r.id)],
        rng,
      ),
    });
  }
  return questions;
}

function bestOf(pairs) {
  return pairs.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

export function aiAnswer(question, records, config = {}) {
  if (question.type === 'brand') {
    const target = records.find((r) => r.id === question.recordId);
    const others = records.filter((r) => r.id !== question.recordId);
    const { posterior } = infer({ face: target.face, records: others, config });
    return bestOf(question.choices.map((id) => [id, posterior[id]]));
  }

  // 逆引き: 各候補の顔について「出題された銘柄である確率」を出し、いちばん高い人を選ぶ
  return bestOf(
    question.choices.map((recordId) => {
      const target = records.find((r) => r.id === recordId);
      const others = records.filter((r) => r.id !== recordId);
      const { posterior } = infer({ face: target.face, records: others, config });
      return [recordId, posterior[question.brandId]];
    }),
  );
}

export function scoreAnswers(questions, userAnswers, aiAnswers, { choices = CHOICE_COUNT } = {}) {
  const total = questions.length;
  let userCorrect = 0;
  let aiCorrect = 0;
  questions.forEach((q, i) => {
    if (userAnswers[i] === q.answer) userCorrect += 1;
    if (aiAnswers[i] === q.answer) aiCorrect += 1;
  });
  return {
    total,
    userCorrect,
    aiCorrect,
    chance: 1 / choices,
    userRate: total === 0 ? 0 : userCorrect / total,
    aiRate: total === 0 ? 0 : aiCorrect / total,
  };
}
