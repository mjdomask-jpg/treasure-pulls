# Backlog

This is the single list of open work for the project. Each item should make sense
without reading anything else, and points at the document that has the detail.
Items are removed when they are done, and git history keeps the record.

Last groomed **2026-09-24**.

---

## Up next, in dependency order

Nothing is being built until the owner says so. This is the order to build in
once they do.

1. **Record the rarity mapping in the token catalogs.** tokendb labels some
   tokens with values that are not rarities, such as `Quest` for chase pieces
   and Monster Trophies, and `Reserve` for the 100,000 GP bar. The owner decided
   on 2026-09-23 how each of these maps. The catalog fetcher should keep
   tokendb's label in a `source_rarity` column and write the canonical rarity
   beside it. It also has a gap: it does not yet map `Transmuted-Arcanum Relic`
   or `Transmuted-Grand Arcanum` to `Arcanum`. The full mapping table is in
   `data-model.md` § 4, under *`rarity`*.

2. **Add the 100,000 GP Mythic Ore Bar to the trade-good seed.** It belongs in
   `data/seed/trade_good.csv` at Trade 5 with a GP value of 100,000. tokendb
   classifies it Trade 5, and the `td-domain` skill was updated to match on
   2026-09-23. No one has ever reported pulling one, but it must be possible to
   record it if it happens. The conversion check (`check_conversion.mjs`) must
   still pass afterwards.

3. **Seed the token aliases.** Old spellings and names from other sources need
   to point at the canonical token, because a spelling normaliser cannot link
   two completely different names. The known mappings are:
   - `10x Pull` → `10x Treasure Chips`, and `3x Pull` → `3x Treasure Chips` (the
     3x no longer drops, but it appears in old data)
   - `Monster Bits` → `Monster Bit`
   - `1,000 GP Bar` → `1,000 GP Gold Bar`
   - `Enhchanter's Munition` → `Enchanter's Munition`
   - the auction site's `Golem Piece (40 unique)` → `Golem Chaser (set of 40)`
   - the auction site's `Herald Token (20 unique)` → `Herald's Chaser (set of 20)`

   Detail is in `data-model.md` § 4, under *`token_alias`*.

4. **Seed the groups players pick from.** "Rare (2027)" and "Uncommon (2027)"
   stand for the 40 standard-set tokens of each rarity, so nobody has to pick
   from 40 names. "Cloak or Gloves of the Order" is a group of two. Chase sets
   are groups too, but they are entered as a count of sets and need only a set
   size, with no member list. 2027's chase sets are not public yet, so they
   are seeded as placeholders named `Mystery Chase Set (40)` and
   `Mystery Chase Set (20)` (see *Waiting on outside events* below). Detail is in
   `data-model.md` § 4, under *`resolution`*.

5. **Build the name-hygiene validator.** This is a check that catches two
   spellings of the same player, event or token, such as `Hacky` and `hacky`,
   before they become two records. It needs no user interface and no database,
   and it has real data to run against. Detail is in `inherited-practices.md`
   § 1 and in check V6 of `data-model.md` § 7.

6. **Add `package.json` and continuous integration.** At the moment the
   conversion check only runs when a person remembers to run it. `stack.md`
   commits to running the `.mjs` validators automatically on every change. That
   automation is what turns the check from a convention into a gate.

7. **Design and build the entry form.** Every enterable token is either a
   **dedicated field** (Rare, Uncommon, the chase sets, Monster Trophy, 10x
   Treasure Chips, Cloak or Gloves, the trade goods, the named Ultra Rare-or-better
   items) or **enterable from a searchable list, with no dedicated field**
   (Paragon, the 100,000 GP bar, anything unexpected). It must work
   well on a phone. It must never use the phrase "total pulls" (see
   `data-model.md` § 3). There is no team field and no seat-count field.

   **One submission covers everything from one event, across all three
   treatments.** A player may have a few condensed packs from runs where they
   hit max treasure, standard treasure from their other runs, and pack
   substitutes on top. They enter all of it in one go, and each item records
   which treatment it came from. *Proposed layout, awaiting the owner's call:*
   the form opens by asking "What did you get?" with three tick-boxes
   (Standard, Condensed packs, Pack substitutes). It then shows only the
   sections that were ticked, so most players never scroll past sections that
   don't apply to them.

   **No check may stop a submission.** The form requires an event, the
   reporter's name and at least one item, and nothing else. Each item's
   treatment comes from the section it was entered in. Only one check is ever
   shown to the player, as a one-line hint they can dismiss: condensed treasure
   not coming to a multiple of 10. The Standard section also carries a line of
   help text: items from redeeming a 10x Treasure Chip belong there, even if the
   chip came from a condensed pack. The chip itself is an ordinary item,
   entered wherever it was received; its ten pulls come later and are entered
   under the event where it was redeemed, or under "10x Pull redeemed by mail". A name
   that differs from an existing one only in capital letters or spacing is
   quietly replaced with the existing spelling. Everything else is flagged for
   maintainers and is invisible to the player. Detail is in `data-model.md` § 7.

## Waiting on outside events

- **Re-fetch the 2027 token catalog after January 2027.** 2027's chase sets and
  treasure-only Rares are not published until then, so
  `data/seed/token_catalog_2027.csv` is missing them. Run
  `node scripts/fetch_catalog.mjs 2027` and then re-run the checks.
- **Rename the Mystery chase set placeholders once the 2027 sets are revealed.**
  Rename each one in place and keep the old name as an alias, so entries made
  before the reveal stay attached to the right set. If 2027 does not have exactly
  one 40-piece set and one 20-piece set, add or resize the placeholders.

## Findings to re-test with 2027 data

- **The 1,000 GP Gold Bar shortfall in condensed treasure.** In 2026, condensed
  packs held about a third fewer 1,000 GP bars than the conversion arithmetic
  predicts: 67 bars short across 499 packs. Dwarven Steel and Minotaur Hide ran
  well over prediction by about the same amount. The owner wants this tracked in
  2027. Nobody in the community tracks it, and the company has not said anything
  about it. Detail is in `data-model.md` § 2, *An open finding*.
- **The pack-substitute Ultra Rare rate.** The company states a 1-in-100 Ultra
  Rare rate for pack-substitute shipments. This is the only published rate in
  the game, so reproducing it checks the whole method. See `data-model.md` § 9.
- **Pack-substitute composition.** Nobody knows whether pack substitutes draw
  evenly from the eight Trade 1 goods, or from Trade 1 and Trade 2 together. A
  season of data should be enough to tell the two apart.

## Parked, not planned

- **Checking whether chase pieces are evenly distributed.** The company intends
  every piece in a chase set to be equally common, but that has never been
  checked. It cannot be tested while players record set counts rather than
  individual pieces, which the owner decided on 2026-09-23 to keep data entry
  simple. The schema still allows per-piece entries, so this could return
  without a redesign.
- **Importing past years' workbooks.** This is a long-term goal and out of scope
  for the 2027 version.
