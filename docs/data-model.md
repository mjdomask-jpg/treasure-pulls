# Data model

Revised 2026-09-19 against the owner's answers of the same date
(`handoff-2026-09-19-ANSWERS.md`, `handoff-document-review-answers.md`) and the
review that preceded them (`data-model-review.md`). Supersedes the 2026-09-18
draft, which was framed as "measured against the 2024 workbook" — the wrong
frame. **The workbooks are evidence about failure modes, not a source of
requirements.** Where a number below is measured it says so, with the file and
date; everything else is a decision.

Game facts come from the `td-domain` skill; treasure-recording facts from
`domain-context.md`; the validation posture from `inherited-practices.md`. Scope
is the **2027 season**. Historical backfill is a long-term goal, out of scope for
V1.

The schema is SQLite, per `stack.md`.

---

## 1. What is being modelled

**A pool is sampled, and a player receives what came out.**

That sentence is the whole model, and every table below exists to keep its three
nouns apart. The legacy workbook has one word — "pulls" — for three different
quantities, which is the single largest source of wrong numbers in the existing
analysis:

| Term | Meaning | How it is obtained |
|---|---|---|
| **draws** | times the pool was sampled | **derived** — never entered |
| **items** | physical tokens received | `SUM(pull.quantity)` |
| **entitlement** | pulls earned from play (base 3, max 27 → 30 in 2027) | not stored; not needed |

**A rate always has `draws` as its denominator.** `items` is the denominator only
for the standard mix, and using it everywhere is a 2.7× error on 59% of the 2026
corpus. See § 2.

### Three pools, not one treatment flag

The 2026 draft carried `submission.condensed BOOLEAN`. That names the
*packaging*. What the project measures is **which pool was sampled**, and there
are now three:

| Mix | Who gets it | Unit | Contents |
|---|---|---|---|
| `standard` | everyone | 1 item per draw | the treasure pool |
| `condensed` | max-treasure players, **virtual only** | 10 items per `max_pulls` draws | standard pool minus standard-set Rare/Uncommon, plus their converted trade goods |
| `pack_substitute` | virtual shipments | 1 item per draw | **its own flat pool** — trade goods, with a stated 1/100 Ultra Rare |

`pack_substitute` replaces the blind pack the company used to ship, dropped to
cut shipping cost and to reward combining addresses. It is packaged separately
and clearly marked, so players can tell it apart without being asked to. Mixing
it into the other two would inflate both trade-good and Ultra Rare rates.

**It ships in V1** (decided 2026-09-19). It is the cheapest stream to enter — one
item per seat-run, from a short list — and it is the only place in the project
where the method can be checked against a published number; see § 9.

---

## 2. Condensed: measured, predicted, and confirmed

**Measured 2026-09-19 from `2026 Treasure Pull Records.xlsx`** (four events
carrying both treatments: Tower of Blood, Mists of Madness, Order of the Dawn,
Through Fear and Fog). 3,405 non-condensed items over 66 rows; 4,991 condensed
items over 107 rows — **499.1 packs**.

### The scaling factor is real

One condensed pack of 10 is what 27 draws produce after conversion. Every token
the conversion does *not* touch should therefore appear at `rate × 10/27` of its
standard rate. Measured ratio of (condensed rate × 10/27) to standard rate:

| Token | ratio | | Token | ratio |
|---|---|---|---|---|
| Golem Chaser | 1.03 | | Ultra Rare | 1.07 |
| Herald's Chaser | 0.95 | | 10x Trade Good | 1.04 |
| Enhanced (3 point) | 1.01 | | Exalted (4 point) | 1.19 |
| Monster Bit | 1.14 | | Cloak / Gloves of the Order | 0.91 |

Eight independent tokens, spanning three orders of magnitude in frequency,
recovering 27/10 from the data. **In 2027 the factor becomes 30/10 = 3.0**, which
is why it is a stored per-year constant and not a literal.

Composition is also flat across entitlement, which confirms that party-breakpoint
bonus pulls draw from the same pool: Golem Chaser runs 4.68% / 4.75% / 4.74%
across standard rows of 10–26, 27–54 and 55+ items.

### The conversion arithmetic reproduces itself

The company does not publish the condensed mix. The community hypothesis is that
standard-set Rare and Uncommon tokens are replaced 1:1 by the trade goods they
would convert into, at the ordinary crafting rates. **That hypothesis is now
confirmed in aggregate**, using the 2026 conversion counts:

Standard rows are **75.6%** standard-set Rare + Uncommon, so 27 draws yield 10.82
Rare, 9.59 Uncommon and 6.59 non-pack items. Feeding those through the rules in
§ 6 and adding the baseline trade goods that have always been in the pool:

