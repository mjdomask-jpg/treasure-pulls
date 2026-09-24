#!/usr/bin/env node
// Proves every check still catches what it is for.
//
//   npm test
//
// Each case copies data/seed and scripts/fixtures to a scratch directory, breaks
// the copy in one deliberate way, runs one check against it (SEED_DIR and
// FIXTURES_DIR; see paths.mjs), and asserts that the check fails and names the
// rule the break was aimed at. A rule that silently stops firing would leave
// `npm run check` green; this is what turns that into a red run. The committed
// files are never written.
//
// Two guards keep the list honest:
//   - every check must first pass on the unbroken copy, so a case cannot "fail"
//     only because the copy is incomplete;
//   - every rule code a check can emit (read from its source) must have a case,
//     and every scripts/check_*.mjs must have one, so a new rule or a new check
//     without a test fails here.
//
// To add a case: name the check, the rule, and the edits, which are
// [file, edit] pairs. file is 'seed/<name>.csv' or 'fixtures/<name>.csv'.

import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from './paths.mjs';

const HERE = join(ROOT, 'scripts');

// --- edits -------------------------------------------------------------------
// Each throws if its target is missing, so a seed change that removes the row a
// case aims at shows up as a broken case rather than a case that tests nothing.

const append = (line) => (text) => {
  if (!text.endsWith('\n')) throw new Error('file does not end with a newline');
  return `${text}${line}\n`;
};
const replace = (from, to) => (text) => {
  if (!text.includes(from)) throw new Error(`"${from}" not found`);
  return text.replace(from, to);
};
const dropLines = (prefix) => (text) => {
  const lines = text.split('\n');
  const kept = lines.filter((l) => !l.startsWith(prefix));
  if (kept.length === lines.length) throw new Error(`no line starts "${prefix}"`);
  return kept.join('\n');
};

// --- cases -------------------------------------------------------------------
// expect: 'fail' (non-zero exit, the rule named), 'note' (exit 0, the rule
// named as a note), or 'quiet' (exit 0, nothing named).

