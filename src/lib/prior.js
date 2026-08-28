// 年代 × 性別 から「この層はどの銘柄を吸っていそうか」の事前分布を作る。
//
//   prior(銘柄) ∝ カテゴリのシェア × 年代の偏り × 性別の偏り × 銘柄のカテゴリ内weight
//
// 喫煙率はここには混ぜない。混ぜると「吸わない」が常に最大になって判定が死ぬため、
// 喫煙率は smokingRateFor() で別途、結果画面の補足として出す。

import { BRANDS } from './brands.js';
import {
  AGE_BANDS, CATEGORY_SHARE, CATEGORY_AGE_SKEW, CATEGORY_GENDER_SKEW, SMOKING_RATE,
} from './stats.js';

export function ageBandOf(age) {
  if (!Number.isFinite(age)) return '40s';
  if (age < 30) return '20s';
  if (age < 40) return '30s';
  if (age < 50) return '40s';
  if (age < 60) return '50s';
  if (age < 70) return '60s';
  return '70s+';
}

function genderSkew(category, gender) {
  const s = CATEGORY_GENDER_SKEW[category];
  if (gender === 'male') return s.male.value;
  if (gender === 'female') return s.female.value;
  return (s.male.value + s.female.value) / 2;
}

export function buildPrior({ age, gender }) {
  const band = ageBandOf(age);
  const raw = {};
  let total = 0;
  for (const b of BRANDS) {
    const v =
      CATEGORY_SHARE[b.category].value *
      CATEGORY_AGE_SKEW[b.category][band].value *
      genderSkew(b.category, gender) *
      b.weight;
    raw[b.id] = v;
    total += v;
  }
  const out = {};
  for (const id of Object.keys(raw)) out[id] = raw[id] / total;
  return out;
}

export function smokingRateFor({ age, gender }) {
  const band = ageBandOf(age);
  const cell = SMOKING_RATE.byBand[band];
  if (gender === 'male') return cell.male;
  if (gender === 'female') return cell.female;
  return {
    value: (cell.male.value + cell.female.value) / 2,
    source: cell.male.source,
    estimated: true,
  };
}

export { AGE_BANDS };
