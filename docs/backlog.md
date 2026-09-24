# Backlog

This is the single list of open work for the project. Each item should make sense
without reading anything else, and points at the document that has the detail.
Items are removed when they are done, and git history keeps the record.

Last groomed **2026-09-24**.

---

## Up next, in dependency order

Nothing is being built until the owner says so. This is the order to build in
once they do.

1. **Add `package.json` and continuous integration.** At the moment the
   six checks in `scripts/` only run when a person remembers to run them:
   `check_conversion.mjs`, `check_aliases.mjs`, `check_groups.mjs`,
   `check_events.mjs`, `check_names.mjs` and `check_form_boxes.mjs`. `stack.md`
   commits to running the `.mjs` validators automatically on every change. That
   automation is what turns the check from a convention into a gate.

2. **Design and build the entry form.** Each section opens with **a short
   list of count boxes that differs by section**, chosen by how often 2026
   submissions under that treatment listed each item (owner, 2026-09-24):

   - **Standard (6):** Rare, Uncommon, Monster Trophy (labelled "Monster Trophy
     (Monster Bit)"), the two chase sets, and the treasure-chest-only Rare.
   - **Condensed packs (16):** Monster Trophy, the two chase sets, the
     treasure-chest-only Rare, and all of Trade 1 and Trade 2 including the
     1,000 GP bar, laid out as a compact two-column grid labelled with the
     trade-good codes (AI, AP, DP…).
   - **Pack substitutes (8):** the Trade 1 goods. This one is the owner's
     hypothesis, because 2026 recorded no pack substitutes to measure.

   The lists are data, in `data/seed/form_box.csv`, not code. Everything else,
   including the 10x Treasure Chip (1 of 188 submissions in 2026) and every
   named Ultra Rare-or-better item, is **entered from an "add another item"
   search**. When the search opens, before anything is typed, it suggests that
   section's next most common items as one tap each. Several of those are
   rarities rather than tokens (Ultra Rare, Enhanced, Exalted, a previous-year
   Relic), so how a rarity suggestion leads to a named token is still to design.
   The measurements and the reasoning are in `data-model.md` § 4, *Which count
   boxes each section shows*. Every box is a count: players sort their loot
   into stacks and type how many are in each.
   The search leaves out anything that already has a count box, meaning
   standard-set tokens and the members of Monster Trophy and Cloak or Gloves,
   so typing "shirt" doesn't list five standard-set shirts. It must work
   well on a phone. It must never use the phrase "total pulls" (see
   `data-model.md` § 3). There is no team field and no seat-count field.

   **One submission covers everything from one event, across all three
   treatments.** A player may have a few condensed packs from runs where they
   hit max treasure, standard treasure from their other runs, and pack
   substitutes on top. They enter all of it in one go, and each item records
   which treatment it came from. *Layout decided by the owner on 2026-09-24:*
   the form asks "What did you get?" with three tick-boxes (Standard, Condensed
   packs, Pack substitutes), **all ticked by default**, and shows a section for
   each ticked box. Unticking a box hides that section. **At an in-person event,
   and at the "10x Pull redeemed by mail" event, only Standard treasure exists,
   so the tick-boxes are not shown at all.** The player just sees the Standard
   section. Which sections an event offers comes from its venue (virtual, in
   person or mail), which is data, so if the company changes the rule it is a
   one-row edit. Detail is in `data-model.md` § 4, *`event_year` and the
   mixes*.

   **No check may stop a submission.** The form requires an event, the
   reporter's name and at least one item, and nothing else. Each item's
   treatment comes from the section it was entered in. Only one check is ever
   shown to the player, as a one-line hint they can dismiss: condensed treasure
   not coming to a multiple of 10. The Standard section also carries a line of
   help text: items from redeeming a 10x Treasure Chip belong there, even if the
   chip came from a condensed pack. The chip itself is an ordinary item,
   entered wherever it was received; its ten pulls come later and are entered
   under the event where it was redeemed, or under "10x Pull redeemed by mail".
   The form also reminds players not to include the free Participation token
   every virtual player receives. It comes packaged separately from the
   treasure, and each one entered would count as a false Rare or Uncommon. A name
   that differs from an existing one only in capital letters or spacing is
   quietly replaced with the existing spelling. Everything else is flagged for
   maintainers and is invisible to the player. Detail is in `data-model.md` § 7.

## Waiting on outside events

- **Origins 2027.** The company has not decided whether it will attend. If it
  is announced, add it to `data/seed/event.csv` as an in-person event.
- **Rename the End of Year Adventure** in `data/seed/event.csv` once the
  company announces its title (the event is December 3–5, 2027). Rename the
  row in place.

- **Re-fetch the 2027 token catalog after January 2027.** 2027's chase sets and
  treasure-only Rares are not published until then, so
  `data/seed/token_catalog_2027.csv` is missing them. Run
  `node scripts/fetch_catalog.mjs 2027` and then re-run the checks. The
  Monster Trophy group picks up 2027's trophies from the re-fetch by itself. For any
  *new* year (2028 onward), first add that year's three rows to
  `data/seed/bonus_tier.csv`: the 1k, 2k and 8k Bonus tokens, taken from the
  auction site's display names. Without them the 2k Bonus token is labelled an
  ordinary Ultra Rare instead of Premium.
- **Rename the Mystery chase set placeholders once the 2027 sets are revealed.**
  Rename each one in place and keep the old name as an alias, so entries made
  before the reveal stay attached to the right set. If 2027 does not have exactly
  one 40-piece set and one 20-piece set, add or resize the placeholders.
- **Rename the Mystery Treasure Chest Rare placeholder once 2027's
  treasure-chest-only Rares are revealed.** It stands in for whatever succeeds
  2026's Cloak or Gloves of the Order. Rename it in place in
  `data/seed/token_group.csv` and keep the old name as an alias. Then switch
  its `members` from `none` to `listed` and add the revealed tokens to
  `token_group_member.csv`, so the search leaves them out, as it does Cloak and
  Gloves.
- **Re-derive the 2028 count boxes from 2027's submissions** before the 2028
  season opens. Measure the share of submissions that list each item, per
  treatment, the way `data-model.md` § 4 did for 2026. Put pack substitutes on
  measured ground for the first time, and add the 2028 rows to
  `data/seed/form_box.csv`.

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
