# Domain context — treasure pulls

Treasure-specific domain knowledge. **General True Dungeon facts are in the
`td-domain` skill** (`~/.claude/skills/td-domain/`) — tokens, the canonical
rarity ladder, transmute tiers, trade goods and abbreviations, chase tokens,
season vs event year. Read that first; this document covers only what is
specific to recording loot drops.

## What treasure pulls are

Players receive tokens as loot from playing the game. The **mix of a given
year's treasure is not published**, so the community deduces it by pooling
recorded pulls across many players and many events.

Some tokens enter circulation *only* through treasure — Monster Trophies, and
chase tokens such as the **50 GP Idol**. That is a statement about the acquisition
channel: individual pieces still change hands inside a group buy as auction
augments (see *Chase tokens* below), but none is ever sold as part of the order.

### Chase tokens

**Chase** has a specific meaning: tokens that enter circulation only through
treasure, forming a **numbered set** with named variants. A *complete* set is
consumed by a special transmute. Unrelated to **Onyx**, an auction-side order type
that swaps Ultra Rares for alternate-color (black/onyx) versions.

**Do not encode "1 of 20 or 1 of 40"** — that was the rule until the 6-piece
Relic Recipe Fragment turned up. Set size is data, and three values are attested.

**Six sets.** Measured 2026-09-18 from the auction project's shipped CSVs —
`tokenMetadata.csv` (`Category = Treasure Chest`), `offAuctionPrices.csv` and
`transmuteRecipes.csv`, all three agreeing. `Treasure Chest` holds seven distinct
tokens: these six sets plus Monster Trophy, which is not a set.

| Set | Size | Token year | Consumed by | Level | Name in the data |
|---|---|---|---|---|---|
| Relic Recipe Fragment | 6 | 2019 | Orion's Belt | Relic | `Relic Recipe Fragment (6 unique)` |
| Stalker Token | 20 | 2023 | Stalker Bead of Skill / Focus | Relic | `Stalker Token (20 unique)` |
| 50 GP Idol | 40 | 2024 | Totem of Wonder | Legendary | `50 GP Idol (40 unique)` |
| 50 GP Rune | 40 | 2025 | Rune Giant Totem | Legendary | `50 GP Rune (40 unique)` |
| Herald Token | 20 | 2026 | Herald's Ring of Wrath / Focus | Relic | `Herald Token (20 unique)` |
| Golem Piece | 40 | 2026 | Gear Golem Totem | Legendary | `Golem Piece (40 unique)` |

All six are on the auction project's `main` as of 2026-09-18, and all six spell the
parenthetical the same way. That was **not** true earlier the same day — see
*Set naming* below for what changed and why the older shape may still show up in
anything written before then.

