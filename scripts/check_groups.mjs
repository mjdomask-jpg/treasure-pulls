#!/usr/bin/env node
// Checks data/seed/token_group.csv and token_group_member.csv.
//
//   node scripts/check_groups.mjs
//
// A group is a token that stands for "one of these" (data-model.md section 4,
// *resolution*). How its members are found is the `members` column:
//
//   standard_set    that year's in_standard_set tokens of the group's rarity
//   classification  every catalog token whose classification includes the
//                   group's name (Monster Trophy)
//   listed          the rows in token_group_member.csv
//   none            no members: players only ever enter a count
//
//   G1  group names are unique, and none is also a token or trade good name
//   G2  standard_set groups resolve to exactly standard_set.csv's set size
//   G3  listed members exist in a catalog; only listed groups have member rows
//   G4  no token belongs to two groups -- a pull rolls up to one parent
//   G5  set_size appears only on count-only groups (chase sets), as a number

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './csv.mjs';

const SEED = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'seed');
const RULES = new Set(['standard_set', 'classification', 'listed', 'none']);

const catalogs = {};
for (const f of readdirSync(SEED).filter((f) => /^token_catalog_\d{4}\.csv$/.test(f))) {
  catalogs[f.match(/\d{4}/)[0]] = parseCsv(join(SEED, f));
}
const allTokens = Object.values(catalogs).flat();
const tokenNames = new Set(allTokens.map((t) => t.name));
const goodNames = new Set(parseCsv(join(SEED, 'trade_good.csv')).map((g) => g.good));
const standardSet = parseCsv(join(SEED, 'standard_set.csv'));
const groups = parseCsv(join(SEED, 'token_group.csv'));
const listedRows = parseCsv(join(SEED, 'token_group_member.csv'));

const failures = [];
const fail = (check, msg) => failures.push(`${check}: ${msg}`);

const seen = new Set();
const parent = new Map(); // token name -> group name
const claim = (group, token) => {
  if (parent.has(token)) fail('G4', `"${token}" is in both "${parent.get(token)}" and "${group}"`);
  else parent.set(token, group);
};

for (const g of groups) {
  if (seen.has(g.name)) { fail('G1', `"${g.name}" is defined twice`); continue; }
  seen.add(g.name);
  if (tokenNames.has(g.name) || goodNames.has(g.name)) fail('G1', `"${g.name}" is also a token name`);
  if (!RULES.has(g.members)) { fail('G1', `"${g.name}" has unknown members rule "${g.members}"`); continue; }

  if (g.set_size !== '' && (g.members !== 'none' || !/^\d+$/.test(g.set_size))) {
    fail('G5', `"${g.name}" has set_size "${g.set_size}"; only count-only chase sets carry one`);
  }

  let members = [];
  if (g.members === 'standard_set') {
    const catalog = catalogs[g.token_year];
    if (!catalog) { fail('G2', `"${g.name}": no catalog for ${g.token_year}`); continue; }
    members = catalog.filter((t) => t.in_standard_set === '1' && t.rarity === g.rarity).map((t) => t.name);
    const want = standardSet.find((s) => s.event_year === g.token_year && s.rarity === g.rarity);
    if (!want) fail('G2', `"${g.name}": no standard_set row for ${g.token_year} ${g.rarity}`);
    else if (members.length !== Number(want.set_size)) {
      fail('G2', `"${g.name}" resolves to ${members.length} tokens, standard_set says ${want.set_size}`);
    }
  } else if (g.members === 'classification') {
    members = allTokens.filter((t) => t.classification.split('|').includes(g.name)).map((t) => t.name);
  } else if (g.members === 'listed') {
    members = listedRows.filter((r) => r.group === g.name).map((r) => r.member);
    if (!members.length) fail('G3', `"${g.name}" is listed but has no member rows`);
    for (const m of members) if (!tokenNames.has(m)) fail('G3', `"${g.name}" lists "${m}", which is in no catalog`);
  }
  for (const m of members) claim(g.name, m);

  const detail = g.members === 'none' ? (g.set_size ? `count only, set of ${g.set_size}` : 'count only') : `${members.length} members`;
  console.log(`    ${g.name.padEnd(30)} ${g.members.padEnd(15)} ${detail}`);
}

for (const r of listedRows) {
  const g = groups.find((x) => x.name === r.group);
  if (!g) fail('G3', `member row for unknown group "${r.group}"`);
  else if (g.members !== 'listed') fail('G3', `member row for "${r.group}", whose members rule is ${g.members}`);
}

console.log(`${groups.length} groups, ${parent.size} tokens with a parent group`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL  ${f}`);
  process.exit(1);
}
console.log('all checks passed');
