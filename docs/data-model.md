# Data model

Proposed 2026-09-18, **for review**. Measured (openpyxl, 2026-09-18) from all
three workbooks — `2024`, `2025` and `2026 Treasure Pull Records.xlsx`. Every
number below was counted, not estimated. The schema is SQLite, per `stack.md`.

Game facts come from the `td-domain` skill; treasure-recording facts from
`domain-context.md`; the validation posture from `inherited-practices.md`.

## The shape of the thing being stored

One fact: **a player received N of a token at an event, under one treatment.**
Everything in the three workbooks is that fact, a rollup of it, or a consequence
of storing it in a grid.

"Treatment" is the new part, and it is the 2026 change. See *Condensed* below.

### The workbooks are not one format — they are three

| | 2024 | 2025 | 2026 |
|---|---|---|---|
| Event sheets | 11 | 12 | 6 |
| Columns per event sheet | 50 | 34 | **53** |
| Event naming | `V20`–`V26` only | V-numbers **and** named adventures | named adventures only |
| Condensed column | — | — | **`Condensed (Y/N)`** |
| Trade goods | `Trade 1` / `Trade 2` totals | same | **11 goods itemised** |
| `rawPersonalStats` | 11,948 rows | **`#REF!`** | **`#REF!`** |

**The per-person long format died after 2024.** In both later workbooks
`rawPersonalStats` contains nothing but `#REF!`. The only surviving long format
is `Transposed for Pivot`, which has no person dimension at all — so **2025 and
2026 have no per-player analysis data**, only per-event totals. Whatever the new
site does, it cannot be worse than this, and it must not reintroduce a
hand-maintained second representation.

### Grain: one row per (submission, token), non-zero only

A *submission* is one player's loot from one event under one treatment. Pull rows
hang off it.

The 2024 long mirror is **dense** — every token gets a row for every
(player, event) pair whether or not it dropped:

| | rows |
|---|---|
| Total rows in `rawPersonalStats` (2024) | 11,948 |
| Rows whose quantity is **zero** | **8,758 (73%)** |
| Rows carrying an actual pull | **3,190 (27%)** |

