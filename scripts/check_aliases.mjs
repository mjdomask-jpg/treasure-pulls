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

import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './csv.mjs';

const SEED = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'seed');

// Groups are not seeded yet (backlog: "Seed the groups players pick from").
// Until they are, an alias may point at one of the groups data-model.md
// section 4 already names -- and only those, so a typo still fails. Delete
// this list when token_group.csv exists; the check then reads the real names.
const GROUP_FILE = join(SEED, 'token_group.csv');
const PENDING_GROUPS = [
  'Monster Trophy', 'Golem Chaser (set of 40)', "Herald's Chaser (set of 20)",
  'Cloak or Gloves of the Order',
];

const soft = (s) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();

const canonical = new Set();
for (const f of readdirSync(SEED).filter((f) => /^token_catalog_\d{4}\.csv$/.test(f))) {
  for (const t of parseCsv(join(SEED, f))) canonical.add(t.name);
}
for (const g of parseCsv(join(SEED, 'trade_good.csv'))) canonical.add(g.good);
const groupsSeeded = existsSync(GROUP_FILE);
const groups = groupsSeeded ? parseCsv(GROUP_FILE).map((g) => g.name) : PENDING_GROUPS;
for (const g of groups) canonical.add(g);

const canonicalSoft = new Map([...canonical].map((n) => [soft(n), n]));
const aliases = parseCsv(join(SEED, 'token_alias.csv'));

const failures = [];
const fail = (check, msg) => failures.push(`${check}: ${msg}`);

const seen = new Map();
let pending = 0;
for (const a of aliases) {
  if (!canonical.has(a.name)) fail('A1', `"${a.alias}" points at "${a.name}", which is not a canonical name`);
  else if (!groupsSeeded && PENDING_GROUPS.includes(a.name)) pending++;

  const clash = canonicalSoft.get(soft(a.alias));
  if (clash && clash !== a.name) fail('A2', `"${a.alias}" is the canonical name "${clash}"`);
  if (clash === a.name) fail('A4', `"${a.alias}" differs from "${a.name}" only in case or spacing; the form already snaps it`);

  const key = soft(a.alias);
  if (seen.has(key)) fail('A3', `"${a.alias}" collides with "${seen.get(key)}"`);
  else seen.set(key, a.alias);
}

console.log(`${aliases.length} aliases over ${canonical.size} canonical names`);
if (pending) {
  console.log(`    ${pending} point at groups data-model.md names but token_group.csv does not seed yet`);
}
if (failures.length) {
  for (const f of failures) console.error(`FAIL  ${f}`);
  process.exit(1);
}
console.log('all checks passed');
