#!/usr/bin/env node
// Checks data/seed/event.csv.
//
//   node scripts/check_events.mjs
//
//   E1  venue is in_person, virtual or mail -- it decides which form sections
//       an event shows (data-model.md section 4, *event_year and the mixes*)
//   E2  each year has exactly one mail event, where 10x chips redeemed by
//       mail are entered (data-model.md section 5)
//   E3  every event but the mail one has a start date, and it falls in its
//       event_year; the mail event has none, since it spans the year
//   E4  no two events in a year share a name under the soft fold

import { join } from 'node:path';
import { parseCsv } from './csv.mjs';
import { SEED } from './paths.mjs';
import { soft } from './fold.mjs';

const VENUES = new Set(['in_person', 'virtual', 'mail']);

const events = parseCsv(join(SEED, 'event.csv'));
const failures = [];
const fail = (check, msg) => failures.push(`${check}: ${msg}`);

const seen = new Map();
for (const e of events) {
  if (!VENUES.has(e.venue)) fail('E1', `"${e.name}" has venue "${e.venue}"`);

  if (e.venue === 'mail') {
    if (e.start_date) fail('E3', `"${e.name}" is the mail event and should have no start date`);
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(e.start_date)) {
    fail('E3', `"${e.name}" has start date "${e.start_date}", expected YYYY-MM-DD`);
  } else if (e.start_date.slice(0, 4) !== e.event_year) {
    fail('E3', `"${e.name}" starts ${e.start_date}, outside ${e.event_year}`);
  }

  const key = `${e.event_year}|${soft(e.name)}`;
  if (seen.has(key)) fail('E4', `${e.event_year} "${e.name}" collides with "${seen.get(key)}"`);
  else seen.set(key, e.name);
}

const years = [...new Set(events.map((e) => e.event_year))].sort();
for (const y of years) {
  const mail = events.filter((e) => e.event_year === y && e.venue === 'mail').length;
  if (mail !== 1) fail('E2', `${y} has ${mail} mail events, expected 1`);
  const n = (v) => events.filter((e) => e.event_year === y && e.venue === v).length;
  console.log(`    ${y}  ${n('virtual')} virtual, ${n('in_person')} in person, ${n('mail')} mail`);
}

console.log(`${events.length} events`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL  ${f}`);
  process.exit(1);
}
console.log('all checks passed');
