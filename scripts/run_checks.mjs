#!/usr/bin/env node
// Runs every data check and reports on all of them.
//
//   npm run check
//
// Every scripts/check_*.mjs is found by name, so a new check runs in CI the day
// it is added, with no list here to forget to update. Each one runs even when
// an earlier one failed. The auction project chained its suites with && and
// learned the cost: CI showed one failure, the fix landed, and only then did a
// second, unrelated failure surface (its PR #277, 2026-09-22).
//
// fetch_catalog.mjs is not a check and is not run: it reads tokendb over the
// network, so its result changes when tokendb does, not when this repo does.

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const checks = readdirSync(here).filter((f) => /^check_\w+\.mjs$/.test(f)).sort();

if (!checks.length) {
  console.error('FAIL  no scripts/check_*.mjs found');
  process.exit(1);
}

const results = [];
for (const file of checks) {
  console.log(`\n> node scripts/${file}\n`);
  const r = spawnSync(process.execPath, [join(here, file)], { stdio: 'inherit' });
  results.push({ file, ok: r.status === 0 });
}

const failed = results.filter((r) => !r.ok);
console.log('\n--- summary ---');
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.file}`);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