| good | from conversion | baseline | predicted | observed | Δ items | ratio |
|---|---|---|---|---|---|---|
| Darkwood Plank | 0.822 | 0.063 | 0.885 | 0.821 | −32 | 0.93 |
| Mystic Silk | 0.692 | 0.063 | 0.755 | 0.721 | −17 | 0.95 |
| Philosopher's Stone | 0.511 | 0.032 | 0.543 | 0.529 | −7 | 0.97 |
| Alchemist's Ink | 0.159 | 0.040 | 0.198 | 0.190 | −4 | 0.96 |
| Enchanter's Munition | 0.094 | 0.040 | 0.133 | 0.134 | 0 | 1.01 |
| Elven Bismuth | 0.048 | 0.056 | 0.103 | 0.116 | +6 | 1.12 |
| Aragonite | 0.130 | 0.032 | 0.162 | 0.138 | −12 | 0.86 |
| Alchemist's Parchment | 0.216 | 0.016 | 0.232 | 0.276 | +22 | 1.19 |
| Oil of Enchantment | 0.048 | 0.048 | 0.096 | 0.144 | +24 | 1.51 |
| **1,000 GP Bar** | 0.330 | 0.095 | 0.426 | 0.291 | **−67** | **0.68** |
| **Dwarven Steel** | 0.000 | 0.032 | 0.032 | 0.112 | **+40** | **3.54** |
| **Minotaur Hide** | 0.000 | 0.008 | 0.008 | 0.092 | **+42** | **11.62** |
| **TOTAL** | | | **3.573** | **3.566** | **−3** | **0.998** |

**Three items out of 1,780.** The mechanism is settled.

### The conversion table is per-year data, and this is the proof

Running the same prediction with the **2027** counts instead misfires on exactly
the two goods whose counts moved between the years — Philosopher's Stone
(11U/3R → 3U/6R) drops from 0.97 to 0.89, Alchemist's Ink (1U/2R → 2U/3R) from
0.96 to 0.65. Using the right year's table repairs both.

So `trade_conversion` is **first-class yearly data, not configuration**, and a
2027 estimate cannot be validated until 2027 data exists.

### An open finding: the mix is not purely arithmetic

Three goods miss badly, and the misses balance:

- **surplus** — Dwarven Steel +40, Minotaur Hide +42, Oil of Enchantment +24,
  Alchemist's Parchment +22 → **+128**
- **shortfall** — 1,000 GP Bar −67, Darkwood Plank −32, Mystic Silk −17,
  Aragonite −12, Philosopher's Stone −7, Alchemist's Ink −4 → **−139**

Total conversion points are conserved to 0.2% while the *allocation* shifts. That
rules out "extra goods added", and it rules out an error in the counts: both the
2026 and 2027 Uncommon and Rare columns already sum to 38 plus 2 GP items = 40
exactly, leaving no room for hidden Dwarven Steel or Minotaur Hide sources.

**The obvious explanation is that Commons are converted too, and it is rejected.**
Dwarven Steel and Minotaur Hide come only from Common tokens — tokendb gives them
12 and 7 Common sources respectively, the largest Common allocations of any good
(§ 6). If the company converted whole blind packs rather than only the treasure
Rares and Uncommons, both would appear. But the arithmetic does not support it,
twice over:

- Dwarven Steel's excess implies **6.7** Commons converted per pack; Minotaur
  Hide's implies **12.0**. One parameter cannot be both.
- Either value adds to *every* good's yield. At 6.7 the total goes from 3.573 to
  3.827 against 3.566 observed — a **7.3% overshoot**, where Rare and Uncommon
  alone land at 0.2%.

So the total is right and only the allocation is wrong, which is the signature of
**substitution, not addition**. Dwarven Steel and Minotaur Hide are put into the
mix — without them they would be effectively unobtainable from treasure, since
Commons are in the pool only by accident — and the cost is taken out of the most
valuable line: the 1,000 GP Bar runs a third short, 67 bars across 499 packs.

**No company statement exists either way, and nobody tracks the shortfall.** This
is the first thing the project would find that the community does not already
know, and it came out of one year of partial data. It is recorded here as a
finding to re-test in 2027, not as a rule to encode.

### Where standard-set Rares survive condensing

Condensed Rare is near-zero but **not** always zero — 30 Rare and 4 Uncommon
across the four events, on 4 rows. Those are treasure-box-only Rares recorded in
the generic `Rare` column, and the workbook's `Condensed Total` row hard-zeroes
them, hiding 33 real pulls at Tower of Blood alone and dropping them from the
year's analysis entirely.

