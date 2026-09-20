# Seed vocabularies

Hand-authored reference data. One file per table in `docs/data-model.md` § 4 and
§ 6, named for the table exactly — this project's thesis is that one thing gets
one spelling, and a file whose name differs from its table is the first place
that breaks.

**These are inputs, not exports.** `stack.md`'s data flow ends in a periodic D1 →
CSV export for the name-hygiene check to run over; those files will land
elsewhere. Nothing in this directory is generated, and nothing here should ever
be overwritten by the export.

Pinned to LF by `.gitattributes`, like every CSV in the repo.

## Keying

**Rows join on canonical token name, not on an id and not on a tokendb slug.**

An integer `token_id` cannot appear in a hand-authored file — it does not exist
until the catalog is loaded. The tokendb slug is the canonical cross-project key
per `data-model.md` § 4, but it lives on `token.external_slug` and is attached in
the token catalog CSV, which is not written yet. Putting slugs here too would
mean two independent transcriptions of the same external identifier, and one of
them going stale silently.

So: the loader resolves `good` against `token.name`, and an unmatched name is an
ERROR, not a silent skip. The names below are the **canonical** spellings from the
`td-domain` skill, which differ from other sources in three places worth knowing:

| Canonical | Also seen as | Where |
|---|---|---|
| `Enchanter's Munition` | `Enhchanter's Munition` | both owner answer docs (typo) |
| `1,000 GP Gold Bar` | `1,000 GP Bar` | 2026 workbook column header |
| `Philosopher's Stone` | — | consistent everywhere |

Those belong in `token_alias` when the catalog is written.

## Provenance

Every row of `trade_conversion.csv` carries its own `source`, per
`inherited-practices.md` § 4. Two values are in use:

- **`owner`** — the Uncommon and Rare counts, given directly. Authoritative.
- **`tokendb`** — the Common counts, which the owner's tables do not give.
  Counted per token from `token_catalog_<year>.csv`, not from a facet aggregate.

The catalogs corroborate the owner's numbers completely: **all 66 cells agree**,
both years, both provenances, with no residue in either direction. `gp_source` is
confirmed too — tokendb's `Reserve Bar` count is 5 per year, which is 1 Common +
2 Uncommon + 2 Rare. V9 re-runs the whole comparison on every check.

## `token_catalog_2026.csv`, `token_catalog_2027.csv`

Generated, not hand-authored — **re-runnable**:

```
node scripts/fetch_catalog.mjs 2027
```

One row per token, from tokendb: name, slug (which is `token.external_slug`),
rarity, source, classification, slot, `converts_to` and `convert_units`.
`in_standard_set` is computed as `Standard Pack` ∧ rarity ∈ {Common, Uncommon,
Rare} — the 40/40/40, which is what condensing converts away.

**2027 is deliberately incomplete.** It carries no `Treasure Chest Only` tokens,
because the season's chase sets and treasure-exclusive Rares are not public until
after January 2027. 2026 has 68 of them, which is the size of what is missing.
**Re-run the fetcher then.**

tokendb's transmuted rungs are normalised on the way in
(`Transmuted-Exalted (4 pt)` → `Exalted`, and four siblings). `Quest`, `Special`,
`Premium` and `Paragon` are passed through as-is pending a mapping decision — see
`data-model.md` § 10.

| File | Source |
|---|---|
| `trade_conversion.csv` | per-row; see above. Owner counts from `handoff-document-review-answers.md` (2026) and its § 3 **corrected** 2027 table |
| `conversion_rule.csv` | project owner, 2026-09-19 — `handoff-2026-09-19-ANSWERS.md` § *Question 3* |
| `gp_source.csv` | same |
| `standard_set.csv` | `data-model-review.md` — "a fixed set of 40 rare, 40 uncommon, and 40 common tokens" |
| `mix.csv`, `mix_year.csv` | owner answers of 2026-09-19, throughout |

**Use the corrected 2027 table only.** An earlier version circulated with
Oil of Enchantment at 0 Uncommon and Philosopher's Stone at 6, which made the
Uncommon column sum to 34 instead of 38. The version here sums correctly and is
the one that reproduces the measurement.

## Conventions that look wrong and are not

**Zero rows are kept.** `Dwarven Steel` and `Minotaur Hide` carry explicit `0`
for both Uncommon and Rare. Elsewhere in this model a zero row and a missing row
mean different things and only non-zero rows are stored — but that rule is about
*observations*. These are *assertions*: "this good has no Uncommon or Rare
source." That assertion is under active test (`data-model.md` § 2, the
substitution finding), so deleting the row would delete the claim.

**Common rows are present but never enter the estimate.** Commons are in the
treasure pool only by accident, so the condensed conversion model converts Rare
and Uncommon only — `check_conversion.mjs` skips any rarity it has no converted
amount for, and adding the Common rows left the end-to-end result unchanged at
0.18%. They are here because they are what let the "Commons are converted too"
explanation for Dwarven Steel and Minotaur Hide be tested, and rejected.

**`conversion_rule.csv` has no Common row for Trade 2.** The rule as stated maps
Uncommon weapons → Elven Bismuth, Uncommon armor → Oil of Enchantment, and Rare
weapons or armor → Aragonite. Commons are not mentioned, so no row asserts one. A
future Common count against a Trade 2 good would have no rule to apply, which the
loader should report rather than default to 1 point.

**`gp_source.csv` names no bar.** The source side is here; which bar a given GP
total yields comes from `token.gp_value` (1,000 / 5,000 / 25,000), so the two are
not transcribed twice.

**`mix_year.venue` is advisory.** Condensed and pack-substitute are virtual-only
*today*, and the owner has said that could change. V8 reports a mismatch as a
NOTE, never an ERROR — a rule change should not make the form reject true data.

## Checking

`scripts/check_conversion.mjs` does two things, and both should pass before this
data is trusted:

1. **V7** — per year and rarity, `trade_conversion` counts plus `gp_source`
   token counts equal `standard_set.set_size`. Both years come to 38 + 2 = 40.
   This is the check that caught the missing Oil of Enchantment row.
2. **The end-to-end prediction** — feeds the 2026 rows through the rules and
   reproduces `data-model.md` § 2's per-pack trade-good yield. Agreement is
   within 0.2% of the 4,991 condensed items measured in the 2026 workbook.

The second is the one that matters. It means the committed CSVs are not merely
internally consistent; they are the numbers that actually predicted the observed
data.
