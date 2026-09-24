#!/usr/bin/env node
// Checks the hand-authored conversion vocabularies in data/seed/.
//
//   V7  per (year, rarity), trade_conversion + gp_source counts == standard_set.set_size
//   E2E feeding the 2026 rows through the rules reproduces the condensed trade-good
//       yield actually observed in the 2026 workbook
//
// The second check is the one that matters: it says the committed CSVs are not
// merely self-consistent, they are the numbers that predicted the measured data.
// See docs/data-model.md section 2.

import { join } from 'node:path';
import { parseCsv } from './csv.mjs';
import { SEED, FIXTURES } from './paths.mjs';

const num = (v) => (v === '' || v === undefined ? null : Number(v));

const seed = (name) => parseCsv(join(SEED, `${name}.csv`));
const conversion = seed('trade_conversion');
const rules = seed('conversion_rule');
const gpSource = seed('gp_source');
const standardSet = seed('standard_set');
const tradeGood = seed('trade_good');
const mixYear = seed('mix_year');

const failures = [];
const fail = (check, msg) => failures.push(`${check}: ${msg}`);

const rung = new Map(tradeGood.map((r) => [r.good, num(r.trade_rung)]));
const gpValue = new Map(tradeGood.map((r) => [r.good, num(r.gp_value)]));

// --- every good named in trade_conversion must have a rung -------------------
for (const r of conversion) {
  if (!rung.has(r.good)) fail('JOIN', `trade_conversion names "${r.good}", absent from trade_good.csv`);
}

// --- V7 ----------------------------------------------------------------------
console.log('V7  standard-set accounting');
const years = [...new Set(standardSet.map((r) => r.event_year))].sort();
for (const year of years) {
  for (const rarity of ['Common', 'Uncommon', 'Rare']) {
    const rowsForRarity = conversion.filter((r) => r.event_year === year && r.source_rarity === rarity);
    if (!rowsForRarity.length) {
      console.log(`    ${year} ${rarity.padEnd(8)}  no conversion counts recorded - skipped`);
      continue;
    }
    const setRow = standardSet.find((r) => r.event_year === year && r.rarity === rarity);
    if (!setRow) { fail('V7', `${year} ${rarity}: no standard_set row`); continue; }

    const goods = rowsForRarity.reduce((a, r) => a + num(r.source_count), 0);
    const gpRow = gpSource.find((r) => r.event_year === year && r.source_rarity === rarity);
    const gp = gpRow ? num(gpRow.token_count) : 0;
    const total = goods + gp;
    const expected = num(setRow.set_size);

    const ok = total === expected;
    console.log(
      `    ${year} ${rarity.padEnd(8)}  ${String(goods).padStart(2)} goods + ${gp} GP = ` +
      `${String(total).padStart(2)} of ${expected}  ${ok ? 'ok' : 'MISMATCH'}`
    );
    if (!ok) fail('V7', `${year} ${rarity}: counts sum to ${total}, expected ${expected}`);
  }
}

// --- V9: the token catalog must reproduce the aggregate counts ----------------
// trade_conversion.csv is an assertion about a set; token_catalog_<year>.csv is
// the set itself, one row per token, fetched independently from tokendb. If the
// two disagree, one of them is wrong and it is not obvious which -- so say so.
console.log('\nV9  catalog reproduces trade_conversion');
for (const year of years) {
  let catalog;
  try {
    catalog = parseCsv(join(SEED, `token_catalog_${year}.csv`));
  } catch {
    console.log(`    ${year}  no catalog file - skipped`);
    continue;
  }
  const derived = new Map();
  for (const t of catalog) {
    if (t.in_standard_set !== '1') continue;            // the 40/40/40 only
    if (!t.converts_to || t.converts_to === 'Reserve Bar') continue;  // GP is gp_source
    const key = `${t.converts_to}|${t.rarity}`;
    derived.set(key, (derived.get(key) || 0) + 1);
  }
  let checked = 0, bad = 0;
  for (const r of conversion.filter((x) => x.event_year === year)) {
    const key = `${r.good}|${r.source_rarity}`;
    const got = derived.get(key) || 0;
    derived.delete(key);
    checked++;
    if (got !== num(r.source_count)) {
      bad++;
      fail('V9', `${year} ${r.good} ${r.source_rarity}: file says ${r.source_count}, catalog has ${got}`);
    }
  }
  for (const [key, n] of derived) fail('V9', `${year} ${key}: catalog has ${n}, absent from trade_conversion`);
  console.log(`    ${year}  ${checked} cells checked, ${bad} disagree, ${catalog.length} tokens in catalog`);
}