The fix is in the vocabulary, not the schema: **`Rare` as an entry option means
the standard set**, and the 1–2 treasure-box-only Rares a year are named tokens
offered separately. There is then no column standing for two populations, and
nothing to hard-zero.

---

## 3. Deriving the denominator

Given § 2, **no entry field ever asks for a pull count.** The itemised entries
sum to `items`, and `draws` follows from the mix:

```
draws = items                                       -- standard, pack_substitute
draws = items × draws_per_unit / items_per_unit     -- condensed: ×2.7 (2026), ×3.0 (2027)
```

This holds under the awkward cases:

- **A 10x Pull is self-consistent.** One draw yields the chip (1 item); the chip
  grants 10 draws yielding 10 items. `items = draws` survives.
- **Entitlement varies** 3 → 30 and cannot be derived from a multiplier, but it
  never needs to be: what matters is how many times the pool was sampled, and the
  items say.
- **Condensed entitlement is always max**, because only max-treasure players may
  choose it. That is what fixes the factor.

**The form must never use the words "total pulls".** That label means `items` on a
condensed row and `draws` on a standard one, and it is the workbook's original
sin — 92% of condensed rows there are multiples of 10 because players were
counting tokens, while standard rows count draws.

In exchange, an invariant a spreadsheet could never check: **condensed items come
in whole packs.** Measured, **9 of 107 condensed rows fail it** (sums of 7, 32,
47, 55, 57, 69, 72, 113, 129), five of them at the first event that offered the
option. A live form check — *"condensed treasure comes in packs of 10 and you've
entered 57 — missing three?"* — catches an 8% error rate at the keyboard.

---

## 4. Tables

### `event_year` and the mixes

```sql
CREATE TABLE event_year (
  event_year INTEGER PRIMARY KEY,      -- 2026, 2027
  base_pulls INTEGER NOT NULL,         -- 3
  max_pulls  INTEGER NOT NULL          -- 27 in 2026, 30 in 2027
);

CREATE TABLE mix (
  mix_id INTEGER PRIMARY KEY,
  code   TEXT NOT NULL UNIQUE          -- 'standard' | 'condensed' | 'pack_substitute'
);

CREATE TABLE mix_year (
  mix_id         INTEGER NOT NULL REFERENCES mix(mix_id),
  event_year     INTEGER NOT NULL REFERENCES event_year(event_year),
  draws_per_unit INTEGER,              -- 27 / 30 for condensed; NULL elsewhere
  items_per_unit INTEGER,              -- 10 for condensed; NULL elsewhere
  venue          TEXT    NOT NULL CHECK (venue IN ('any','virtual')),
  offered        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (mix_id, event_year),
  CHECK ((draws_per_unit IS NULL) = (items_per_unit IS NULL))
);
```

Both NULL means one item per draw. The 2027 change from 27 to 30 is a data edit.

**`venue` is advisory, not a constraint.** Condensed and pack-substitute are
virtual-only today and the owner has said that could change; a rule change should
not make the form reject true data. Enforced as NOTE-level V8, never an ERROR.

### `event`

```sql
CREATE TABLE event (
  event_id   INTEGER PRIMARY KEY,
  event_year INTEGER NOT NULL REFERENCES event_year(event_year),
  name       TEXT    NOT NULL,   -- 'Tower of Blood', 'Gen Con'
  serial     TEXT,               -- 'VTD31' — virtual events have always had one
  kind       TEXT    NOT NULL CHECK (kind IN
               ('convention','virtual','special','redemption')),
  start_date TEXT,
  fold_key   TEXT    NOT NULL,
  UNIQUE (event_year, fold_key)
);
```

**`name` is opaque and never parsed.** `V26` is the 26th virtual event, not a
year — the 2024 records run V20–V26. The year comes from `event_year` and nowhere
else.

**Virtual events have always carried both a name and a VTD serial**; 2026 merely
stopped printing the serial. Both are recorded, and neither is derived from the
other.

`kind='redemption'` holds one synthetic event per year, *"10x Pull redeemed by
mail"* — see § 5.

The date belongs in a column because the workbook keeps putting the month in the
name and then losing it. One 2026 event appears as `Mists of Madness (Feb)`,
`Mists of Madness (February)` and `Mists of Madness` in three places in its own
file. The 2025 pivot is worse and is the case for `fold_key UNIQUE`: `Origins`
and `Origns` are one event as two series; `V30` and `v30` differ only in case;
`Runeheim Ravaged` became `Runehem Ravaged`; and `v31` carries 27 rows for an
event that has no sheet at all.

### `player` and `team`