const CASES = [
  ['check_conversion', 'JOIN', 'a conversion row names a good that is not a trade good',
    [['seed/trade_conversion.csv', append('2027,Moonstone Shard,Rare,0,owner')]]],
  ['check_conversion', 'V7', 'a year\'s Rare conversion counts no longer sum to 40',
    [['seed/trade_conversion.csv', replace('2027,Mystic Silk,Rare,7,owner', '2027,Mystic Silk,Rare,8,owner')]]],
  ['check_conversion', 'V9', 'the catalog converts a standard-set token to a different good',
    [['seed/token_catalog_2026.csv', replace('Legs,Mystic Silk,6,', 'Legs,Darkwood Plank,6,')]]],
  ['check_conversion', 'RULE', 'a conversion rule the arithmetic needs is missing',
    [['seed/conversion_rule.csv', dropLines('2026,1,Rare,')]]],
  ['check_conversion', 'E2E', 'the observed condensed yield no longer matches the prediction',
    [['fixtures/2026_trade_good_items.csv', replace('Mystic Silk,8,360', 'Mystic Silk,8,1360')]]],

  ['check_aliases', 'A1', 'an alias points at no canonical name',
    [['seed/token_alias.csv', append('Moon Rock,Moonstone Shard,test,')]]],
  ['check_aliases', 'A2', 'an alias is itself another item\'s canonical name',
    [['seed/token_alias.csv', append('Darkwood Plank,Mystic Silk,test,')]]],
  ['check_aliases', 'A3', 'two aliases differ only in case',
    [['seed/token_alias.csv', append('ds,Dwarven Steel,test,')]]],
  ['check_aliases', 'A4', 'an alias differs from its target only in case',
    [['seed/token_alias.csv', append('mystic silk,Mystic Silk,test,')]]],

  ['check_groups', 'G1', 'a group is defined twice',
    [['seed/token_group.csv', append('Monster Trophy,Monster Trophy,,,classification,test')]]],
  ['check_groups', 'G1', 'a group has a trade good\'s name',
    [['seed/token_group.csv', append('Mystic Silk,,,,none,test')]]],
  ['check_groups', 'G1', 'a group has an unknown members rule',
    [['seed/token_group.csv', append('Test Group,,,,sometimes,test')]]],
  ['check_groups', 'G2', 'a listed group has no member rows',
    [['seed/token_group.csv', append('Test Group,,,,listed,test')]]],
  ['check_groups', 'G2', 'a listed member is in no catalog',
    [['seed/token_group_member.csv', append('Cloak or Gloves of the Order,Cloak of Moonlight,test')]]],
  ['check_groups', 'G2', 'a member row names an unknown group',
    [['seed/token_group_member.csv', append('No Such Group,Cloak of the Order,test')]]],
  ['check_groups', 'G2', 'a member row belongs to a group that is not listed',
    [['seed/token_group_member.csv', append('Monster Trophy,Cloak of the Order,test')]]],
  ['check_groups', 'G3', 'one token is in two groups',
    [['seed/token_group.csv', append('Test Group,,,,listed,test')],
     ['seed/token_group_member.csv', append('Test Group,Cloak of the Order,test')]]],
  ['check_groups', 'G4', 'a listed group carries a set size',
    [['seed/token_group.csv', replace('Cloak or Gloves of the Order,Rare,2026,,listed', 'Cloak or Gloves of the Order,Rare,2026,2,listed')]]],
  ['check_groups', 'G4', 'a chase set\'s size is not a number',
    [['seed/token_group.csv', replace('Mystery Chase Set (40),,2027,40,none', 'Mystery Chase Set (40),,2027,forty,none')]]],

  ['check_events', 'E1', 'an event has an unknown venue',
    [['seed/event.csv', replace('2027,Gen Con,,in_person,', '2027,Gen Con,,convention,')]]],
  ['check_events', 'E2', 'a year has two mail events',
    [['seed/event.csv', append('2027,Second mail event,,mail,,test,')]]],
  ['check_events', 'E2', 'a year has no mail event',
    [['seed/event.csv', dropLines('2027,10x Pull redeemed by mail,')]]],
  ['check_events', 'E3', 'the mail event has a start date',
    [['seed/event.csv', replace('redeemed by mail,,mail,,', 'redeemed by mail,,mail,2027-06-01,')]]],
  ['check_events', 'E3', 'a start date is not YYYY-MM-DD',
    [['seed/event.csv', replace('2027-08-05', 'Aug 5 2027')]]],
  ['check_events', 'E3', 'a start date falls outside its year',
    [['seed/event.csv', replace('2027-08-05', '2026-08-05')]]],
  ['check_events', 'E4', 'two events in a year differ only in case and spacing',
    [['seed/event.csv', append('2027,gen  con,,in_person,2027-08-06,test,')]]],

  ['check_names', 'N1', 'a name has a curly apostrophe',
    [['seed/token_alias.csv', append('Alchemist’s Tincture,Alchemist\'s Ink,test,')]]],
  ['check_names', 'N2', 'two spellings of one name differ only in case',
    [['seed/token_alias.csv', append('mystic silk,Mystic Silk,test,')]]],
  ['check_names', 'N3', 'a reference is not a canonical name',
    [['seed/bonus_tier.csv', replace('2026,Ring of the 1st Circle,', '2026,Ring of the First Circle,')]]],
  ['check_names', 'N4', 'a near-miss pair resolves to two different things',
    [['seed/token_alias.csv', append('Mystic-Silk,Darkwood Plank,test,')]], 'note'],
  ['check_names', 'N4', 'a near-miss pair a human reviewed as distinct is not reported',
    [['seed/token_alias.csv', append('Mystic-Silk,Darkwood Plank,test,')],
     ['seed/name_distinct.csv', append('token,Mystic Silk,Mystic-Silk,test,')]], 'quiet'],

  ['check_form_boxes', 'F1', 'a box names a group from another year',
    [['seed/form_box.csv', append('2027,standard,7,Cloak or Gloves of the Order')]]],
  ['check_form_boxes', 'F1', 'a box names neither a group nor a trade good',
    [['seed/form_box.csv', append('2027,standard,7,Moonstone Shard')]]],
  ['check_form_boxes', 'F2', 'a box names a mix the year does not offer',
    [['seed/form_box.csv', append('2027,standrd,1,Rare (2027)')]]],
  ['check_form_boxes', 'F3', 'a section lists an item twice',
    [['seed/form_box.csv', append('2027,standard,7,Rare (2027)')]]],
  ['check_form_boxes', 'F3', 'a section skips a position',
    [['seed/form_box.csv', append('2027,standard,9,Aragonite')]]],
  ['check_form_boxes', 'F4', 'an offered section has no boxes',
    [['seed/form_box.csv', dropLines('2027,pack_substitute,')]]],
].map(([check, rule, what, edits, expect = 'fail']) => ({ check, rule, what, edits, expect }));

// --- running -----------------------------------------------------------------

const scratchRoot = mkdtempSync(join(tmpdir(), 'treasure-pulls-checks-'));
let n = 0;

