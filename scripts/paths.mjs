// Where the checks read their data. Normally data/seed and scripts/fixtures;
// SEED_DIR and FIXTURES_DIR point them elsewhere, which is how
// checks.test.mjs runs every check against a scratch copy it has broken on
// purpose, without touching the committed files.

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SEED = process.env.SEED_DIR ? resolve(process.env.SEED_DIR) : join(ROOT, 'data', 'seed');
export const FIXTURES = process.env.FIXTURES_DIR ? resolve(process.env.FIXTURES_DIR) : join(ROOT, 'scripts', 'fixtures');