```sql
CREATE TABLE player (
  player_id    INTEGER PRIMARY KEY,
  display_name TEXT    NOT NULL,        -- as the person spells it
  fold_key     TEXT    NOT NULL UNIQUE,
  first_seen   TEXT    NOT NULL
);

CREATE TABLE team (
  team_id      INTEGER PRIMARY KEY,
  display_name TEXT    NOT NULL,
  fold_key     TEXT    NOT NULL UNIQUE,
  first_seen   TEXT    NOT NULL
);
```

**`fold_key UNIQUE` is the whole point of `player`.** 2024 holds **89 distinct
names that are 84 people**, with five pairs differing only in case — `Hacky` /
`hacky`, `BIll` / `Bill`, `Enginerd` / `enginerd`, `Lequinian` / `lequinian`,
`Gentlegiant303` / `gentlegiant303`. Each is a typo by construction. Under the
hard fold there are **zero** further collisions, so the case fold catches all of
them and leaves nothing to arbitrate.

**`is_group` is gone; `team` replaces it.** Guilds batch-enter routinely, and the
old flag put one person's name on a whole guild's loot. A team is a real entity
players already think in — *"people are used to looking at their stats on a
group/team level"* — and the list is short enough to pick from. Membership is
deliberately **not** modelled: rosters vary run to run, a guild may buy out
unsold tickets, and nothing here needs to know who was in the party.

### `token`

```sql
CREATE TABLE token (
  token_id           INTEGER PRIMARY KEY,
  name               TEXT    NOT NULL UNIQUE,   -- canonical spelling
  fold_key           TEXT    NOT NULL,
  external_slug      TEXT    UNIQUE,            -- tokendb slug; the shared vocabulary key
  resolution         TEXT    NOT NULL CHECK (resolution IN ('specific','group')),
  group_id           INTEGER REFERENCES token(token_id),
  rarity             TEXT,                      -- a rung of the canonical ladder
  trade_rung         INTEGER CHECK (trade_rung BETWEEN 1 AND 5),
  gp_value           INTEGER,                   -- 1000 / 5000 / 25000 for bars
  token_year         INTEGER,                   -- the token's OWN vintage
  in_standard_set    INTEGER NOT NULL DEFAULT 0,
  bundle_of_token_id INTEGER REFERENCES token(token_id),
  bundle_size        INTEGER,
  set_size           INTEGER,                   -- chase set: 6, 20 or 40
  grants_draws       INTEGER,                   -- 10 for '10x Pull', 3 for '3x Pull'
  status             TEXT    NOT NULL CHECK (status IN ('catalog','proposed')),
  CHECK (group_id IS NULL OR resolution = 'specific'),
  CHECK ((bundle_of_token_id IS NULL) = (bundle_size IS NULL))
);
```

**The 2026 draft's `kind` column is gone.** It enumerated
`('specific','tier','chase_piece','trade_good','modifier')` — five things that are
not alternatives to one another. They dissolve into independent attributes:
`resolution`, `set_size`, `trade_rung`, `grants_draws`. That is the review's *do
not recreate the sheet's layout groupings* applied to our own draft.

#### `resolution` is one mechanism covering four problems

A pull may name a specific token or the group it belongs to. That single idea
handles everything the sheet fudged:

| Group | Members | Why a group |
|---|---|---|
| `Rare (2027)` | the 40 standard-set Rares | 40 options is a chore nobody wants |
| `Uncommon (2027)` | the 40 standard-set Uncommons | same |
| `Golem Chaser` | 40 variants | same |
| `Herald's Chaser` | 20 variants | same |
| `Cloak or Gloves of the Order` | 2 tokens | *"the important bit is how often they show up in total"* |
| `Relic (year unknown)` | — | the pool of previous-year Relics is broad and the sample small |
| `Legendary (year unknown)` | — | same |

**The form defaults to the group in every one of these cases.** Nobody is asked to
pick from 140 options. What the schema does is decline to *forbid* a specific
answer, at a cost of one CSV and zero entry burden.

That matters most for chase variants. The company has stated an *intention* that
the 40 and 20 variants be uniform — which is exactly the class of unpublished
claim this project exists to test, and intended-uniform differs from is-uniform by
manufacturing and packing variance. The consequence is not academic: set
completion is governed by the scarcest variant, and the auction project already
prices variants individually. If even a few percent of reporters itemise,
uniformity becomes checkable; if none do, nothing is lost.

**Resolution levels are disjoint, never overlapping.** A group row is a residual —
*"and how many other Rares?"* — so `items` is the sum of all rows regardless of
grain, and there is no `Total Other` to reconcile.

#### `in_standard_set` — the flag the condensed rule needs

Marks the 40/40/40 blind-pack tokens, the ones a condensed submission has had
converted away. Named this rather than `pool`, which now collides with *the
treasure pool* — the thing being deduced — and with `mix`.