function scratchCopy(edits = []) {
  const dir = join(scratchRoot, String(n++));
  cpSync(join(ROOT, 'data', 'seed'), join(dir, 'seed'), { recursive: true });
  cpSync(join(HERE, 'fixtures'), join(dir, 'fixtures'), { recursive: true });
  for (const [file, edit] of edits) {
    const path = join(dir, file);
    writeFileSync(path, edit(readFileSync(path, 'utf8')));
  }
  return dir;
}

function run(script, dir) {
  const r = spawnSync(process.execPath, [join(HERE, script)], {
    env: { ...process.env, SEED_DIR: join(dir, 'seed'), FIXTURES_DIR: join(dir, 'fixtures') },
    encoding: 'utf8',
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

// How a check reports each kind of finding.
const named = (check, rule, kind) =>
  check === 'check_names'
    ? new RegExp(`^${kind === 'note' ? 'NOTE ' : 'ERROR'} ${rule} `, 'm')
    : new RegExp(`^FAIL  ${rule}:`, 'm');

const problems = [];
const checks = readdirSync(HERE).filter((f) => /^check_\w+\.mjs$/.test(f)).map((f) => f.replace(/\.mjs$/, ''));

try {
  // Every check passes on the unbroken copy.
  const clean = scratchCopy();
  for (const check of checks) {
    const r = run(`${check}.mjs`, clean);
    const note = /^NOTE /m.test(r.out);
    console.log(`${r.code === 0 && !note ? 'ok  ' : 'FAIL'}  ${check.padEnd(17)} ----  passes on the unbroken copy`);
    if (r.code !== 0 || note) problems.push(`${check} does not pass on an unbroken copy of the data:\n${r.out}`);
  }

  // Every rule, and every check, has at least one case.
  for (const check of checks) {
    const src = readFileSync(join(HERE, `${check}.mjs`), 'utf8');
    const rules = new Set([
      ...[...src.matchAll(/fail\('([A-Z0-9]+)'/g)].map((m) => m[1]),
      ...[...src.matchAll(/(?:errors|notes)\.push\(`(N\d)/g)].map((m) => m[1]),
    ]);
    if (!rules.size) problems.push(`${check}: found no rule codes in its source; teach checks.test.mjs how it reports`);
    for (const rule of rules) {
      if (!CASES.some((c) => c.check === check && c.rule === rule)) problems.push(`${check} ${rule} has no case`);
    }
  }
  for (const c of CASES) {
    if (!checks.includes(c.check)) problems.push(`a case names ${c.check}, which does not exist`);
  }

  // Each break is caught, by the rule it was aimed at.
  for (const c of CASES) {
    let dir;
    try {
      dir = scratchCopy(c.edits);
    } catch (e) {
      console.log(`FAIL  ${c.check.padEnd(17)} ${c.rule.padEnd(4)}  ${c.what}`);
      problems.push(`${c.check} ${c.rule} (${c.what}): the edit no longer applies: ${e.message}`);
      continue;
    }
    const r = run(`${c.check}.mjs`, dir);
    const ok =
      c.expect === 'fail' ? r.code !== 0 && named(c.check, c.rule, 'fail').test(r.out)
      : c.expect === 'note' ? r.code === 0 && named(c.check, c.rule, 'note').test(r.out)
      : r.code === 0 && !/^(NOTE|ERROR|FAIL) /m.test(r.out);
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${c.check.padEnd(17)} ${c.rule.padEnd(4)}  ${c.what}`);
    if (!ok) problems.push(`${c.check} ${c.rule} (${c.what}): expected ${c.expect}, got exit ${r.code}:\n${r.out}`);
  }

  // The runner runs every check even after one fails, and names each failure.
  const broken = scratchCopy([
    ['seed/event.csv', replace('2027,Gen Con,,in_person,', '2027,Gen Con,,convention,')],
    ['seed/form_box.csv', append('2027,standard,7,Moonstone Shard')],
  ]);
  const r = run('run_checks.mjs', broken);
  const ok = r.code !== 0 && /^FAIL  check_events\.mjs$/m.test(r.out) &&
    /^FAIL  check_form_boxes\.mjs$/m.test(r.out) && /^ok    check_aliases\.mjs$/m.test(r.out);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${'run_checks'.padEnd(17)} ----  runs every check past a failure and names each one`);
  if (!ok) problems.push(`run_checks did not report both failures:\n${r.out}`);
} finally {
  rmSync(scratchRoot, { recursive: true, force: true });
}

console.log(`\n${CASES.length} cases over ${checks.length} checks`);
if (problems.length) {
  for (const p of problems) console.error(`\nFAIL  ${p}`);
  process.exit(1);
}
console.log('every check catches every break aimed at it');
