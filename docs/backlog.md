# Backlog

This is the single list of open work for the project. Each item should make sense
without reading anything else, and points at the document that has the detail.
Items are removed when they are done, and git history keeps the record.

Last groomed **2026-09-24**.

---

## Up next, in dependency order

Nothing is being built until the owner says so. This is the order to build in
once they do.

1. **Seed the 2027 event list.** The events are published at
   truedungeon.com/2027-events-info (read 2026-09-24). Each one needs a name,
   a start date and a venue. **An in-person convention is one event however
   many games it runs**, because every game at a convention shares one
   treasure pool.
   - **Virtual:** Elders in the Dark (Jan 8), Dead Evil (Jan 23, Patron only),
     A Muse for Madness (Feb 19), Miskatonic Gauntlet (Mar 12), Eldritch Ward
     Asunder (Apr 9), Agony in Elder Ink (May 14), The Grimoire Gambit (Jun 25),
     Dark Archive (Sep 18, Patron only), and an End of Year Adventure (Dec 3,
     title to come). Patron-only events are ordinary virtual events for this
     purpose: players take standard or condensed treasure by preference.
   - **In person:** Gen Con (Aug 5), Gamehole Con (Oct 14). Origins is
     undecided for 2027.
   - **Mail:** "10x Pull redeemed by mail", the one synthetic event per year.

   The page spells two names inconsistently. It gives "Eldritch Ward Asunder"
   as the heading but "Eldritch World Asunder" in the ticket line, and "The
   Grimoire Gambit" as the heading but "The Grimoire Gauntlet" in the ticket
   line. Use the headings, and add the other spellings as aliases. The End of
   Year Adventure gets renamed in place once it has a title.

2. **Build the name-hygiene validator.** This is a check that catches two
   spellings of the same player, event or token, such as `Hacky` and `hacky`,
   before they become two records. It needs no user interface and no database,
   and it has real data to run against. Detail is in `inherited-practices.md`
   § 1 and in check V6 of `data-model.md` § 7.

3. **Add `package.json` and continuous integration.** At the moment the
   conversion check (`check_conversion.mjs`), the alias check
   (`check_aliases.mjs`) and the group check (`check_groups.mjs`) only run
   when a person remembers to run them. `stack.md`
   commits to running the `.mjs` validators automatically on every change. That
   automation is what turns the check from a convention into a gate.

4. **Design and build the entry form.** Every enterable token is either a
   **dedicated field** (Rare, Uncommon, the chase sets, Monster Trophy —
   labelled "Monster Trophy (Monster Bit)" — 10x
   Treasure Chips, Cloak or Gloves, the trade goods, the named Ultra Rare-or-better
   items) or **enterable from a searchable list, with no dedicated field**
   (Paragon, the 100,000 GP bar, anything unexpected). It must work
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

- **Origins 2027.** The company has not decided whether it will attend. Add
  it as an in-person event if it is announced.

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