#### Bundles are stored, never expanded

A `10x Darkwood Planks` is its own token with `bundle_of_token_id → Darkwood
Plank` and `bundle_size = 10`, recorded as `quantity = 1`. Expansion happens per
question, at query time:

- **pool composition** — one chip, one draw. Never ten.
- **goods in circulation** — `SUM(quantity × COALESCE(bundle_size, 1))` against
  the base good.
- **condensed conversion yield** — **exclude chips entirely.**

The third is why this is not a matter of taste. The chip's condensed/standard
ratio is **1.04** — it drops at the same per-draw rate under both treatments, so
it is a baseline pool item untouched by conversion. Expanding it adds 0.82
goods/pack to a measured yield of 3.566, a **+23% inflation** that turns § 2's
0.2% agreement into a 23% miss. Collapsing at write time does not merely lose the
chip's own drop rate; it corrupts the primary estimate.

The 2026 sheet has a single `10x Trade Good` column that never says *which* good,
so those 41 chips cannot be expanded even in principle. **The form asks which
good** — a dropdown of eight.

#### `token_year` is not the event year

A Monster Trophy pulled at a 2026 event *is* a 2026 trophy, and the auction
project's recipes want the previous year's (`ItemYear=-1`, all 36 lines). Season-
relative phrases — `Previous Relic`, `Older Legendary`, `Non-Year Relic` — are
**display labels, never stored**. A previous-year Relic is stored as
`rarity='Relic', token_year=NULL`: *"a Relic, year not recorded"*, which stays
readable in 2030 and stays comparable when someone does eventually name one.

#### `status` — the catalog is discovered, not declared

1–2 treasure-pool-exclusive Rares appear each year and are not known until players
receive the first game's treasure. New tokens can also arrive mid-year after a
Patron run or a storyline capstone. **A surprise token must be capturable, never
rejected**; `status='proposed'` holds it until a maintainer promotes it.

### `token_alias`

```sql
CREATE TABLE token_alias (
  alias    TEXT PRIMARY KEY,
  token_id INTEGER NOT NULL REFERENCES token(token_id),
  source   TEXT    NOT NULL,   -- '2024 workbook', 'auction origin/main', 'tokendb'
  note     TEXT
);
```

**The vocabulary turns over almost completely between years.** Across the three
workbooks' `tokenCategories` sheets: 36 tokens in 2024, 28 in 2025, 48 in 2026,
union 80, and **13 present in all three**. A model keyed on the name string
cannot survive that.

With history out of scope for V1, the justification shifts from import to
**cross-project mapping**: the treasure workbook says `Golem Chaser (set of 40)`
where the auction project says `Golem Piece (40 unique)`. **No fold can see that
those are the same token.** The mapping is hand-authored, once, and `tokendb`
slugs in `token.external_slug` are the canonical key on both sides — confirmed
stable and acceptable to its owner.

### `submission` and `pull`

```sql
CREATE TABLE submission (
  submission_id INTEGER PRIMARY KEY,
  event_id      INTEGER NOT NULL REFERENCES event(event_id),
  mix_id        INTEGER NOT NULL REFERENCES mix(mix_id),
  player_id     INTEGER NOT NULL REFERENCES player(player_id),  -- the reporter
  team_id       INTEGER REFERENCES team(team_id),               -- whose loot, if not theirs
  seat_runs     INTEGER,        -- seats covered; checked, never enforced
  intent        TEXT    NOT NULL CHECK (intent IN ('new_loot','correction')),
  corrects      INTEGER REFERENCES submission(submission_id),
  submitted_at  TEXT    NOT NULL,
  submitted_as  TEXT    NOT NULL,   -- the name as picked/typed, before folding
  form_version  TEXT    NOT NULL,
  revoked_at    TEXT,               -- set by an admin; rows are never deleted
  CHECK ((intent = 'correction') = (corrects IS NOT NULL))
);

CREATE TABLE pull (
  pull_id       INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submission(submission_id),
  token_id      INTEGER NOT NULL REFERENCES token(token_id),
  quantity      INTEGER NOT NULL CHECK (quantity <> 0),
  token_year    INTEGER,
  source        TEXT    NOT NULL,   -- 'player' | 'maintainer' | '2024 workbook'
  agreement     TEXT,
  note          TEXT
);
```

**`seat_runs`, not `person_runs`.** The thing that earns treasure is a seat in a
run, not a person: one human may buy all ten tickets and run ten copies of the
synergy tokens to reach the top breakpoint. Optional, and validated only when
present.

**Team and personal submissions are disjoint.** A given event's loot goes to one
reporter, so per-player stats are the rows with `team_id IS NULL` and per-team
stats group by `team_id`, with no double counting and no overlap to reconcile.

