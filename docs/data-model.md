# Data model

Proposed 2026-09-18, **for review**. Every number below was measured from
`2024 Treasure Pull Records.xlsx` (openpyxl, 2026-09-18), not estimated. The
schema is SQLite, per `stack.md`.

Game facts come from the `td-domain` skill; treasure-recording facts from
`domain-context.md`; the validation posture from `inherited-practices.md`.

## The shape of the thing being stored

One fact: **a player received N of a token at an event.** Everything in the
legacy workbook is either that fact, a rollup of it, or a consequence of storing
it in a grid.

### Grain: one row per (event, player, token), non-zero only

The workbook's long mirror, `rawPersonalStats`, is a **dense** grid — every token
gets a row for every (player, event) pair whether or not it dropped:

| | rows |
|---|---|
| Total rows in `rawPersonalStats` | 11,948 |
| Rows whose quantity is **zero** | **8,758 (73%)** |
| Rows carrying an actual pull | **3,190 (27%)** |
| Distinct (player, event) pairs | 401 |

**Store the 3,190, not the 11,948.** A zero is the absence of a row, computed at
read time. `quantity INTEGER NOT NULL CHECK (quantity > 0)` makes this
structural rather than a convention, which matters because a zero row and a
missing row mean different things to a deduction ("nobody pulled one" vs "nobody
said") and the grid cannot tell them apart.

### There is no "high level vs detail" distinction to model

`rawPersonalStats` carries a `Type` column — `Normal` (1,732 rows) and `Special`
(10,216). Measured, it is not a property of the pull at all:

- `Normal` is exactly **four tokens**: `Rare`, `Uncommon`, `50 GP Idol`,
  `Monster Bits`.
- `Special` is the other **24**.

The four are the ones common enough to have earned their own summary column.
`Transposed for Pivot` carries the same split as `High Level` (55 rows) /
`Detailed` (261). **It encodes which part of the wide sheet a number came from,
and nothing else.**

And the totals reconcile exactly. Checked across `V26`, `V25`, `Gen Con` and
`Holiday Special 2` — 139 player rows:

- `Total Other` = the sum of the 24 detail columns. **0 rows differ.**
- `Total Pulls` = `Rare` + `Uncommon` + `50 GP Idol` + `Monster Bits` +
  `Total Other`. **0 rows differ.**

So there is no unitemised residue hiding in `Total Other` — no case of "I got 12
others but only listed 7". Both columns are derived, all 28 names are just
tokens, and the distinction disappears.

> This **supersedes** the closing line of `source-workbook-analysis.md`, which
> said both distinctions "need explicit modeling rather than a column
> convention". They need no modeling. They are presentation.

### Everything else in the workbook is also derived

`Total Pulls`, `Total Other`, `Idol %`, `MB %`, `Other %`, `Other ≥ UR %`, every
`Totals` and `Percentages` row, every `<Event> Summary` tab, `Full Year Summary`,
`Full Year by Event`, `Personal totals`, `Transposed for Pivot`. None of it is
stored. `domain-context.md` already settles the analysis buckets as a display
layer; this is the same rule applied to the arithmetic.

## Tables

### `player`

```sql
CREATE TABLE player (
  player_id    INTEGER PRIMARY KEY,
  display_name TEXT    NOT NULL,          -- as the person spells it
  fold_key     TEXT    NOT NULL UNIQUE,   -- soft fold; the uniqueness lives here
  is_group     INTEGER NOT NULL DEFAULT 0,
  first_seen   TEXT    NOT NULL
);
```

**`fold_key UNIQUE` is the whole point of this table.** The 2024 workbook holds
**89 distinct player names that are 84 people**, with five pairs differing only
in case:

```
Hacky / hacky      Enginerd / enginerd      Lequinian / lequinian
BIll / Bill        Gentlegiant303 / gentlegiant303
```

Every one is `inherited-practices.md` § 1 at ERROR severity — a typo by
construction. `BIll` is a capital-I slip. Under the hard fold there are **zero**
further collisions, so the case fold catches all of them and nothing is left to
arbitrate.

This is exactly what `domain-context.md`'s "pick your name from a list" is for.
The list is `player`; the fold key is what stops the list growing a second entry
for the same person on a phone keyboard.

Names in this data are a mix of real names, forum handles, and both
(`Christopher (cfabruscato)`, `Andrew Van Wyk (Yerardet)`). That is fine — the
display name is opaque. But see *Open question 2* about `Jeremy (Razor) & Team`.

### `event`

```sql
CREATE TABLE event (
  event_id   INTEGER PRIMARY KEY,
  event_year INTEGER NOT NULL,   -- calendar year, Jan-Dec
  name       TEXT    NOT NULL,   -- 'V26', 'Gen Con', 'Holiday Special 2'
  kind       TEXT    NOT NULL CHECK (kind IN ('convention','virtual','special')),
  fold_key   TEXT    NOT NULL,
  UNIQUE (event_year, fold_key)
);
```

**`name` is opaque and is never parsed.** `V26` is the 26th virtual event; the
2024 workbook contains `V20`–`V26`. The year comes from `event_year` and from
nowhere else. This is the sharpest collision with the auction project's
vocabulary and it deserves a `CHECK`-level refusal to be clever.

The 2024 event vocabulary, with its pull-row counts:

```
V20 1773 · V21 2727 · V22 1512 · V23 1512 · V24 1372 · V26 1148
Origins 112 · Gen Con 448 · Gamehole Con 364 · Holiday Special 2 980
```

`V25` is absent — the workbook's documented defect, 5,081 pulls never
transposed. **The new model cannot reproduce that defect**, because there is no
second representation to fall out of sync: the rollups are queries.

### `token`

```sql
CREATE TABLE token (
  token_id       INTEGER PRIMARY KEY,
  name           TEXT    NOT NULL UNIQUE,  -- canonical spelling
  fold_key       TEXT    NOT NULL,
  kind           TEXT    NOT NULL CHECK (kind IN
                   ('specific','tier','chase_piece','trade_good','modifier')),
  rarity         TEXT,        -- rung of the canonical ladder, or NULL
  token_year     INTEGER,     -- the token's OWN vintage, or NULL if not year-specific
  trade_rung     INTEGER CHECK (trade_rung BETWEEN 1 AND 5),
  chase_set_size INTEGER      -- 6, 20 or 40; NULL otherwise
);
```

Four things this has to express that a single name column cannot:

**1 — `token_year` is not the event year.** A Monster Trophy pulled at a 2026
event *is* a 2026 trophy, and the auction project's recipes ask for the previous
year's (`ItemYear=-1`, all 36 lines). The vintage is usually the event year, but
it is recorded, never inferred — the 50 GP Idol is a 2024 token whose auction
augments are 2025 rows.

**2 — `kind='tier'` is a real category.** Six of the 28 pulled names are rungs of
the ladder rather than named tokens: `Legendary`, `Ultra Rare`,
`Exalted (4 point)`, `Enhanced (3 point)`, `Previous Relic`, and the unpulled
`Older Legendary` / `Older Relic`. The player recorded *what tier dropped*, not
which token. That is legitimate data, not sloppiness, and the skill confirms
`Ultra Rare` is canonically both a tier and a token name. A deduction that treats
these as named tokens will double-count against the specific ones.

**3 — `trade_rung` goes past 2.** The 2024 pulls contain `Trade 1`, `Trade 2`,
`1,000 GP Bar`, `5,000 GP Bar` (Trade 3), `25,000 GP Bar` (Trade 4),
`Golden Fleece` (Trade 3) and `Wish Ring` (Trade 4). The skill's warning that
"treasure tooling must accept Trade 3-5 regardless of what auction-side artifacts
show" is confirmed by the file.

**4 — Season-relative names are resolved, never stored as phrases.**
`Previous Relic` is live in the 2024 data. At entry it resolves against
`event_year` to a concrete `token_year`; the phrase does not survive into the
row.

### `token_alias`

```sql
CREATE TABLE token_alias (
  alias    TEXT PRIMARY KEY,
  token_id INTEGER NOT NULL REFERENCES token(token_id),
  source   TEXT NOT NULL,   -- '2024 workbook', 'auction main', ...
  note     TEXT
);
```

**This table exists so the legacy spellings can be imported without entering the
vocabulary.** `tokenCategories` holds 36 names, of which 28 were ever pulled and
**8 never were** — and that residue is where the damage lives:

| Alias | What it is |
|---|---|
| `Sprit Pet` | typo for Spirit Pet |
| `Silver Ship ?????` | the maintainer did not know the name |
| `Stalker Tokens` | plural; upstream canonical is `Stalker Token (20 unique)` |
| `Total Other` | **not a token at all** — a computed column in the token table |
| `Older Legendary`, `Older Relic` | season-relative, resolve to a year |
| `Arcanum Shirt`, `Skull of Batterak` | genuine tokens, no 2024 pulls |

And one that is not in that list because it *was* pulled: the workbook calls
Monster Trophy **`Monster Bits`**, and `tokenCategories` maps it to the
misspelled bucket **`Monter Bit`**, which propagates into 11 rows of
`Transposed for Pivot`. A typo in reference data became a typo in derived data.

### What the name check will and will not catch

Run over the whole 2024 token vocabulary — 36 spellings across four tables —
using § 1's folds:

- **Soft-fold (case/whitespace) collisions: 0**
- **Hard-fold (punctuation/plural) collisions: 0**

That is a clean result and it is also the warning. Two live hazards pass it:

- **`Trade 2 ` carries a trailing space** in both `tokenCategories` and the event
  sheet headers. It collides with nothing *because the bare spelling appears
  nowhere* — the workbook is consistently wrong. The first person to type
  `Trade 2` creates the split. (`Total \nPulls` has an embedded newline for the
  same reason.)
- **`Silver Ship ?????` and `Silver Ship Outpost Nil` are almost certainly one
  token**, and no fold can see it — they differ by far more than case,
  whitespace, punctuation or a plural. This is the same blind spot that let
  `Stalker Token` sit beside `Stalker Token (20 unique)` upstream, and it is
  blind **by design**, because the rule that would catch it also merges
  `+1 Turkey Leg` into `+1 Turkey Leg of Smiting`.

**So the check is necessary and not sufficient**, and the doc should say so where
someone will read it before trusting a green run.

### `submission` and `pull`

```sql
CREATE TABLE submission (
  submission_id INTEGER PRIMARY KEY,
  event_id      INTEGER NOT NULL REFERENCES event(event_id),
  player_id     INTEGER NOT NULL REFERENCES player(player_id),
  submitted_at  TEXT    NOT NULL,
  submitted_as  TEXT    NOT NULL,   -- the name as picked/typed, before folding
  form_version  TEXT    NOT NULL,
  condensed     INTEGER NOT NULL,   -- which entry branch was taken
  revoked_at    TEXT               -- set by an admin; never deleted
);

CREATE TABLE pull (
  pull_id       INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submission(submission_id),
  event_id      INTEGER NOT NULL REFERENCES event(event_id),
  player_id     INTEGER NOT NULL REFERENCES player(player_id),
  token_id      INTEGER NOT NULL REFERENCES token(token_id),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  token_year    INTEGER,            -- resolved vintage for this pull
  supersedes    INTEGER REFERENCES pull(pull_id),
  source        TEXT    NOT NULL,   -- 'player' | 'maintainer' | '2024 workbook'
  agreement     TEXT,               -- see below
  note          TEXT
);
```

`source` / `agreement` / `note` are `inherited-practices.md` § 4, copied from
`order-composition.csv`. `agreement` carries strings of the shape
`CONFIRMED by 18 of 19` or `REPORTERS DISAGREE — 1 of 3 say 8, not 7`, so a
disagreement is **surfaced and left open** rather than resolved by whoever
submitted last. § 7 is the resolution rule when one is needed: quantity-weighted
mode, and **ties are flagged, never broken** — the recorded corpus splits 8 low,
5 high, 1 midpoint, so "ties go low" is not settled and a float comparison
picking one silently is a bug.

**Append-only.** A correction inserts a row pointing at the one it replaces
through `supersedes`; nothing is ever `UPDATE`d or `DELETE`d. This is what
`stack.md` commits to now that the write endpoint is public and unauthenticated,
and § 4's provenance columns make it nearly free.

**There is deliberately no `UNIQUE (event_id, player_id, token_id)`**, because
append-only and a uniqueness constraint fight each other — every correction would
violate it. Uniqueness over *live* (non-superseded) rows is enforced in the
Function and re-checked by the validator over the export, per § 3: *validate
where the data lands.*

That check has a concrete defect to prevent. The 2024 long mirror contains
**1,095 duplicate (token, player, event) keys**, and 41 (player, event) pairs
carry roughly double the expected row count. The wide sheets are clean — `V26`
has 41 player rows and 41 distinct names, `Gen Con` 16 and 16 — so the wide sheet
has **nowhere to put a second run**, and the doubling appeared in the transpose.
Either the transpose ran twice for those pairs or a real second run was recorded
somewhere the grid cannot express. **The file does not say which**, which is
itself the argument for the constraint. See *Open question 3*.

## Condensed — provisional, and the one part awaiting data

`domain-context.md` settles that Condensed is modeled from day one and is the
**first branch point at entry**: the player picks it, and the rest of the form
changes. It is a 2026 option and **does not appear in the 2024 workbook at all**.

The `submission.condensed` flag above is the branch. What is *not* settled is the
row shape on the condensed side, and I am not going to invent it:

- A condensed pull yields trade goods instead of Rare/Uncommon. Those goods are
  ordinary `token` rows with a `trade_rung`, so the `pull` table needs no new
  columns — **probably**.
- What is unknown is whether players record **only** the goods, or the goods
  *and* the Rare/Uncommon count they were converted from. `domain-context.md`
  says "the two representations must reconcile for deduction to work", which
  reads as needing both, and the conversion rate is the thing being deduced.
- The skill says condensing uses "the expected yield of a perfectly random
  distribution rather than opening anything" — so the rate may be a published
  constant per event rather than per player, which would make it a property of
  `event`, not of `pull`.

**One measured clue, and it is a strong one.** Row 1 of every 2024 event sheet
reads:

> "Got bonus trade goods with your loot? Help track the trade good rate on the
> **Trade Good Distribution sheet**!"

**There is no Trade Good Distribution sheet in the 2024 workbook.** All 28 tab
names were enumerated; it is not among them. The warning points at a sheet that
does not exist in the file — which means it exists in a *later* one, and it is
about exactly this.

## Open questions — please correct

1. **`10x Pull`, `3x Pull`, `10x Trade` are in the token vocabulary but look like
   multipliers, not tokens.** Does a `10x Pull` row mean "this player received a
   token granting ten pulls" (a real drop, `kind='modifier'`), or is it a
   bookkeeping entry meaning the ten pulls listed elsewhere came from one event?
   If the latter, counting them into `Total Pulls` double-counts — and the
   workbook does count them, since `Total Other` reconciles exactly.

2. **`Jeremy (Razor) & Team` is a player row.** `Jeremy (Razor)` also appears
   separately at Gen Con. Is a team entry one reporter covering several people's
   loot? If so, its pulls are not comparable per-player, and `is_group` needs to
   exclude them from per-player rates. Or should the form refuse team entries?

3. **Can one player play the same event twice?** A second Gen Con run is
   physically ordinary, the wide sheet cannot express it, and the long mirror has
   41 doubled pairs. If yes, the grain is (event, player, **run**) and
   `submission` already carries it. If no, the doubling is a transpose bug and
   the uniqueness check is unconditional.

4. **Is `Silver Ship ?????` the same token as `Silver Ship Outpost Nil`?** No
   automated check can decide this.

5. **Does 2024 history get imported at all**, or does the site start clean at the
   next event? This decides whether `token_alias` matters on day one or is
   scaffolding for later. Importing means inheriting a missing V25, 1,095
   duplicate keys and five split player identities — all fixable, none free.

6. **Condensed**, per the section above.
