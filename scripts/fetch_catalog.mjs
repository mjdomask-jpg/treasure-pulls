#!/usr/bin/env node
// Pulls a year's token catalog from tokendb into data/seed/token_catalog_<year>.csv.
//
//   node scripts/fetch_catalog.mjs 2027
//
// tokendb runs FacetWP, whose refresh endpoint is public and returns the rendered
// listing plus a pager. There is no token REST route (the CPT is not exposed), so
// the listing HTML is the interface. Re-run this when the year's chase sets are
// revealed -- for 2027 that is after January 2027, so the catalog written before
// then is deliberately incomplete and carries no 'Treasure Chest Only' rows.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const YEAR = process.argv[2] || '2027';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'seed', `token_catalog_${YEAR}.csv`);
const ENDPOINT = 'https://tokendb.com/wp-json/facetwp/v1/refresh';

const FACETS = {
  token_search: '', usable_by: [], slot: [], pub_year: [YEAR], classification: [],
  rare_box: [], save_bonus: [], ac: [], damage_type: [], stat_bonus: [],
  converts_to: [], source: [],
};

// converts_to is a single facet holding both the good and the points value.
const GOODS = {
  'alchemists-ink': "Alchemist's Ink", 'alchemists-parchment': "Alchemist's Parchment",
  aragonite: 'Aragonite', 'darkwood-plank': 'Darkwood Plank', 'dwarven-steel': 'Dwarven Steel',
  'elven-bismuth': 'Elven Bismuth', 'enchanters-munition': "Enchanter's Munition",
  'golden-fleece': 'Golden Fleece', 'minotaur-hide': 'Minotaur Hide', 'mystic-silk': 'Mystic Silk',
  'oil-of-enchantment': 'Oil of Enchantment', 'philosophers-stone': "Philosopher's Stone",
  'reserve-bar': 'Reserve Bar',
};
const UNITS = { '1-unit': 1, '3-units': 3, '6-units': 6, '10-units': 10 };

// tokendb's rarity field mixes rungs of the canonical ladder with labels for
// families of tokens. Its label is kept verbatim as source_rarity; `rarity` is
// the canonical value. Mapping decided by the owner 2026-09-23 -- see
// docs/data-model.md section 4, *rarity*.
//
// tokendb prefixes transmuted rungs; the canonical ladder does not. See the
// td-domain skill: Enhanced = 3pt = 3 Star, Exalted = 4pt = 4 Star.
const RARITY = {
  'Transmuted-Enhanced (3 pt)': 'Enhanced', 'Transmuted-Exalted (4 pt)': 'Exalted',
  'Transmuted-Relic (5 pt)': 'Relic', 'Transmuted-Legendary': 'Legendary',
  'Transmuted-Mythic': 'Mythic',
  'Transmuted-Arcanum Relic': 'Arcanum', 'Transmuted-Grand Arcanum': 'Arcanum',
  Reserve: '', // the GP bar family, not a rarity; the bar's rung is in trade_good.csv
  Special: '', // Golden Ticket and Treasure Chips -- no rarity
};

// The canonical ladder plus the tokens the td-domain skill puts outside it.
// Premium ranks with Ultra Rare (it is the 1k / 2k Bonus tier) but is kept
// distinct: players want its odds separately from standard-pack Ultra Rares.
const CANONICAL = new Set([
  'Common', 'Uncommon', 'Enhanced', 'Rare', 'Exalted', 'Ultra Rare', 'Premium',
  'Relic', 'Arcanum', 'Legendary', 'Mythic',
  'Safehold', 'Patron', 'Paragon', 'Monster Trophy',
]);

// `Quest` is three unrelated populations: Monster Trophies, chase pieces, and
// (2026 only) mini-game participation tokens. Only the first has a canonical
// value; chase pieces are entered as a set count and the mini-game tokens are
// not treasure, so neither needs a rarity of its own.
function canonicalRarity(t) {
  if (t.rarity === 'Quest') {
    return t.classification.split('|').includes('Monster Trophy') ? 'Monster Trophy' : '';
  }
  return t.rarity in RARITY ? RARITY[t.rarity] : t.rarity;
}

