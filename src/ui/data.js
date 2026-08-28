import { el, clear } from './dom.js';
import { allRecords, putRecords, clearRecords } from '../db/store.js';
import { exportRecords, parseImport, mergeRecords } from '../lib/io.js';
import { SOURCES, allStats } from '../lib/stats.js';

export async function loadSeedOnce() {
  const KEY = 'kemuri-so:seed';
  if (localStorage.getItem(KEY) === '1') return 0;
  localStorage.setItem(KEY, '1');
  try {
    const res = await fetch('/seed.json');
    if (!res.ok) return 0;
    const parsed = parseImport(await res.json());
    if (!parsed.ok || parsed.records.length === 0) return 0;
    const existing = await allRecords();
    const merged = mergeRecords(existing, parsed.records);
    await putRecords(merged.records.slice(existing.length));
    return merged.added;
  } catch {
    return 0;
  }
}

function download(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function renderData() {
  const page = el('div', { class: 'page' }, el('h1', { text: 'データ' }));
  const slot = el('div');
  page.append(slot);

  async function view() {
    const records = await allRecords();
    const withPhoto = records.filter((r) => r.photo).length;
    const stats = allStats();
    const estimated = stats.filter((s) => s.estimated).length;
    const includePhoto = el('input', { type: 'checkbox' });
    const msg = el('p', { class: 'hint', text: '' });
    const importFile = el('input', { type: 'file', accept: 'application/json', class: 'file' });

    importFile.addEventListener('change', async () => {
      const f = importFile.files?.[0];
      if (!f) return;
      try {
        const parsed = parseImport(JSON.parse(await f.text()));
        if (!parsed.ok) {
          msg.textContent = `読み込めませんでした: ${parsed.errors.join(' / ')}`;
          return;
        }
        const existing = await allRecords();
        const merged = mergeRecords(existing, parsed.records);
        await putRecords(merged.records.slice(existing.length));
        const dropped = parsed.errors.length > 0 ? `（${parsed.errors.length}件は形式が合わず読み飛ばし）` : '';
        await view();
        document.querySelector('.page .importmsg').textContent =
          `${merged.added}件を追加、${merged.skipped}件は登録済みだったので飛ばしました。${dropped}`;
      } catch (e) {
        msg.textContent = `読み込めませんでした: ${e.message}`;
      }
    });
    msg.className = 'hint importmsg';

    clear(slot);
    slot.append(
      el('p', { class: 'lead', text: `この端末に ${records.length} 件（うち写真つき ${withPhoto} 件）。` }),

      el('h2', { text: '書き出す' }),
      el('p', {
        class: 'hint',
        text: '写真を含めなければ、書き出されるのは数値の列と銘柄だけです。顔には戻せません。友達と持ち寄って判定を育てるときはこちらで十分です。',
      }),
      el('label', { class: 'check' }, includePhoto, '写真も含める（クイズに出せるようになるが、顔写真がファイルに入る）'),
      el('button', {
        class: 'primary',
        text: '書き出す',
        onClick: () => download('kemuri-so-records.json', exportRecords(records, { includePhoto: includePhoto.checked })),
      }),

      el('h2', { text: '読み込む' }),
      el('p', { class: 'hint', text: '同じIDのレコードは増えません。何度読み込んでも二重にはなりません。' }),
      importFile,
      msg,

      el('h2', { text: '使っている統計の出典' }),
      el('p', {
        class: 'hint',
        text: `テーブル中の数値 ${stats.length} 個のうち、${estimated} 個は推定値です。紙巻きたばこの「銘柄 × 年代」のクロス集計は公開されていないため、そこは推定に頼っています。`,
      }),
      el(
        'ul',
        { class: 'sources' },
        SOURCES.map((s) =>
          el(
            'li',
            {},
            el('a', { href: s.url, target: '_blank', rel: 'noreferrer', text: s.title }),
            el('p', { class: 'hint', text: s.note }),
          ),
        ),
      ),

      el('h2', { text: '全部消す' }),
      el('button', {
        class: 'danger',
        text: 'この端末の登録をすべて削除',
        onClick: async () => {
          if (!confirm('この端末の登録をすべて削除します。よろしいですか？')) return;
          await clearRecords();
          await view();
        },
      }),
    );
  }

  await view();
  return page;
}