**Both second-submission shapes are supported, and they are different.** Players
routinely enter a second row rather than doing arithmetic on the first:

- **new loot** — a separate shipment, a guild member's split delivery, the other
  treatment. A new submission, positive quantities. Adds to `items`, so it adds
  to `draws`. Correct.
- **correction** — the first row was wrong. `intent='correction'`, `corrects` set,
  **signed deltas**, negative allowed. Nobody is made to do math; the aggregate
  lands on the truth either way.

`quantity <> 0` rather than `> 0`: a zero row and a missing row mean different
things to a deduction ("nobody pulled one" vs "nobody said"), and corrections need
to go down as well as up. Non-negativity belongs on the live total, not the row.

**Append-only.** Nothing is ever `UPDATE`d or `DELETE`d, per `stack.md`.

**There is deliberately no `UNIQUE (submission_id, token_id)`** — append-only and
uniqueness fight each other. Uniqueness over *live* rows is enforced in the
Function and re-checked by the validator over the export, per
`inherited-practices.md` § 3.

`event_id` and `mix_id` live on `submission` only: a pull cannot disagree with its
own submission about where it came from. That removes
`inherited-practices.md` § 11's *row keyed to the wrong parent* by construction.

`source` / `agreement` / `note` are § 4, copied from `order-composition.csv`.
`agreement` carries strings like `CONFIRMED by 18 of 19`, so a disagreement is
surfaced and left open rather than settled by whoever submitted last. § 7 is the
resolution rule: quantity-weighted mode, **ties flagged, never broken**.

---

## 5. The 10x Pull, and the boundary it crosses

A 10x Pull grants **10 more draws from the standard pool — even when the chip came
out of a condensed pack.** So a condensed submission can otherwise end up holding
standard-mix items, including the pack Rares and Uncommons that define the mix by
their absence. That would corrupt § 2 directly.

The rule: **a 10x Pull redemption is its own `standard` submission.** When the form
sees a 10x Pull inside a condensed entry it prompts for the ten bonus pulls as a
separate line — the same convention the 2026 sheet already used for split
treasure.

There is a time shift too. The sequence is: play, receive treasure (by mail if
virtual, immediately if in person), possibly get a 10x Pull, then redeem it — in
person at the next event, or by mail. Redemption in person attaches to that event
and `items = draws` holds there. Redemption by mail attaches to the year's
`kind='redemption'` event. **It is always the current year's pool and can only be
redeemed in the current year**, so no cross-year bookkeeping is needed.

`10x Pull` appears **once in all of 2026**, so this is cheap to get right now and
never cheaper.

---

## 6. Conversion reference data

Four small seed tables, all keyed by year. They are what § 2 runs on, and they are
the reason a 2027 estimate cannot borrow 2026's numbers.

```sql
CREATE TABLE trade_conversion (          -- how many of the 40 convert to each good
  event_year    INTEGER NOT NULL REFERENCES event_year(event_year),
  good_token_id INTEGER NOT NULL REFERENCES token(token_id),
  source_rarity TEXT    NOT NULL CHECK (source_rarity IN ('Common','Uncommon','Rare')),
  source_count  INTEGER NOT NULL,
  PRIMARY KEY (event_year, good_token_id, source_rarity)
);

CREATE TABLE conversion_rule (           -- points, which differ by rung
  event_year       INTEGER NOT NULL REFERENCES event_year(event_year),
  trade_rung       INTEGER NOT NULL,
  source_rarity    TEXT    NOT NULL,
  points_per_token INTEGER NOT NULL,     -- Trade 1: 1/3/6.  Trade 2: 1/1/1.
  points_required  INTEGER NOT NULL,     -- 25
  PRIMARY KEY (event_year, trade_rung, source_rarity)
);

CREATE TABLE gp_source (                 -- GP bars are value-based, not point-based
  event_year    INTEGER NOT NULL REFERENCES event_year(event_year),
  source_rarity TEXT    NOT NULL,
  token_count   INTEGER NOT NULL,        -- per set of 40: 1 / 2 / 2
  gp_each       INTEGER NOT NULL,        -- 50 / 125 (mean of 100,150) / 500
  PRIMARY KEY (event_year, source_rarity)
);

CREATE TABLE standard_set (              -- the denominator the counts are out of
  event_year INTEGER NOT NULL REFERENCES event_year(event_year),
  rarity     TEXT    NOT NULL,
  set_size   INTEGER NOT NULL,           -- 40
  PRIMARY KEY (event_year, rarity)
);
```