async function page(convertsTo, paged) {
  const body = {
    action: 'facetwp_refresh',
    data: {
      facets: { ...FACETS, converts_to: convertsTo },
      frozen_facets: {}, http_params: { get: {}, uri: '', url_vars: [] },
      template: 'token_search_results', extras: { pager: true, sort: 'default' },
      soft_refresh: 0, is_bfcache: 0, first_load: 0, paged,
    },
  };
  const r = await fetch(ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`tokendb returned ${r.status}`);
  return r.json();
}

async function every(convertsTo, onListing) {
  let paged = 1, pages = 1;
  do {
    const j = await page(convertsTo, paged);
    pages = j.settings?.pager?.total_pages || 1;
    for (const m of j.template.matchAll(
      /<a href="https:\/\/tokendb\.com\/token\/([^"]+?)\/"\s+class="dir-title[^"]*">([\s\S]*?)<\/a>([\s\S]*?)(?=<a href="https:\/\/tokendb\.com\/token\/[^"]+\/"\s+class="dir-title|$)/g
    )) onListing(m[1], m[2], m[3]);
    paged++;
  } while (paged <= pages);
}

const decode = (s) => s
  .replace(/<[^>]*>/g, '').replace(/&#0?39;|&apos;|&#x27;/g, "'").replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&#8217;|&rsquo;/g, '’')
  .replace(/\s+/g, ' ').trim();

const taxon = (html, label) => {
  const m = html.match(new RegExp(`${label}:\\s*((?:<a[^>]*>[^<]*<\\/a>(?:,\\s*)?)+)`));
  return m ? [...m[1].matchAll(/<a[^>]*>([^<]*)<\/a>/g)].map((x) => decode(x[1])).join('|') : '';
};

const tokens = new Map();
await every([], (slug, title, rest) => {
  tokens.set(slug, {
    slug, name: decode(title),
    rarity: taxon(rest, 'Rarity'), source: taxon(rest, 'Source'),
    classification: taxon(rest, 'Classification'), slot: taxon(rest, 'Slot'),
  });
});

const convertsTo = {}, units = {};
for (const [value, label] of Object.entries(GOODS)) {
  await every([value], (slug) => { convertsTo[slug] = label; });
}
for (const [value, n] of Object.entries(UNITS)) {
  await every([value], (slug) => { units[slug] = n; });
}

const q = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// A label tokendb starts using tomorrow must stop the run, not pass through as a
// "rarity" -- two Arcanum labels did exactly that until 2026-09-23.
const unmapped = [...tokens.values()].filter((t) => {
  const r = canonicalRarity(t);
  return r !== '' && !CANONICAL.has(r);
});
if (unmapped.length) {
  const labels = [...new Set(unmapped.map((t) => t.rarity))];
  console.error(`tokendb rarity label(s) with no mapping: ${labels.join(', ')}`);
  for (const t of unmapped) console.error(`  ${t.rarity}  ${t.name}`);
  console.error('Add them to RARITY or CANONICAL in this script, per docs/data-model.md section 4.');
  process.exit(1);
}

const HEADER = 'name,external_slug,rarity,source_rarity,token_year,tokendb_source,in_standard_set,classification,slot,converts_to,convert_units';
const rows = [...tokens.values()]
  .sort((a, b) => a.name.localeCompare(b.name, 'en'))
  .map((t) => {
    const rarity = canonicalRarity(t);
    // The 40/40/40 blind-pack sets -- what condensing converts away.
    const inSet = t.source === 'Standard Pack' && ['Common', 'Uncommon', 'Rare'].includes(rarity) ? 1 : 0;
    return [t.name, t.slug, rarity, t.rarity, YEAR, t.source, inSet, t.classification, t.slot,
      convertsTo[t.slug] || '', units[t.slug] || ''].map(q).join(',');
  });

writeFileSync(OUT, `${HEADER}\n${rows.join('\n')}\n`, 'utf8');
console.log(`${rows.length} tokens -> ${OUT}`);

const by = (f) => [...tokens.values()].reduce((a, t) => (a[f(t)] = (a[f(t)] || 0) + 1, a), {});
console.log('by source   ', by((t) => t.source));
console.log('standard set', Object.fromEntries(Object.entries(
  by((t) => (t.source === 'Standard Pack' ? canonicalRarity(t) || '(none)' : '-')),
).filter(([k]) => k !== '-')));
console.log('by rarity   ', by((t) => `${t.rarity} -> ${canonicalRarity(t) || '(none)'}`));