// --- end-to-end prediction against the 2026 measurement -----------------------
const YEAR = '2026';
const totals = Object.fromEntries(
  parseCsv(join(FIXTURES, '2026_treatment_totals.csv')).map((r) => [r.metric, Number(r.value)])
);
const observed = parseCsv(join(FIXTURES, '2026_trade_good_items.csv'));

const mix = mixYear.find((r) => r.event_year === YEAR && r.mix === 'condensed');
const drawsPerUnit = num(mix.draws_per_unit);
const itemsPerUnit = num(mix.items_per_unit);

const ncItems = totals.non_condensed_items;
const packs = totals.condensed_items / itemsPerUnit;

// Standard-set tokens converted away, per pack.
const converted = {
  Rare: (drawsPerUnit * totals.non_condensed_rare) / ncItems,
  Uncommon: (drawsPerUnit * totals.non_condensed_uncommon) / ncItems,
};

const setSize = (rarity) =>
  num(standardSet.find((r) => r.event_year === YEAR && r.rarity === rarity).set_size);

const rule = (r, rarity) =>
  rules.find((x) => x.event_year === YEAR && num(x.trade_rung) === r && x.source_rarity === rarity);

function conversionYield(good) {
  const bar = gpValue.get(good);
  if (bar) {
    // GP bars are value-based, not point-based.
    const gp = gpSource
      .filter((r) => r.event_year === YEAR)
      .reduce((a, r) => {
        const amount = converted[r.source_rarity];
        if (!amount) return a;
        return a + (num(r.token_count) / setSize(r.source_rarity)) * amount * num(r.gp_each);
      }, 0);
    return gp / bar;
  }
  const r = rung.get(good);
  let points = 0, required = null;
  for (const row of conversion.filter((x) => x.event_year === YEAR && x.good === good)) {
    const amount = converted[row.source_rarity];
    if (!amount) continue;
    const rl = rule(r, row.source_rarity);
    if (!rl) { fail('RULE', `no conversion_rule for ${YEAR} rung ${r} ${row.source_rarity}`); continue; }
    required = num(rl.points_required);
    points += (num(row.source_count) / setSize(row.source_rarity)) * amount * num(rl.points_per_token);
  }
  return required ? points / required : 0;
}

console.log('\nE2E condensed trade goods per pack, 2026');
console.log('    good                        conv    base    pred     obs   ratio');
let predTotal = 0, obsTotal = 0;
for (const row of observed) {
  const conv = conversionYield(row.good);
  const base = (drawsPerUnit * Number(row.non_condensed)) / ncItems;
  const pred = conv + base;
  const obs = Number(row.condensed) / packs;
  predTotal += pred;
  obsTotal += obs;
  console.log(
    `    ${row.good.padEnd(26)}${conv.toFixed(3).padStart(8)}${base.toFixed(3).padStart(8)}` +
    `${pred.toFixed(3).padStart(8)}${obs.toFixed(3).padStart(8)}${(obs / pred).toFixed(2).padStart(8)}`
  );
}
const drift = Math.abs(obsTotal - predTotal) / predTotal;
console.log(
  `    ${'TOTAL'.padEnd(26)}${''.padStart(16)}${predTotal.toFixed(3).padStart(8)}` +
  `${obsTotal.toFixed(3).padStart(8)}${(obsTotal / predTotal).toFixed(3).padStart(8)}`
);
console.log(`    agreement: ${(drift * 100).toFixed(2)}% on ${Math.round(obsTotal * packs)} observed items`);

const TOLERANCE = 0.01;
if (drift > TOLERANCE) {
  fail('E2E', `total yield is ${(drift * 100).toFixed(2)}% off, tolerance ${TOLERANCE * 100}%`);
}

// -----------------------------------------------------------------------------
console.log('');
if (failures.length) {
  for (const f of failures) console.error(`FAIL  ${f}`);
  process.exit(1);
}
console.log('all checks passed');