**The 50 GP Idol is fully modeled now** — resolved 2026-09-04 (auction PRs
#180/#181/#182) and live. It is a **40**-piece set forging the 2024 Legendary
`Totem of Wonder`, priced off-auction at 15 / 10 / 5. This document previously
called it un-modeled and gave no set size; both are out of date.

**Relic Recipe Fragment is the fifth set, and this table used to miss it.** Six
pieces, 2019, consumed by `Orion's Belt`. It is the oldest of them and the only
one with a set size that is neither 20 nor 40, so a schema that assumes "1 of 20
or 1 of 40" is already wrong.

**50 GP Rune is the sixth, added 2026-09-18** (auction PR #201). 2025, 40 pieces,
forging the 2025 Legendary `Rune Giant Totem`, priced off-auction at 15 / 10 /
7.5.

It was still on an unmerged branch when this section was first written a few hours
earlier, which is worth remembering as a habit rather than as history: **the
auction repo is shared and moves under you.** Anything read out of it is a fact
about one branch at one moment. Re-check a set before relying on it:

```
git -C C:\claude\site show origin/main:public/data/tokenMetadata.csv | findstr "unique"
```

### "Treasure-only" is a claim about the CHANNEL, not about auctions

Chase tokens are not *acquired* through a group buy — but individual pieces do
change hands inside one, as auction **augments**, and the auction project records
them. Two measured cases:

- Seven `50GP Idol: <variant>` rows in `contextItems.csv` — Goose, Lion, Locust
  (×2), Meerkat, Ram, Tortoise — all season 2025, $20 each.
- One `Set of Relic Recipe Fragments` row, auction 20216, sold **complete** as a
  single lot for $60.

So "never auctioned" is the wrong phrasing to carry into this project's model or
UI. What is true is that no chase piece has a **price-spine** row: the auction
project's `PriceIndex` is built from `prices.csv` alone, and none of these is in
it. They are priced off-auction or not at all.

**A token's year is not the season it turned up in.** The Idol is a **2024**
token whose auction augments are season **2025** rows. Keep the pull's event year
and the token's own vintage as separate fields from the start.

### Set naming — settled 2026-09-18, and worth knowing why it needed settling

Until that date `main` held **three different shapes for the same idea**:
`Golem Piece (40 Unique)` and `Herald Token (20 Unique)` capitalised,
`Relic Recipe Fragment (6 unique)` lower-case, and a bare `Stalker Token` with no
parenthetical at all. PR #201 normalised all six to lower-case `(N unique)` and
gave Stalker its missing one, which is the shape in the table above.

**The reason it survived that long is the lesson.** The auction project's § 8 name
check compares spellings that differ only by case, whitespace, punctuation or a
trailing plural. `Stalker Token` and `Stalker Token (20 unique)` differ by far more
than that, so the check was blind to it — and it was blind by design, because the
alternative rule would merge `+1 Turkey Leg` into `+1 Turkey Leg of Smiting`.

**A naming convention applied by hand across six rows is not enforced by
anything.** That is the case for deciding the shape here before entry starts, not
after. See `inherited-practices.md` § 1.

**Pick one shape here before entry starts** rather than inheriting the spread. The
parenthetical states the *set's* size, the row describes **one** piece, and the
recipe carries the count separately — so `Quantity=40` beside a name saying
`(40 unique)` is correct and is not a double count.

### This data has a downstream consumer

Recording pulls is not only for deduction. Treasure-sourced tokens are
**ingredients in auction-site recipes** — measured 2026-09-18 on `main` at
`f865055`, **47 recipe lines across 46 distinct transmutes, spanning 2017-2027**,
consume a Monster Trophy or a chase piece. Monster Trophy alone is 39 of those
lines; the six chase sets supply the other 8. None
carries a price-spine row, so all of them resolve off-auction or derived. Pull
data is evidence about scarcity that the auction project's build calculator
ultimately rests on.

### Monster Trophy has a VINTAGE, and this project is upstream of it

Settled on the auction side 2026-09-01 (DATA-2, PR #159): a Monster Trophy is
dated, and **a recipe wants the previous year's** — `ItemYear=-1` on all 36 lines
that ask for one. A 2027 recipe needs a 2026 trophy.

Two consequences here, and they are the sharpest reason this project's data
matters outside itself:

- **A trophy pulled at a 2026 event *is* a 2026 trophy.** The event year on a
  pull is the vintage. Record it as a first-class field; never infer it from when
  the row was entered.
- **Monster Trophy is the only treasure token authored per season.** Every chase
  set carries exactly **one** off-auction row for the whole set, whatever season
  it appears in — the engine floats to the nearest priced season for those. So a
  per-year shape is right for trophies and wrong for chase pieces.

`offAuctionPrices.csv` currently prices trophies for 2019-2026 only, while
`tokenMetadata.csv` carries them 2012-2027. The 2027 row was deleted deliberately
as a projection rather than a sale — nobody holds one yet.

## Time: events, not seasons

Loot drops follow the **calendar year**, not the set buying window that governs
auctions. Tracking is **per event**, with events running January through
December — not every month, but close to it.

Event kinds seen in the 2024 records:

- **Named conventions** — Gen Con, Origins, Gamehole Con
- **Virtual runs** — `V20` … `V26`, numbered sequentially
- **Specials** — Holiday Special 2

**`V26` is the 26th virtual event, not the 2026 season.** The 2024 workbook
contains V20–V26. A V-number must never be read as a year — this is the sharpest
collision with the auction project's vocabulary.

## Categories: three axes, only one of them canonical

Covered in full in the skill; repeated here because it is the likeliest thing to
get wrong when borrowing from the auction site.

| Axis | Canonical? | Whose |
|---|---|---|
| Rarity / tier | **Yes** | Shared (skill) |
| Auction sale category — Trade 1, Premium, Bonus, Preorder… | No | Auction project only |
| Pull analysis buckets — "Ultra Rare or Better", "Under Ultra Rare" | No | **This project** |

The analysis buckets are a **community convention inherited from the previous
maintainer of the sheet**, not game data.

**Settled:** they are a **display layer only**. Store canonical rarity on every
pull and compute "Ultra Rare or Better" / "Under Ultra Rare" at render time as a
user preference. Never persist a bucket as a token's rarity, and never let one
into the data model.

**Do not import the auction site's `categories.ts`.** Its list describes how a lot
was *sold* in a group buy. That axis has no meaning for a loot drop.

## The Rare / Uncommon conversion

Rare and Uncommon tokens transmute into Trade 1 / Trade 2 trade goods. The
conversion is tedious, so players prefer to receive goods pre-converted — the
reason Super Condensed and Ultra Condensed auctions exist.

**New in 2026: a "Condensed" option for Rare and Uncommon treasure**, converting
drops to trade goods at source. Not present in the 2024 sample workbook.

**Settled: model this from day one.** Condensed vs non-condensed is a **key
decision point at entry** — the player picks it first and the rest of the form
changes accordingly. A pull is therefore recorded either as Rare/Uncommon counts
or as converted trade goods, and the two representations must reconcile for
deduction to work. A sample of condensed treasure data is still to come.

## Naming

The legacy data uses **display names, not canonical names**, for several rarity
levels — Legendary, Relic, 1k bonus, 2k bonus and others.

Two patterns to normalize on entry:

- **Season-relative names** — "Older Legendary", "Previous Relic", "Older Relic".
  These encode *which season's* token is meant, relative to the event. The
  auction project hit the same problem and solved it with an explicit relative-year
  column resolved to a concrete year; do the same rather than storing the phrase.
- **Inline point values** — "Enhanced (3 point)", "Exalted (4 point)".

## Identity

**No full login.** The community is small, malicious behavior is uncommon and
handled socially, so account infrastructure would cost more than it protects.

Target the simplest thing that works: a one-time identity entry, then **pick your
name from a list** on subsequent visits. Names must still be stable enough to
join a player's pulls across events within a year — the legacy workbook's
free-text names in `Personal totals` and `rawPersonalStats` are what this
replaces.

## Open questions

1. *(settled — the full combined ladder is in the `td-domain` skill,
   `references/rarity-and-tiers.md`. Note that trade goods run Trade 1-5 and
   treasure may contain levels above Trade 2, which auction data never sees.)*
2. *(settled — buckets are a display layer; see Categories above)*
3. *(settled — see Identity below)*
