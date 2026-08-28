import { describe, it, expect } from 'vitest';
import { getBrand } from './brands.js';
import { infer } from './infer.js';
import { makeRng } from './rng.js';
import { makeBrandQuiz, makeFaceQuiz, aiAnswer, scoreAnswers, CHOICE_COUNT } from './quiz.js';

const vec = (first) => {
  const v = new Array(128).fill(0);
  v[0] = first;
  return v;
};
const mk = (id, brandId, first = 0, photo = 'data:image/jpeg;base64,AAAA') => ({
  id, createdAt: 1000, label: id, brandId,
  face: { descriptor: vec(first), age: 35, gender: 'male', genderProb: 0.9 },
  photo, consent: true,
});

const RECORDS = [
  mk('r1', 'mevius', 0.01),      mk('r2', 'seven-stars', 0.02),
  mk('r3', 'marlboro', 0.03),    mk('r4', 'winston', 0.04),
  mk('r5', 'iqos', 0.05),        mk('r6', 'glo', 0.06),
  mk('r7', 'kool', 0.07),        mk('r8', 'mevius-menthol', 0.08),
  mk('r9', 'shag', 0.09),        mk('r10', 'little-cigar', 0.10),
];

describe('銘柄当てクイズ', () => {
  it('指定した問数を作る', () => {
    expect(makeBrandQuiz(RECORDS, { rng: makeRng(1), count: 5 }).length).toBe(5);
  });

  it('選択肢は4つ、重複なし、正解を含む', () => {
    for (const q of makeBrandQuiz(RECORDS, { rng: makeRng(1), count: 5 })) {
      expect(q.choices.length).toBe(CHOICE_COUNT);
      expect(new Set(q.choices).size).toBe(CHOICE_COUNT);
      expect(q.choices).toContain(q.answer);
    }
  });

  it('正解は出題レコードの銘柄と一致する', () => {
    for (const q of makeBrandQuiz(RECORDS, { rng: makeRng(1), count: 5 })) {
      expect(RECORDS.find((r) => r.id === q.recordId).brandId).toBe(q.answer);
    }
  });

  it('誤答は正解と同じカテゴリから優先的に選ばれる', () => {
    const q = makeBrandQuiz([mk('x', 'mevius', 0.01)], { rng: makeRng(1), count: 1 })[0];
    const cats = q.choices.map((id) => getBrand(id).category);
    expect(new Set(cats).size).toBe(1);
    expect(cats[0]).toBe('regular');
  });

  it('写真のないレコードは出題しない', () => {
    const records = [...RECORDS.slice(0, 3), mk('np', 'iqos', 0.5, null)];
    const qs = makeBrandQuiz(records, { rng: makeRng(1), count: 10 });
    expect(qs.every((q) => q.recordId !== 'np')).toBe(true);
  });

  it('レコードが無ければ空を返す（例外にしない）', () => {
    expect(makeBrandQuiz([], { rng: makeRng(1), count: 5 })).toEqual([]);
  });

  it('同じ種なら同じ出題（決定論）', () => {
    expect(makeBrandQuiz(RECORDS, { rng: makeRng(9), count: 5 }))
      .toEqual(makeBrandQuiz(RECORDS, { rng: makeRng(9), count: 5 }));
  });
});

describe('逆引きクイズ', () => {
  it('選択肢は4人、重複なし、正解を含む', () => {
    for (const q of makeFaceQuiz(RECORDS, { rng: makeRng(2), count: 5 })) {
      expect(q.choices.length).toBe(CHOICE_COUNT);
      expect(new Set(q.choices).size).toBe(CHOICE_COUNT);
      expect(q.choices).toContain(q.answer);
    }
  });

  it('正解以外の選択肢は、出題された銘柄を吸っていない', () => {
    for (const q of makeFaceQuiz(RECORDS, { rng: makeRng(2), count: 5 })) {
      for (const id of q.choices) {
        if (id === q.answer) continue;
        expect(RECORDS.find((r) => r.id === id).brandId).not.toBe(q.brandId);
      }
    }
  });

  it('人数が足りなければ問題を作らない', () => {
    expect(makeFaceQuiz(RECORDS.slice(0, 2), { rng: makeRng(2), count: 5 })).toEqual([]);
  });

  it('同じ種なら同じ出題（決定論）', () => {
    expect(makeFaceQuiz(RECORDS, { rng: makeRng(4), count: 5 }))
      .toEqual(makeFaceQuiz(RECORDS, { rng: makeRng(4), count: 5 }));
  });
});

describe('AIの解答', () => {
  it('必ず選択肢の中から答える', () => {
    for (const q of makeBrandQuiz(RECORDS, { rng: makeRng(1), count: 5 })) {
      expect(q.choices).toContain(aiAnswer(q, RECORDS));
    }
    for (const q of makeFaceQuiz(RECORDS, { rng: makeRng(2), count: 5 })) {
      expect(q.choices).toContain(aiAnswer(q, RECORDS));
    }
  });

  it('出題対象を学習データから除外して答える（leave-one-out）', () => {
    const q = makeBrandQuiz(RECORDS, { rng: makeRng(1), count: 1 })[0];
    const target = RECORDS.find((r) => r.id === q.recordId);
    const others = RECORDS.filter((r) => r.id !== target.id);
    const { posterior } = infer({ face: target.face, records: others });
    const expected = q.choices
      .map((id) => [id, posterior[id]])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    expect(aiAnswer(q, RECORDS)).toBe(expected);
  });

  it('同じ問題なら同じ答え（決定論）', () => {
    const q = makeBrandQuiz(RECORDS, { rng: makeRng(1), count: 1 })[0];
    expect(aiAnswer(q, RECORDS)).toBe(aiAnswer(q, RECORDS));
  });
});

describe('採点', () => {
  it('正解数と正解率、でたらめの水準を返す', () => {
    const questions = [
      { answer: 'a', choices: ['a', 'b', 'c', 'd'] },
      { answer: 'b', choices: ['a', 'b', 'c', 'd'] },
      { answer: 'c', choices: ['a', 'b', 'c', 'd'] },
      { answer: 'd', choices: ['a', 'b', 'c', 'd'] },
    ];
    const s = scoreAnswers(questions, ['a', 'b', 'x', 'x'], ['a', 'x', 'x', 'x']);
    expect(s.total).toBe(4);
    expect(s.userCorrect).toBe(2);
    expect(s.aiCorrect).toBe(1);
    expect(s.userRate).toBeCloseTo(0.5, 10);
    expect(s.aiRate).toBeCloseTo(0.25, 10);
    expect(s.chance).toBeCloseTo(0.25, 10);
  });

  it('0問なら正解率0で割り算が壊れない', () => {
    const s = scoreAnswers([], [], []);
    expect(s.total).toBe(0);
    expect(s.userRate).toBe(0);
    expect(s.aiRate).toBe(0);
  });
});
