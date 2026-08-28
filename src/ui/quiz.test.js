// @vitest-environment jsdom
// クイズ画面。出題ロジックは src/lib/quiz.js のテストで見ているので、
// ここは「遊べる条件の判定」と「1問ずつ進んで成績が出るまで」を通しで見る。
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { makeRecord } from '../lib/record.js';
import { putRecords, clearRecords } from '../db/store.js';
import { renderQuiz } from './quiz.js';

import { waitFor } from '../test/helpers.js';
const mk = (id, brandId, { photo = 'data:image/jpeg;base64,AAAA' } = {}) =>
  makeRecord({
    id, createdAt: 1000, label: id, brandId,
    face: { descriptor: new Array(128).fill(0.01 * id.length), age: 35, gender: 'male', genderProb: 0.9 },
    photo, consent: true,
  });

const EIGHT = ['mevius', 'seven-stars', 'marlboro', 'iqos', 'glo', 'kool', 'shag', 'little-cigar']
  .map((b, i) => mk(`r${i}`, b));

beforeEach(async () => {
  await clearRecords();
});

async function startMode(index) {
  const page = await renderQuiz();
  page.querySelectorAll('.card button')[index].click();
  // AIの解答を1問ずつ譲りながら計算しているので、第1問が出るまで待つ
  await waitFor(() => page.querySelector('.qcount') !== null);
  return page;
}

describe('遊べる条件の判定', () => {
  it('0件なら両方とも遊べず、理由を出す', async () => {
    const page = await renderQuiz();
    const cards = [...page.querySelectorAll('.card')];
    expect(cards.length).toBe(2);
    expect(cards.every((c) => c.querySelector('button') === null)).toBe(true);
    expect(cards[0].textContent).toContain('1件以上必要です');
    expect(cards[1].textContent).toContain('4件以上');
  });

  it('写真つき1件なら銘柄当てだけ遊べる', async () => {
    await putRecords([mk('a', 'mevius')]);
    const cards = [...(await renderQuiz()).querySelectorAll('.card')];
    expect(cards[0].querySelector('button')).not.toBeNull();
    expect(cards[1].querySelector('button')).toBeNull();
  });

  it('写真の無い登録は数に入らない', async () => {
    await putRecords([mk('a', 'mevius', { photo: null }), mk('b', 'iqos', { photo: null })]);
    const cards = [...(await renderQuiz()).querySelectorAll('.card')];
    expect(cards[0].querySelector('button')).toBeNull();
    expect(cards[0].textContent).toContain('今 0 件');
  });

  it('4件かつ銘柄が1種類だけなら逆引きは遊べない', async () => {
    await putRecords(['a', 'b', 'c', 'd'].map((id) => mk(id, 'mevius')));
    const cards = [...(await renderQuiz()).querySelectorAll('.card')];
    expect(cards[0].querySelector('button')).not.toBeNull();
    expect(cards[1].querySelector('button')).toBeNull();
    expect(cards[1].textContent).toContain('1 銘柄');
  });

  it('写真つき4件・2銘柄以上なら両方遊べる', async () => {
    await putRecords(EIGHT.slice(0, 4));
    const cards = [...(await renderQuiz()).querySelectorAll('.card')];
    expect(cards.every((c) => c.querySelector('button') !== null)).toBe(true);
  });
});

describe('銘柄当てを通しで解く', () => {
  it('顔の写真と4つの銘柄ボタンが出る', async () => {
    await putRecords(EIGHT);
    const page = await startMode(0);
    expect(page.querySelector('.qcount').textContent).toBe('第1問 / 5');
    expect(page.querySelector('img.qface')).not.toBeNull();
    expect(page.querySelectorAll('.quiz .chip').length).toBe(4);
  });

  it('答えると正誤とAIの解答が出る', async () => {
    await putRecords(EIGHT);
    const page = await startMode(0);
    page.querySelector('.quiz .chip').click();
    expect(page.querySelector('.ok, .ng')).not.toBeNull();
    expect(page.textContent).toContain('AIは');
    expect(page.textContent).toContain('正解は');
  });

  it('5問答えると、あなた・AI・でたらめの3本が出る', async () => {
    await putRecords(EIGHT);
    const page = await startMode(0);
    for (let i = 0; i < 5; i++) {
      page.querySelector('.quiz .chip').click();
      page.querySelector('button.primary').click();
    }
    const bars = [...page.querySelectorAll('.bar')];
    expect(bars.map((b) => b.querySelector('.bname').textContent)).toEqual(['あなた', 'AI', 'でたらめ']);
    expect(bars[2].querySelector('.pct').textContent).toBe('25%'); // 4択のまぐれ当たり
    expect(page.textContent).toContain('5問中');
  });

  it('最終問だけボタンが「結果を見る」になる', async () => {
    await putRecords(EIGHT);
    const page = await startMode(0);
    for (let i = 0; i < 4; i++) {
      page.querySelector('.quiz .chip').click();
      expect(page.querySelector('button.primary').textContent).toBe('次の問題');
      page.querySelector('button.primary').click();
    }
    page.querySelector('.quiz .chip').click();
    expect(page.querySelector('button.primary').textContent).toBe('結果を見る');
  });
});

describe('逆引きを通しで解く', () => {
  it('銘柄名と4人の顔が出る', async () => {
    await putRecords(EIGHT);
    const page = await startMode(1);
    expect(page.querySelector('.quiz .lead').textContent).toContain('吸っているのはどの人？');
    const faces = [...page.querySelectorAll('.facebtn')];
    expect(faces.length).toBe(4);
    expect(faces.every((f) => f.querySelector('img').getAttribute('src').startsWith('data:image/'))).toBe(true);
  });

  it('最後まで解くと成績が出る', async () => {
    await putRecords(EIGHT);
    const page = await startMode(1);
    for (let i = 0; i < 5; i++) {
      page.querySelector('.facebtn').click();
      page.querySelector('button.primary').click();
    }
    expect([...page.querySelectorAll('.bar .bname')].map((n) => n.textContent)).toEqual(['あなた', 'AI', 'でたらめ']);
  });
});
