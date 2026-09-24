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

They are in `token_alias.csv`.

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
`rarity` is canonical; `source_rarity` is tokendb's own label, verbatim.
`in_standard_set` is computed as `Standard Pack` ∧ rarity ∈ {Common, Uncommon,
Rare} — the 40/40/40, which is what condensing converts away.

**2027 is deliberately incomplete.** It carries no `Treasure Chest Only` tokens,
because the season's chase sets and treasure-exclusive Rares are not public until
after January 2027. 2026 has 68 of them, which is the size of what is missing.
**Re-run the fetcher then.**

**tokendb's rarity labels are mapped on the way in**, per the owner's decision of
2026-09-23 (`data-model.md` § 4, *`rarity`*):

| tokendb `source_rarity` | canonical `rarity` |
|---|---|
| `Transmuted-Enhanced (3 pt)`, `-Exalted (4 pt)`, `-Relic (5 pt)`, `-Legendary`, `-Mythic` | the rung without the prefix |
| `Transmuted-Arcanum Relic`, `Transmuted-Grand Arcanum` | `Arcanum` |
| any tokendb label, when `bonus_tier.csv` lists the token as 1k or 2k Bonus | `Premium` |
| `Quest` with classification `Monster Trophy` | `Monster Trophy` |
| `Quest` otherwise (chase pieces, and four 2026 mini-game tokens) | *empty* |
| `Reserve` (the GP bar family), `Special` (Golden Ticket, Treasure Chips) | *empty* |
| anything else | passed through, and must be on the canonical ladder or be `Premium`, `Safehold`, `Patron`, `Paragon` or `Monster Trophy` |

**An empty `rarity` is deliberate**, not a gap. It marks a token that has no
rarity: chase pieces are entered as a set count, the mini-game tokens are not
treasure at all, and GP bars are known by their trade rung.

**A tokendb label the fetcher does not know stops the run** and names the
tokens. It does not pass through. Two Arcanum labels slipped through silently
until 2026-09-23, which is why this check exists.

| File | Source |
|---|---|
| `trade_conversion.csv` | per-row; see above. Owner counts from `handoff-document-review-answers.md` (2026) and its § 3 **corrected** 2027 table |
| `conversion_rule.csv` | project owner, 2026-09-19 — `handoff-2026-09-19-ANSWERS.md` § *Question 3* |
| `gp_source.csv` | same |
| `standard_set.csv` | `data-model-review.md` — "a fixed set of 40 rare, 40 uncommon, and 40 common tokens" |
| `mix.csv`, `mix_year.csv` | owner answers of 2026-09-19, throughout |
| `token_alias.csv` | per row, in its own `source` column: the three workbooks, the auction project's origin/main, the owner answer docs, or the `td-domain` skill's trade-good codes |
| `event.csv` | per row: truedungeon.com/2027-events-info, read 2026-09-24; the mail event is `data-model.md` § 5 |
| `token_group.csv` | `data-model.md` § 4, *`resolution`*, where each group is decided; the Monster Trophy label is the owner's, 2026-09-24 |
| `token_group_member.csv` | per row, in its own `source` column: `token_catalog_2026.csv` and the 2026 workbook |
| `name_distinct.csv` | human review; empty until a hard-fold near-miss is judged to be two different things |
| `trade_good.csv` | the trade ladder in the `td-domain` skill. The 100,000 GP Mythic Ore Bar (Trade 5) was added 2026-09-24 from tokendb's classification `Trade 5`, confirmed by the owner. No treasure pull has ever reported one, but it must be possible to record it |
| `bonus_tier.csv` | per row: the auction project's display names on origin/main (commit given in each row), confirmed by the owner 2026-09-24 |

**Use the corrected 2027 table only.** An earlier version circulated with
Oil of Enchantment at 0 Uncommon and Philosopher's Stone at 6, which made the
Uncommon column sum to 34 instead of 38. The version here sums correctly and is
the one that reproduces the measurement.

## `bonus_tier.csv`

The 1k, 2k and 8k Bonus token for each year, one row per tier. It is
hand-authored because tokendb cannot identify the 2k Bonus token. See
`data-model.md` § 4, *`rarity`*. The fetcher reads it to set `rarity =
Premium` on the 1k and 2k tokens, and copies the tier into the catalog's
`bonus_tier` column. **Add the new year's three rows before fetching that
year**; the auction project's display names are the source. A row naming a
token tokendb does not have stops the fetch.

## `event.csv`

One row per event a player can pick. An in-person convention is one event
however many games it runs, because every game there shares one treasure pool.
`venue` (`in_person`, `virtual` or `mail`) decides which form sections the event
shows. Each year has exactly one `mail` event, *"10x Pull redeemed by mail"*,
with no date. `scripts/check_events.mjs` checks the venue, the one mail event,
that every other event's start date falls in its year, and that no two names in
a year differ only in case or spacing.

## `token_group.csv`, `token_group_member.csv`

A group is a stack the player counts: "12 Rares", "3 Golem Chaser". Players
never see a group's members. Each group names **a rule for finding its
members** instead of listing them: `classification`, `listed` or `none`. Most
groups, Rare and Uncommon included, are `none`: count only, no members. The
two that have members, Monster Trophy and Cloak or Gloves of the Order, have
them so that the form's search box can leave those names out. Only `listed`
groups need rows in `token_group_member.csv`, which today is two rows.
`scripts/check_groups.mjs` fails if a listed member is missing, any token
lands in two groups, or a set size appears outside a chase set. See
`data-model.md` § 4, *`resolution`*.

`Mystery Treasure Chest Rare` is a 2027 placeholder, like the two Mystery chase
sets. It stands for the year's treasure-chest-only Rares, which are unknown
until after January (in 2026 they were Cloak and Gloves of the Order). At the
reveal it is renamed in place, keeps its old name as an alias, and becomes a
`listed` group.

## `form_box.csv`

The count boxes each form section shows before a player searches for anything,
one row per box: `event_year`, `mix` (`standard`, `condensed` or
`pack_substitute`), `position` (1 at the top) and `item`, which is a group or a
trade good. The lists were chosen by measuring how often 2026 submissions under
each treatment listed each item. The pack-substitute list is the owner's
hypothesis, because 2026 recorded no pack substitutes. The measurements are in
`data-model.md` § 4, *Which count boxes each section shows*.
`scripts/check_form_boxes.mjs` fails if an item is not a group or trade good of
that year, a mix is not offered that year, a section repeats an item or skips a
position, or a section that an event can show has no boxes.

## `name_distinct.csv`

Pairs of names that differ only in punctuation or a trailing plural, which a
human has reviewed and found to be **two different things**. An example of such
a pair is `+1 Turkey Leg` and `+1 Turkey Leg of Smiting`. `scripts/check_names.mjs`
reports near-miss pairs as notes (N4), and a pair listed here stops being
reported. Columns: `namespace` (`token`, `event` or `player`), `a`, `b`,
`reviewed_by`, `note`. It is empty today because the current data has no such
pairs.

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
total yields comes from `token.gp_value` (1,000 / 5,000 / 25,000 / 100,000), so the two are
not transcribed twice.

**`mix_year.venue` decides which form sections an event shows** (owner,
2026-09-24): condensed and pack substitutes appear only at virtual events. It is
data so that a rule change is a one-row edit here, not a code change. See
`data-model.md` § 4, *`event_year` and the mixes*.

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
