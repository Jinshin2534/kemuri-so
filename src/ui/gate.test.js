// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isGatePassed, passGate, renderGate } from './gate.js';

beforeEach(() => {
  localStorage.clear();
});

describe('年齢確認と免責', () => {
  it('最初は通過していない', () => {
    expect(isGatePassed()).toBe(false);
  });

  it('passGate で通過状態になり、再読み込みしても残る', () => {
    passGate();
    expect(isGatePassed()).toBe(true);
    expect(localStorage.getItem('kemuri-so:gate')).toBe('1');
  });

  it('必要な断り書きが全部入っている', () => {
    const text = renderGate(() => {}).textContent;
    expect(text).toContain('科学的根拠はありません');
    expect(text).toContain('20歳');
    expect(text).toContain('送信されません');
    expect(text).toContain('未成年');
    expect(text).toContain('同意');
  });

  it('ボタンを押すと通過状態にして、コールバックを呼ぶ', () => {
    const onPass = vi.fn();
    const node = renderGate(onPass);
    expect(isGatePassed()).toBe(false);
    node.querySelector('button').click();
    expect(isGatePassed()).toBe(true);
    expect(onPass).toHaveBeenCalledOnce();
  });
});
