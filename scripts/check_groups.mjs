#!/usr/bin/env node
// Checks data/seed/token_group.csv and token_group_member.csv.
//
//   node scripts/check_groups.mjs
//
// A group is a token that stands for "one of these" (data-model.md section 4,
// *resolution*). How its members are found is the `members` column:
//
//   classification  every catalog token whose classification includes the
//                   group's name (Monster Trophy)
//   listed          the rows in token_group_member.csv
//   none            no members: players only ever enter a count
//
// Players never see members. They exist to keep those names out of the form's
// search box. Rare and Uncommon have none: the in_standard_set flag already
// marks the 40/40, and V7/V9 in check_conversion.mjs already count them.
//
//   G1  group names are unique, and none is also a token or trade good name
//   G2  listed members exist in a catalog; only listed groups have member rows
//   G3  no token belongs to two groups -- a pull rolls up to one parent
//   G4  set_size appears only on count-only groups (chase sets), as a number

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from './csv.mjs';
import { SEED } from './paths.mjs';

const RULES = new Set(['classification', 'listed', 'none']);

const allTokens = readdirSync(SEED)
  .filter((f) => /^token_catalog_\d{4}\.csv$/.test(f))
  .flatMap((f) => parseCsv(join(SEED, f)));
const tokenNames = new Set(allTokens.map((t) => t.name));
const goodNames = new Set(parseCsv(join(SEED, 'trade_good.csv')).map((g) => g.good));
const groups = parseCsv(join(SEED, 'token_group.csv'));
const listedRows = parseCsv(join(SEED, 'token_group_member.csv'));

const failures = [];
const fail = (check, msg) => failures.push(`${check}: ${msg}`);

const seen = new Set();
const parent = new Map(); // token name -> group name
const claim = (group, token) => {
  if (parent.has(token)) fail('G3', `"${token}" is in both "${parent.get(token)}" and "${group}"`);
  else parent.set(token, group);
};

for (const g of groups) {
  if (seen.has(g.name)) { fail('G1', `"${g.name}" is defined twice`); continue; }
  seen.add(g.name);
  if (tokenNames.has(g.name) || goodNames.has(g.name)) fail('G1', `"${g.name}" is also a token name`);
  if (!RULES.has(g.members)) { fail('G1', `"${g.name}" has unknown members rule "${g.members}"`); continue; }

  if (g.set_size !== '' && (g.members !== 'none' || !/^\d+$/.test(g.set_size))) {
    fail('G4', `"${g.name}" has set_size "${g.set_size}"; only count-only chase sets carry one`);
  }

  let members = [];
  if (g.members === 'classification') {
    members = allTokens.filter((t) => t.classification.split('|').includes(g.name)).map((t) => t.name);
  } else if (g.members === 'listed') {
    members = listedRows.filter((r) => r.group === g.name).map((r) => r.member);
    if (!members.length) fail('G2', `"${g.name}" is listed but has no member rows`);
    for (const m of members) if (!tokenNames.has(m)) fail('G2', `"${g.name}" lists "${m}", which is in no catalog`);
  }
  for (const m of members) claim(g.name, m);

  const detail = g.members === 'none' ? (g.set_size ? `count only, set of ${g.set_size}` : 'count only') : `${members.length} members`;
  console.log(`    ${g.name.padEnd(30)} ${g.members.padEnd(15)} ${detail}`);
}

for (const r of listedRows) {
  const g = groups.find((x) => x.name === r.group);
  if (!g) fail('G2', `member row for unknown group "${r.group}"`);
  else if (g.members !== 'listed') fail('G2', `member row for "${r.group}", whose members rule is ${g.members}`);
}

console.log(`${groups.length} groups, ${parent.size} tokens with a parent group`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL  ${f}`);
  process.exit(1);
}
console.log('all checks passed');
