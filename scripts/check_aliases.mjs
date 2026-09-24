#!/usr/bin/env node
// Checks data/seed/token_alias.csv against the canonical token names.
//
//   node scripts/check_aliases.mjs
//
//   A1  every alias points at a real canonical name: a catalog token, a trade
//       good, or a group
//   A2  no alias is itself a canonical name -- it would be ambiguous
//   A3  no two aliases collide under the soft fold (case, whitespace, apostrophes)
//   A4  no alias differs from its target only under the soft fold; the form
//       already snaps those (data-model.md section 7, V6a), so the row is noise
//
// See docs/data-model.md section 4, *token_alias*.

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './csv.mjs';
import { soft } from './fold.mjs';

const SEED = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'seed');

const canonical = new Set();
for (const f of readdirSync(SEED).filter((f) => /^token_catalog_\d{4}\.csv$/.test(f))) {
  for (const t of parseCsv(join(SEED, f))) canonical.add(t.name);
}
for (const g of parseCsv(join(SEED, 'trade_good.csv'))) canonical.add(g.good);
for (const g of parseCsv(join(SEED, 'token_group.csv'))) canonical.add(g.name);

const canonicalSoft = new Map([...canonical].map((n) => [soft(n), n]));
const aliases = parseCsv(join(SEED, 'token_alias.csv'));

const failures = [];
const fail = (check, msg) => failures.push(`${check}: ${msg}`);

const seen = new Map();
for (const a of aliases) {
  if (!canonical.has(a.name)) fail('A1', `"${a.alias}" points at "${a.name}", which is not a canonical name`);

  const clash = canonicalSoft.get(soft(a.alias));
  if (clash && clash !== a.name) fail('A2', `"${a.alias}" is the canonical name "${clash}"`);
  if (clash === a.name) fail('A4', `"${a.alias}" differs from "${a.name}" only in case or spacing; the form already snaps it`);

  const key = soft(a.alias);
  if (seen.has(key)) fail('A3', `"${a.alias}" collides with "${seen.get(key)}"`);
  else seen.set(key, a.alias);
}

console.log(`${aliases.length} aliases over ${canonical.size} canonical names`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL  ${f}`);
  process.exit(1);
}
console.log('all checks passed');
