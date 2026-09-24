#!/usr/bin/env node
// Checks data/seed/form_box.csv: the count boxes each form section shows
// before a player searches for anything (data-model.md section 4, *Which count
// boxes each section shows*).
//
//   node scripts/check_form_boxes.mjs
//
// Every other item is reached through the "add another item" search. The list
// is data so that next year's can be re-derived from this year's submissions
// without touching the form.
//
//   F1  every item is a group or a trade good, and a group belongs to the box's
//       year (or to no year, like Monster Trophy)
//   F2  every mix is one the year offers in mix_year.csv
//   F3  within a section, no item appears twice and positions run 1..n
//   F4  every mix offered in a year that has events has at least one box

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './csv.mjs';

const SEED = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'seed');

const boxes = parseCsv(join(SEED, 'form_box.csv'));
const groups = new Map(parseCsv(join(SEED, 'token_group.csv')).map((g) => [g.name, g]));
const goods = new Set(parseCsv(join(SEED, 'trade_good.csv')).map((g) => g.good));
const offered = new Set(
  parseCsv(join(SEED, 'mix_year.csv')).filter((m) => m.offered === '1').map((m) => `${m.event_year}|${m.mix}`),
);
const eventYears = new Set(parseCsv(join(SEED, 'event.csv')).map((e) => e.event_year));

const failures = [];
const fail = (check, msg) => failures.push(`${check}: ${msg}`);

const sections = new Map(); // "year|mix" -> rows
for (const b of boxes) {
  const where = `${b.event_year} ${b.mix} #${b.position}`;
  const g = groups.get(b.item);
  if (g) {
    if (g.token_year && g.token_year !== b.event_year) fail('F1', `${where} "${b.item}" is a ${g.token_year} group`);
  } else if (!goods.has(b.item)) {
    fail('F1', `${where} "${b.item}" is neither a group nor a trade good`);
  }

  const key = `${b.event_year}|${b.mix}`;
  if (!offered.has(key)) fail('F2', `${where} mix "${b.mix}" is not offered in ${b.event_year}`);
  if (!sections.has(key)) sections.set(key, []);
  sections.get(key).push(b);
}

for (const [key, rows] of sections) {
  const items = new Set();
  for (const r of rows) {
    if (items.has(r.item)) fail('F3', `${key.replace('|', ' ')} lists "${r.item}" twice`);
    items.add(r.item);
  }
  const positions = rows.map((r) => Number(r.position)).sort((a, b) => a - b);
  if (positions.some((p, i) => p !== i + 1)) {
    fail('F3', `${key.replace('|', ' ')} positions are ${positions.join(',')}, expected 1..${rows.length}`);
  }
  console.log(`    ${key.replace('|', ' ').padEnd(26)} ${rows.length} boxes`);
}

for (const key of offered) {
  const [year] = key.split('|');
  if (eventYears.has(year) && !sections.has(key)) fail('F4', `${key.replace('|', ' ')} is offered but has no boxes`);
}

console.log(`${boxes.length} boxes across ${sections.size} sections`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL  ${f}`);
  process.exit(1);
}
console.log('all checks passed');