**Store the 3,190, not the 11,948.** `quantity INTEGER NOT NULL CHECK
(quantity > 0)` makes this structural, which matters because a zero row and a
missing row mean different things to a deduction ("nobody pulled one" vs "nobody
said") and the grid cannot tell them apart.

### Everything the workbooks compute stays computed

2026 has a **three-level** rollup, and all of it reconciles from the itemised
columns. Measured across 188 player rows in all six 2026 events:

| Rollup | Composition | Rows that disagree |
|---|---|---|
| `Total Pulls` | Rare + Uncommon + Golem Chaser + Herald's Chaser + Monster Bit + Total Other | **0 of 188** |
| `Total Other` | the 28 detail columns, trade goods entering as the two Trade totals | **0 of 188** |
| `Total Trade 1` | the 8 Trade 1 goods | 1 of 188 |
| `Total Trade 2` | the 3 Trade 2 goods | 2 of 188 |

The same held in 2024 (`Total Other` and `Total Pulls`, 0 of 139 rows across four
sheets). **Store the leaves; compute every total, percentage and summary tab.**

> Note that `Total Trade 2` sums **three** goods — Aragonite, Elven Bismuth, Oil
> of Enchantment — and excludes `1,000 GP Bar`, which the skill lists as a Trade 2
> good and which has its own column. The sheet's "Trade 2" is a **layout
> grouping, not the canonical rung**. One more reason a rollup is never stored.

### There is no "high level vs detail" distinction to model

2024's `rawPersonalStats` carries a `Type` column — `Normal` (1,732 rows) and
`Special` (10,216). Measured, `Normal` is exactly four tokens (`Rare`,
`Uncommon`, `50 GP Idol`, `Monster Bits`) and `Special` is the other 24. It
records which part of the wide sheet a number came from and nothing else, and
since the totals reconcile exactly there is no unitemised residue hiding in
`Total Other`.

> This **supersedes** the closing line of `source-workbook-analysis.md`, which
> said both distinctions "need explicit modeling rather than a column
> convention". They need no modeling. They are presentation.

## Condensed

Settled by the 2026 workbook. **Condensed is a property of a submission, not of a
pull and not of a player.**

Column B of every 2026 event sheet is `Condensed (Y/N)`, and column A of the
header block instructs:

> "Please add separate lines for split treasure — "Y" or "N" as appropriate for
> Condensed"

That instruction is followed. Measured across the four 2026 events that have
both treatments, **every** repeated player name is exactly one `Y` row and one
`N` row:

| Event | player rows | distinct players | repeated | pattern |
|---|---|---|---|---|
| Tower of Blood (Jan) | 55 | 45 | 10 | 10 × (N, Y) |
| Mists of Madness (Feb) | 43 | 36 | 7 | 7 × (N, Y) |
| Order of the Dawn (Mar) | 45 | 35 | 10 | 9 × (N, Y), **1 × (Y, Y)** |
| Through Fear and Fog (Aug) | 30 | 24 | 6 | 6 × (N, Y) |

So `submission` carries `condensed`, a player may have two submissions per event,
and the one `(Y, Y)` pair is either a second condensed run or a duplicate — the
file cannot say which, which is the argument for recording runs explicitly.

### What condensed contains — and the column that cannot say it

Per the project owner: condensed treasure **excludes standard-pack Rare and
Uncommon tokens**, which the company pre-converts into the equivalent trade
goods. It may still contain treasure-box-only Rares, chase tokens, trade goods,
Monster Trophies and higher rarities.

The data agrees, and then shows exactly where the grid breaks:

| 2026 event | non-condensed Rare / Unc | condensed Rare / Unc |
|---|---|---|
| Tower of Blood (Jan) | 477 / 448 | **29 / 4** |
| Mists of Madness (Feb) | 306 / 287 | 1 / 0 |
| Order of the Dawn (Mar) | 363 / 306 | 0 / 0 |
| Through Fear and Fog (Aug) | 218 / 169 | 0 / 0 |

Condensed Rare is near-zero, as it must be — but it is **not** always zero, and
that residue is the treasure-box-only Rares.

**The workbook hides them.** Reconciling Tower of Blood's own `Condensed Total`
row against the player rows it summarises, exactly two columns disagree:

```
column                     C-total    sum(Y)
Total Pulls                   1574      1574
Rare                             0        29   <-- MISMATCH
Uncommon                         0         4   <-- MISMATCH
Golem Chaser (set of 40)       215       215
Monster Bit                    382       382
Total Other                    732       732
```

The `Condensed Total` row **hard-zeroes Rare and Uncommon** because condensed
treasure "cannot" contain them. Its own components therefore sum to 1,541 against
its own `Total Pulls` of 1,574 — **33 pulls that exist in the player rows and
appear in no breakdown.** And because `Transposed for Pivot` reads that row, they
leave the year's analysis entirely.

**This is the single strongest argument in the data for a schema change**, and it
is not a spreadsheet bug so much as a column that cannot express the truth:
`Rare` is one column standing for two different populations.

### So `Rare` is not one token

```sql
-- on token
pool TEXT NOT NULL CHECK (pool IN ('pack','treasure_box','either'))
```

`pool='pack'` marks the standard blind-pack Rare and Uncommon — the ones a
condensed submission has had converted away. The invariant is then checkable
rather than assumed:

> **A condensed submission contains no `pool='pack'` token.**

A violation is reported, not silently zeroed. Per `inherited-practices.md` § 5 it
is a NOTE naming the remedy — *this looks like a treasure-box Rare recorded in
the generic Rare column* — because a thing you cannot check is unverified, never
incorrect. See *Open question 1*.

## Tables

### `player`

```sql
CREATE TABLE player (
  player_id    INTEGER PRIMARY KEY,
  display_name TEXT    NOT NULL,          -- as the person spells it
  fold_key     TEXT    NOT NULL UNIQUE,   -- soft fold; uniqueness lives here
  is_group     INTEGER NOT NULL DEFAULT 0,
  first_seen   TEXT    NOT NULL
);
```

**`fold_key UNIQUE` is the whole point of this table.** 2024 holds **89 distinct
player names that are 84 people**, with five pairs differing only in case:

```
Hacky / hacky      Enginerd / enginerd      Lequinian / lequinian
BIll / Bill        Gentlegiant303 / gentlegiant303
```

Each is § 1 at ERROR severity — a typo by construction; `BIll` is a capital-I
slip. Under the hard fold there are **zero** further collisions, so the case fold
catches all of them and nothing is left to arbitrate. This is what
`domain-context.md`'s "pick your name from a list" is for; the fold key is what
stops the list growing a second entry for the same person on a phone keyboard.

Names mix real names, handles, and both (`Christopher (cfabruscato)`,
`Andrew Van Wyk (Yerardet)`). The display name is opaque. See *Open question 3*
about `Jeremy (Razor) & Team`.

### `event`

```sql
CREATE TABLE event (
  event_id   INTEGER PRIMARY KEY,
  event_year INTEGER NOT NULL,   -- calendar year, Jan-Dec
  name       TEXT    NOT NULL,   -- 'V26', 'Tower of Blood', 'Gen Con'
  kind       TEXT    NOT NULL CHECK (kind IN ('convention','virtual','adventure','special')),
  month      INTEGER,            -- 1-12 where the workbook states it
  fold_key   TEXT    NOT NULL,
  UNIQUE (event_year, fold_key)
);
```

**`name` is opaque and is never parsed.** `V26` is the 26th virtual event, not a
year — 2025 runs `V28`–`V30`. The year comes from `event_year` and nowhere else.

**The month belongs in a column, because the workbook keeps putting it in the
name and then losing it.** One 2026 event appears under four spellings:

| Where | Spelling |
|---|---|
| sheet tab | `Mists of Madness (Feb)` |
| that sheet's summary tab, A1 | `Mists of Madness (February)` |
| `Transposed for Pivot` | `Mists of Madness` |
| — | and `Tower of Blood (Jan)` becomes `Tower Of Blood` in the pivot |

The 2025 pivot is worse, and it is the case for `fold_key UNIQUE` on events:

```
Origins  and  Origns          -- one event, two series
V30      and  v30             -- case-only; a soft-fold ERROR
Runeheim Ravaged  ->  Runehem Ravaged
April Patron Run  ->  Patron Run
v31                           -- 27 rows of data for an event with no sheet
```

### `token`

```sql
CREATE TABLE token (
  token_id       INTEGER PRIMARY KEY,
  name           TEXT    NOT NULL UNIQUE,  -- canonical spelling
  fold_key       TEXT    NOT NULL,
  kind           TEXT    NOT NULL CHECK (kind IN
                   ('specific','tier','chase_piece','trade_good','modifier')),
  pool           TEXT    NOT NULL CHECK (pool IN ('pack','treasure_box','either')),
  rarity         TEXT,        -- rung of the canonical ladder, or NULL
  token_year     INTEGER,     -- the token's OWN vintage, or NULL
  trade_rung     INTEGER CHECK (trade_rung BETWEEN 1 AND 5),
  chase_set_size INTEGER      -- 6, 20 or 40; NULL otherwise
);
```

**`token_year` is not the event year.** A Monster Trophy pulled at a 2026 event
*is* a 2026 trophy, and the auction project's recipes ask for the previous year's
(`ItemYear=-1`, all 36 lines). The 2026 workbook's `tokenCategories` lists
`50 GP Rune` — a **2025** token — which is the distinction in the data.

**`kind='tier'` is a real category.** Several pulled names are rungs of the ladder
rather than named tokens: `Legendary`, `Ultra Rare`, `Exalted (4 point)`,
`Enhanced (3 point)`, `Previous Relic` (2024), `Non-Year Relic` and
`Arcanum Sets` (2026). The player recorded *what tier dropped*, not which token —
legitimate data, and the skill confirms `Ultra Rare` is canonically both a tier
and a token name. A deduction treating these as named tokens double-counts them
against the specific ones.

**`trade_rung` goes past 2.** 2026 itemises 11 trade goods with the community
abbreviations in row 1 (`AI`, `AP`, `AG`, `DP`, `DS`, `EB`, `EM`, `MH`, `MS`,
`OE`, `PS`), and the pulls also contain `1,000 GP Bar`, `5,000 GP Bar` (Trade 3),
`25,000 GP Bar` (Trade 4), `Golden Fleece` (Trade 3), `Wish Ring` (Trade 4),
`Omni Orb` and `Omni Cube` (Trade 5). The skill's warning that treasure tooling
must accept Trade 3–5 is confirmed by the file.

**Season-relative names resolve at entry.** `Previous Relic`, `Older Relic`,
`Older Legendary`, `Non-Year Relic` are live. The phrase resolves against
`event_year` to a concrete `token_year` and does not survive into the row.

### `token_alias`

```sql
CREATE TABLE token_alias (
  alias    TEXT PRIMARY KEY,
  token_id INTEGER NOT NULL REFERENCES token(token_id),
  source   TEXT NOT NULL,   -- '2024 workbook', 'auction origin/main', ...
  note     TEXT
);
```

**The vocabulary turns over almost completely between years.** Across the three
workbooks' `tokenCategories` sheets:

| | tokens |
|---|---|
| 2024 | 36 |
| 2025 | 28 |
| 2026 | 48 |
| union of all three | 80 |
| **present in all three years** | **13** |

Thirteen names survive three years: the four GP/bar entries, `10x Pull`,
`Enhanced (3 point)`, `Exalted (4 point)`, `Golden Fleece`, `Legendary`, `Rare`,
`Uncommon`, `Ultra Rare`, `Wish Ring` (plus `Total Other`, which is not a token
at all). Everything else is a one- or two-year name. A model keyed on the name
string cannot survive this; the alias table is how a rename stays one series.

Aliases already needed, measured:

| Alias | Canonical | Why |
|---|---|---|
| `Monster Bits` (2024, 2025) | `Monster Bit` (2026) | renamed between years |
| `Sprit Pet` | Spirit Pet | typo |
| `Silver Ship ?????`, `Silver Ship Outpost Nil`, `Silver Ship Passage` | ? | three spellings, three years |
| `Unknown Figurine` | ? | placeholder |
| `Stalker Tokens` | `Stalker Token (20 unique)` | plural, and the auction spelling differs |
| `10x Trade` (2024) | `10x Trade Good` (2026) | renamed |
| `Total Other`, `Total Trade 1`, `Total Trade 2` | — | **not tokens**; computed columns in the token table |

### And the two projects do not agree on chase names

The treasure workbook calls them `Golem Chaser (set of 40)` and
`Herald's Chaser (set of 20)`. The auction project's `origin/main` calls the same
tokens `Golem Piece (40 unique)` and `Herald Token (20 unique)`. **No fold can
see that these are the same thing.** If pull data is ever joined to auction
recipes — and `domain-context.md` § *This data has a downstream consumer* says it
will be — the mapping is hand-authored, once, in `token_alias`.

### What the name check catches, and what it does not

Run over **84 distinct spellings** drawn from every token-bearing table in all
three workbooks, using § 1's folds:

**SOFT-FOLD (ERROR) — 2 collisions**, both inside the 2026 workbook:

```
'Golem Chaser (Set of 40)'     tokenCategories
'Golem Chaser (set of 40)'     all six event sheets + pivot
"Herald's Chaser (Set of 20)"  tokenCategories
"Herald's Chaser (set of 20)"  all six event sheets + pivot
```

The lookup key and the column header differ in one letter's case. **Excel's
lookup is case-insensitive, so the workbook gets away with it; SQLite's `=` is
not.** That is the whole argument for `fold_key` as a stored column rather than a
comparison done at query time.

**HARD-FOLD (review) — 1 real collision**: `Monster Bit` / `Monster Bits`, which
is the same token across years and belongs in `token_alias`.

**And three live defects that both folds miss**, because they differ by more than
case, whitespace, punctuation or a plural:

- `Origins` / `Origns` — one 2025 event split into two series, 22 rows and 5.
- `Silver Ship ?????` / `Silver Ship Outpost Nil` / `Silver Ship Passage`.
- `Golem Chaser (set of 40)` / `Golem Piece (40 unique)` across the two projects.

**So the check is necessary and not sufficient**, and this is the same blind spot
that is blind *by design*: the rule that would catch these also merges
`+1 Turkey Leg` into `+1 Turkey Leg of Smiting`.

### `submission` and `pull`

```sql
CREATE TABLE submission (
  submission_id INTEGER PRIMARY KEY,
  event_id      INTEGER NOT NULL REFERENCES event(event_id),
  player_id     INTEGER NOT NULL REFERENCES player(player_id),
  condensed     INTEGER NOT NULL,   -- the treatment; the 2026 split-treasure line
  run_label     TEXT,               -- distinguishes a second submission, same treatment
  submitted_at  TEXT    NOT NULL,
  submitted_as  TEXT    NOT NULL,   -- the name as picked/typed, before folding
  form_version  TEXT    NOT NULL,
  revoked_at    TEXT                -- set by an admin; never deleted
);

CREATE TABLE pull (
  pull_id       INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submission(submission_id),
  token_id      INTEGER NOT NULL REFERENCES token(token_id),
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  token_year    INTEGER,            -- resolved vintage for this pull
  supersedes    INTEGER REFERENCES pull(pull_id),
  source        TEXT    NOT NULL,   -- 'player' | 'maintainer' | '2024 workbook'
  agreement     TEXT,
  note          TEXT
);
```

`event_id` and `player_id` live on `submission` only — a pull cannot disagree
with its own submission about which event it came from. That is
`inherited-practices.md` § 11's *a row keyed to the wrong parent*, removed by
construction rather than validated for.

`source` / `agreement` / `note` are § 4, copied from `order-composition.csv`.
`agreement` carries strings like `CONFIRMED by 18 of 19` or
`REPORTERS DISAGREE — 1 of 3 say 8, not 7`, so a disagreement is surfaced and
left open rather than resolved by whoever submitted last. § 7 is the resolution
rule when one is needed: quantity-weighted mode, and **ties are flagged, never
broken** — the recorded corpus splits 8 low, 5 high, 1 midpoint.

**Append-only.** A correction inserts a row pointing at the one it replaces
through `supersedes`; nothing is ever `UPDATE`d or `DELETE`d, per `stack.md`.

**There is deliberately no `UNIQUE (submission_id, token_id)`**, because
append-only and uniqueness fight each other — every correction would violate it.
Uniqueness over *live* rows is enforced in the Function and re-checked by the
validator over the export, per § 3: *validate where the data lands.*

The defect it exists to prevent is measured: the 2024 long mirror contains
**1,095 duplicate (token, player, event) keys**, and 41 (player, event) pairs
carry double the expected rows — while the wide sheets are clean (`V26`: 41 rows,
41 names). 2024 had no `Condensed` column and no other discriminator, so the
grid had nowhere to put a second submission and the duplication appeared in the
transpose.

### The defect this whole model exists to prevent

Both later workbooks lose most of the year on the way to analysis, silently.

**2025** — `Transposed for Pivot` covers 9 event names against 12 event sheets.
After matching the typos (`v30`→`V30`, `Runehem Ravaged`→`Runeheim Ravaged`,
`Patron Run`→`April Patron Run`), **five events are simply absent**:

| Missing event | pulls |
|---|---|
| Grunnel Holiday Pt 3 | 4,891 |
| Runeheim Reforged | 4,676 |
| Ravens Eye | 4,606 |
| Runeheim Revenged | 4,369 |
| Gamehole Con | 1,836 |
| **total** | **20,378 of 50,471 — 40% of the year** |

…while `v31`, which has no event sheet at all, contributes 27 rows.

**2026** — the pivot reads the `Condensed Total` row. Of the 44 tokens it carries
per event, the condensed-only figure matches 42/44, 43/44, 44/44 and 43/44 for
the four events that have both treatments. **The entire non-condensed population
is dropped**, along with the 33 zeroed Rare/Uncommon pulls.

Neither failure is visible in the workbook. Both are impossible here, because
there is no second representation to fall out of sync with: every rollup is a
query over `pull`.

## Open questions — please correct

1. **Tower of Blood has 29 Rare and 4 Uncommon on condensed lines.** Are those
   treasure-box-only Rares recorded in the generic `Rare` column (in which case
   `pool` needs a way for the player to say which), or entry errors? The 4
   Uncommons are the odd part — treasure-box-only *Uncommons* were not mentioned.

2. **`10x Pull` and `10x Trade Good` are in the vocabulary but look like
   multipliers.** Does a `10x Pull` row mean "this player received a token
   granting ten pulls" (a real drop, `kind='modifier'`), or "the ten pulls listed
   elsewhere came from one drop"? The workbook counts them into `Total Pulls`,
   which double-counts under the second reading. 2024 also had `3x Pull`.

3. **`Jeremy (Razor) & Team` is a player row.** `Jeremy (Razor)` also appears
   separately. Is a team entry one reporter covering several people's loot? If
   so its pulls are not comparable per-player and `is_group` must exclude them
   from per-player rates — or the form should refuse team entries.

4. **Beyond the condensed split, can a player submit twice for one event?** The
   2026 `(Y, Y)` pair at Order of the Dawn and the 2025 repeats (`LordBrian`,
   `Snowy`, `James C`, `Bill Misquez`, and two at V30) say yes, but 2025 had no
   discriminator column. Is a second run real, and should `run_label` be a free
   label, a run number, or dropped in favour of "two submissions is fine"?

5. **What are `Silver Ship ?????`, `Silver Ship Passage` and `Unknown Figurine`,
   and is `Silver Ship Outpost Nil` the same token?** No automated check can
   decide this.

6. **Does history get imported, and how far back?** This decides whether
   `token_alias` matters on day one. Importing 2024 means inheriting a missing
   V25, 1,095 duplicate keys and five split player identities; importing 2025 or
   2026 means there is **no per-player data to import at all** — only event
   totals, since `rawPersonalStats` is `#REF!` in both.
