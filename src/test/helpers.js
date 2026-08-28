// テスト用の待ち合わせ。
// setTimeout を決め打ちで n 回回す書き方だと、IndexedDB のトランザクションのように
// 何段か await が挟まる処理では、マシンの負荷次第で落ちたり通ったりする。
// 「条件が満たされるまで待つ」に統一する。

export async function waitFor(predicate, { timeout = 2000, interval = 5 } = {}) {
  const started = Date.now();
  for (;;) {
    const value = await predicate();
    if (value) return value;
    if (Date.now() - started > timeout) {
      throw new Error(`waitFor がタイムアウトしました (${timeout}ms)`);
    }
    await new Promise((r) => setTimeout(r, interval));
  }
}
