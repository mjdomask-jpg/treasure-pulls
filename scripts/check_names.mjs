#!/usr/bin/env node
// The name-hygiene validator: one item, one spelling, across every file that
// holds a name. See docs/inherited-practices.md sections 1 and 2, and check V6
// in docs/data-model.md section 7.
//
//   node scripts/check_names.mjs
//
//   N1  ERROR  a curly apostrophe; names use the straight one
//   N2  ERROR  two spellings of one name that differ only in case, whitespace or
//              apostrophe style (the soft fold) -- a typo by construction
//   N3  ERROR  a reference to a name that is not a canonical name exactly
//   N4  NOTE   two names that differ only in punctuation or a trailing plural
//              (the hard fold) and resolve to different things -- usually one
//              item spelled twice, but not always, so a human decides. A pair
//              reviewed and found distinct goes in data/seed/name_distinct.csv.
//
// Names live in separate namespaces (token, event, player): a token and an
// event may share a name. Each name is one of
//   canonical  the name itself        (catalog, trade good, group, event)
//   alias      another name for one  (token_alias.csv)
//   ref        a use of one          (must match a canonical name exactly)
//
// To cover a new file, add a line to SOURCES. Player names arrive with the D1
// export (docs/stack.md); add that file here when it exists.

import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { parseCsv } from './csv.mjs';
import { soft } from './fold.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEED = join(ROOT, 'data', 'seed');
const FIXTURES = join(ROOT, 'scripts', 'fixtures');

const hard = (s) => soft(s).replace(/[^a-z0-9]/g, '').replace(/(es|s)$/, '');

const catalogs = readdirSync(SEED).filter((f) => /^token_catalog_\d{4}\.csv$/.test(f));

// [file, column, namespace, kind, column holding the canonical target (aliases)]
const SOURCES = [
  ...catalogs.map((f) => [join(SEED, f), 'name', 'token', 'canonical']),
  [join(SEED, 'trade_good.csv'), 'good', 'token', 'canonical'],
  [join(SEED, 'token_group.csv'), 'name', 'token', 'canonical'],
  [join(SEED, 'event.csv'), 'name', 'event', 'canonical'],
  [join(SEED, 'token_alias.csv'), 'alias', 'token', 'alias', 'name'],
  [join(SEED, 'token_alias.csv'), 'name', 'token', 'ref'],
  [join(SEED, 'token_group_member.csv'), 'group', 'token', 'ref'],
  [join(SEED, 'token_group_member.csv'), 'member', 'token', 'ref'],
  [join(SEED, 'bonus_tier.csv'), 'name', 'token', 'ref'],
  [join(SEED, 'trade_conversion.csv'), 'good', 'token', 'ref'],
  [join(SEED, 'form_box.csv'), 'item', 'token', 'ref'],
  [join(FIXTURES, '2026_trade_good_items.csv'), 'good', 'token', 'ref'],
];

const entries = [];
for (const [file, col, ns, kind, targetCol] of SOURCES) {
  if (!existsSync(file)) continue;
  const where = `${relative(ROOT, file).replace(/\\/g, '/')}:${col}`;
  for (const row of parseCsv(file)) {
    const name = row[col];
    if (!name) continue;
    entries.push({ name, ns, kind, where, target: targetCol ? row[targetCol] : name });
  }
}

const distinct = existsSync(join(SEED, 'name_distinct.csv'))
  ? parseCsv(join(SEED, 'name_distinct.csv')).map((r) => [r.namespace, r.a, r.b])
  : [];
const reviewedDistinct = (ns, a, b) =>
  distinct.some(([n, x, y]) => n === ns && ((x === a && y === b) || (x === b && y === a)));

const errors = [], notes = [];

// N1
for (const e of entries) {
  if (/[’‘`]/.test(e.name)) errors.push(`N1  "${e.name}" has a curly apostrophe (${e.where})`);
}

const canonical = new Map(); // ns -> Set of names
for (const e of entries.filter((x) => x.kind === 'canonical')) {
  if (!canonical.has(e.ns)) canonical.set(e.ns, new Set());
  canonical.get(e.ns).add(e.name);
}

// N3
for (const e of entries.filter((x) => x.kind === 'ref')) {
  if (!canonical.get(e.ns)?.has(e.name)) errors.push(`N3  "${e.name}" is not a ${e.ns} name (${e.where})`);
}

// What each spelling resolves to, and every place it appears.
const spellings = new Map(); // `${ns}|${name}` -> { ns, name, target, where: Set }
for (const e of entries) {
  const key = `${e.ns}|${e.name}`;
  if (!spellings.has(key)) spellings.set(key, { ns: e.ns, name: e.name, target: e.target, where: new Set() });
  spellings.get(key).where.add(e.where);
}

function groupBy(fold) {
  const groups = new Map();
  for (const s of spellings.values()) {
    const key = `${s.ns}|${fold(s.name)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}
const describe = (g) => g.map((s) => `"${s.name}" (${[...s.where].join(', ')})`).join(' / ');

// N2
for (const g of groupBy(soft)) errors.push(`N2  ${g[0].ns}: ${describe(g)}`);

// N4 -- only pairs the soft fold did not already report, and only where the
// spellings resolve to different things: two aliases of one token are fine.
for (const g of groupBy(hard)) {
  const softForms = new Set(g.map((s) => soft(s.name)));
  const targets = new Set(g.map((s) => s.target));
  if (softForms.size < 2 || targets.size < 2) continue;
  const names = [...new Set(g.map((s) => s.name))];
  const unreviewed = names.some((a, i) => names.slice(i + 1).some((b) => !reviewedDistinct(g[0].ns, a, b)));
  if (unreviewed) notes.push(`N4  ${g[0].ns}: ${describe(g)}`);
}

const count = (ns) => new Set(entries.filter((e) => e.ns === ns).map((e) => e.name)).size;
console.log(`${entries.length} name uses from ${SOURCES.length} columns: ` +
  `${count('token')} token spellings, ${count('event')} event, ${count('player')} player`);
for (const n of notes) console.log(`NOTE  ${n}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  process.exit(1);
}
console.log(notes.length ? `no errors; ${notes.length} note(s) for a human` : 'all checks passed');