Trade 1 takes 25 points, with Common = 1, Uncommon = 3, Rare = 6. Trade 2 takes 25
points at 1 point per token regardless of rarity, with Uncommon weapons → Elven
Bismuth, Uncommon armor → Oil of Enchantment, and Rare weapons or armor →
Aragonite. GP bars come from the equivalent GP value in Common, Uncommon or Rare
GP items, which is why they need their own table rather than a points row.

**Both years' counts sum to 38 goods-sources + 2 GP items = 40 per rarity.** That
identity is a validator, not a coincidence — an earlier draft of the 2027 table
summed to 34 Uncommons and the gap turned out to be a missing Oil of Enchantment
row.

### Corroborated against tokendb, 2026-09-19

tokendb carries a `converts_to` facet, so these counts are not only asserted —
they are checkable against an independent source, **one token at a time**.
`scripts/fetch_catalog.mjs` pulls a year's tokens with rarity, source and
`converts_to`; V9 then rebuilds `trade_conversion` from them and compares.

- **All 44 Uncommon and Rare cells match exactly**, across both years, and so do
  the 22 Common cells — **66 of 66**, with no residue in either direction.
- **`gp_source` is confirmed exactly.** tokendb's `Reserve Bar` count is 5 per
  year: 1 Common + 2 Uncommon + 2 Rare.
- **The set shape is confirmed.** 141 Standard Pack tokens per year = the
  40/40/40 sets + 20 Ultra Rares + 1 Special (the Golden Ticket), and exactly 21
  tokens marked `not exchangeable`.
- **The Common counts, previously unknown, came from here** and now satisfy V7
  in their own right: 39 goods + 1 GP = 40, both years.

The unit tags are the points ladder made explicit — `1 unit` / `3 units` /
`6 units` for Common / Uncommon / Rare on Trade 1, and `1 unit` for everything
feeding Trade 2, exactly as § 6's rules say.

> An earlier pass derived these counts by inclusion–exclusion over the facet
> (`|A ∩ B| = |A| + |B| − |A ∪ B|`, since multi-select is OR) and found four
> apparent single-token divergences. **They were artifacts of that method, not
> disagreements** — no token carries two goods, and the per-token pull agrees
> everywhere. Recorded because the aggregate query looked convincing and was
> wrong, which is the argument for V9 existing at all.

---

## 7. Validation

Per `inherited-practices.md` § 5, a check that cannot be *proved* wrong reports a
NOTE naming the remedy; a thing that is wrong by construction is an ERROR.

| # | Check | Severity |
|---|---|---|
| V1 | condensed `items` is a whole number of packs, over the aggregate per (subject, event) — not per submission, since corrections are deltas | NOTE with remedy |
| V2 | a condensed submission contains no `in_standard_set` token | NOTE |
| V3 | standard `items` falls between `base_pulls × seat_runs` and `max_pulls × seat_runs`, plus any `grants_draws` | NOTE, only when `seat_runs` given |
| V4 | `pack_substitute items ≈ Σ seat_runs + (persons − 1)` — one good per seat-run plus a thank-you per extra person on the shipment | NOTE, **deliberately loose** |
| V5 | a 10x Pull in a condensed submission has a matching standard submission | NOTE, prompted at entry |
| V6 | soft fold (case / whitespace / punctuation / plural) over `player`, `team`, `event`, `token` | ERROR |
| V7 | per-rarity `trade_conversion` + `gp_source` counts sum to `standard_set.set_size`, for rarities that have rows at all | ERROR |
| V8 | a submission's mix is offered at that event's venue | NOTE |
| V9 | `token_catalog_<year>.csv`, grouped by `converts_to` × rarity, reproduces `trade_conversion` | ERROR |

**V7 and V9 are implemented** — `scripts/check_conversion.mjs`, which also runs
the § 2 prediction end to end out of the committed CSVs and reproduces the
measured condensed yield to **0.18%**. It is the first executable thing in this
repo, and it needs no database and no UI.

V9 is the sharper of the two. V7 checks that a set of counts is internally
plausible; V9 checks it against the **actual tokens**, fetched separately, and
would catch a year's table being quietly edited to fit.

**The name check is necessary and not sufficient**, and its blind spot is blind by
design. Run over 84 distinct spellings from all three workbooks it catches
`Golem Chaser (Set of 40)` vs `(set of 40)` — a one-letter case difference between
a lookup key and a column header, which Excel forgives and SQLite's `=` does not —
and `Monster Bit` / `Monster Bits`. It misses `Origins` / `Origns`,
`Silver Ship ?????` / `Silver Ship Passage`, and the cross-project chase names,
because the rule that would catch those also merges `+1 Turkey Leg` into
`+1 Turkey Leg of Smiting`.

---

