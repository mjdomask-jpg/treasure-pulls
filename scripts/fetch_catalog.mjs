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

// tokendb prefixes transmuted rungs; the canonical ladder does not. See the
// td-domain skill: Enhanced = 3pt = 3 Star, Exalted = 4pt = 4 Star.
const RARITY = {
  'Transmuted-Enhanced (3 pt)': 'Enhanced', 'Transmuted-Exalted (4 pt)': 'Exalted',
  'Transmuted-Relic (5 pt)': 'Relic', 'Transmuted-Legendary': 'Legendary',
  'Transmuted-Mythic': 'Mythic',
};

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

const HEADER = 'name,external_slug,rarity,token_year,tokendb_source,in_standard_set,classification,slot,converts_to,convert_units';
const rows = [...tokens.values()]
  .sort((a, b) => a.name.localeCompare(b.name, 'en'))
  .map((t) => {
    const rarity = RARITY[t.rarity] || t.rarity;
    // The 40/40/40 blind-pack sets -- what condensing converts away.
    const inSet = t.source === 'Standard Pack' && ['Common', 'Uncommon', 'Rare'].includes(rarity) ? 1 : 0;
    return [t.name, t.slug, rarity, YEAR, t.source, inSet, t.classification, t.slot,
      convertsTo[t.slug] || '', units[t.slug] || ''].map(q).join(',');
  });

writeFileSync(OUT, `${HEADER}\n${rows.join('\n')}\n`, 'utf8');
console.log(`${rows.length} tokens -> ${OUT}`);

const by = (f) => [...tokens.values()].reduce((a, t) => (a[f(t)] = (a[f(t)] || 0) + 1, a), {});
console.log('by source   ', by((t) => t.source));
console.log('standard set', by((t) => (t.source === 'Standard Pack' ? RARITY[t.rarity] || t.rarity : null)).undefined === undefined
  ? Object.fromEntries(Object.entries(by((t) => (t.source === 'Standard Pack' ? RARITY[t.rarity] || t.rarity : '-'))).filter(([k]) => k !== '-'))
  : {});