## 8. Everything computed stays computed

**Store the leaves. Compute every total, percentage and summary.**

The 2026 workbook's three-level rollup reconciles exactly from the itemised
columns — `Total Pulls` and `Total Other` disagree on **0 of 188** player rows,
and the same held in 2024 (0 of 139). So the rollups carry no information, and the
2024 `Type` column (`Normal` / `Special`) records only which part of the wide
sheet a number came from. Both are presentation. *(This supersedes the closing
line of `source-workbook-analysis.md`.)*

Storing them anyway is how both later workbooks lose most of the year, silently:

- **2025** — `Transposed for Pivot` covers 9 event names against 12 sheets. After
  matching typos, **five events are simply absent**: Grunnel Holiday Pt 3,
  Runeheim Reforged, Ravens Eye, Runeheim Revenged and Gamehole Con — **20,378 of
  50,471 pulls, 40% of the year** — while `v31`, which has no sheet at all,
  contributes 27 rows.
- **2026** — the pivot reads the `Condensed Total` row, so **the entire
  non-condensed population is dropped**, along with the 33 zeroed Rare/Uncommon
  pulls.

Neither failure is visible in the workbook. Both are impossible here, because
there is no second representation to fall out of sync with.

The same argument kills the dense long format. 2024's `rawPersonalStats` has
11,948 rows of which **8,758 (73%) are zero**. Store the 3,190 that carry a pull.

Analysis buckets — "Ultra Rare or Better", "Under Ultra Rare" — are a **display
layer only**, computed from canonical rarity at render time. Never persisted, never
in the model.

---

## 9. Status of each fact

| Fact | Standing |
|---|---|
| 27/10 → 30/10 scaling | **measured**, 8 tokens, 2026 |
| conversion arithmetic reproduces the condensed mix | **measured**, 0.2% on 1,780 items |
| conversion counts differ per year | **measured** — 2027's table mispredicts 2026 |
| breakpoint bonuses draw from the same pool | **measured** (flat by entitlement) + owner |
| Dwarven Steel / Minotaur Hide substitution | **open finding**, re-test in 2027 |
| 1,000 GP Bar 32% shortfall | **open finding**, nobody tracks it |
| condensed = 10 per max-treasure run, virtual only | owner |
| 10x Pull grants 10 standard draws | owner |
| pack substitute is a separate flat pool, 1/100 Ultra Rare | owner; **mix composition unknown** |
| chase variants are uniform | **company intention only** — unverified, and the reason variant grain stays available |

The pack-substitute stream is the cleanest thing in the project to deduce: one
flat pool, one item per draw, and a stated 1/100 Ultra Rare that is the **only
published rate in the entire domain**. If the method reproduces that 1%, every
unpublished rate the site produces earns credibility by association — which is
why it is in V1 rather than after it. It also yields `seat_runs` directly, the
one number the standard mix cannot supply.

Its **mix composition is unknown** — nobody knows whether it is flat over the
eight Trade 1 goods or over Trade 1 and Trade 2 together. That is a finding the
site produces, not an input it needs, and the two hypotheses are far enough apart
(12.5% vs ~8.3% per good) to separate on a season's data.

---

## 10. What is not yet decided

1. **The chase variant lists are blocked until after January 2027**, when the
   season's sets are revealed. The size of the gap is measurable: 2026 carries
   **68 `Treasure Chest Only` tokens** — 22 Rare and 46 `Quest` (Monster
   Trophies and chase pieces) — and 2027 currently carries **none**. That is
   late relative to the form, so the catalog must accept a chase *group* whose
   members do not exist yet, which `resolution` already allows and
   `status='proposed'` covers when they land.
2. **Rarity values needing a mapping decision.** tokendb uses `Quest` for
   Monster Trophies and chase pieces, which is not a rung of the canonical
   ladder, plus `Special` (the Golden Ticket, and the `3x`/`10x Treasure
   Chips`), `Premium` and `Paragon`. The fetcher already normalises
   `Transmuted-Enhanced (3 pt)` → `Enhanced` and its four siblings; these four
   are left as tokendb spells them, pending a decision.
3. **Team naming.** A short pick-list, per the owner — but the fold and the
   seed list still need authoring.
4. **`Woodies` and `Arcanum Sets`.** Two 2026 column names that are slang and a
   set-not-a-token respectively. Neither carries volume in the four events
   measured; both need a canonical spelling before entry starts.

*(The Common conversion counts were open here until 2026-09-19 and are now
sourced from tokendb — see § 2. They do not enter the estimate, since Commons are
in the treasure pool only by accident, but they are what let the Commons
explanation for Dwarven Steel and Minotaur Hide be tested and rejected.)*
