# Legacy workbook analysis

Source: the current Google Sheets workflow, one workbook per year.
`2024 Treasure Pull Records.xlsx` inspected 2026-08-19; the **2025 and 2026**
workbooks inspected 2026-09-18 (openpyxl throughout). All figures are measured
from the files, not estimated.

**The three workbooks are three different formats**, not three years of one — see
*The later workbooks* below. Everything from here to that section describes 2024.

## Shape (2024)

**28 sheets.**

| Group | Sheets |
|---|---|
| Event entry | `V20`–`V26`, `Gen Con`, `Origins`, `Gamehole Con`, `Holiday Special 2` (11) |
| Per-event rollup | one `<Event> Summary` each (11) |
| Cross-event | `Full Year Summary`, `Full Year by Event`, `Personal totals` |
| Reference | `tokenCategories` (36 tokens → bucket) |
| Plumbing | `Transposed for Pivot` (359 rows), `rawPersonalStats` (11,948 rows) |

### Event entry sheets — wide format

| Row | Content |
|---|---|
| 1 | Warnings — "Do not edit cells in grey", "Got bonus trade goods with…" |
| 2 | Headers |
| 3 | `Totals` |
| 4 | `Percentages` |
| 5+ | One row per player |

`V26` is 1,623 rows × 50 columns for 41 players. Columns run: `Player`,
`Total Pulls`, high-level counts (`Rare`, `Uncommon`, `50 GP Idol`,
`Monster Bits`, `Total Other`), percentage columns (`Idol %`, `MB %`, `Other %`,
`Other ≥ UR %`), then one column per specific token.

**15 of the 50 columns have no header** — blank slots held open for tokens not
yet seen. This is a schema migration performed by leaving room.

## Defects found in the 2024 file

These are the concrete failure modes the new site removes. Both are live in the
reference workbook.

### 1. `V25` is missing from the long-format mirror

`V25` holds **5,081 pulls across 45 players — the largest event in the workbook**.
`rawPersonalStats` jumps V24 → V26 and contains no V25 rows at all:

```
V20 1773 · V21 2727 · V22 1512 · V23 1512 · V24 1372 · V26 1148
Origins 112 · Gen Con 448 · Gamehole Con 364 · Holiday Special 2 980
```

The manual wide→long transpose was never run for it, so every pivot built on
`rawPersonalStats` silently under-counts by the single biggest event. Nothing in
the workbook flags the gap.

### 2. Four Summary tabs carry the wrong title

`A1` was never updated after the tab was duplicated:

| Sheet | `A1` says |
|---|---|
| `V25 Summary` | `V24` |
| `V26 Summary` | `V24` |
| `Gamehole Con Summary` | `V24` |
| `Holiday Special 2 Summary` | `V24` |

`Gen Con Summary`, `Origins Summary`, and `V20`–`V24 Summary` are correct.

### 3. Typos in reference data

`tokenCategories` contains **`Monter Bit`** (Monster Bit) and **`Sprit Pet`**
(Spirit Pet). Normalize rather than port.

## The structural problems to solve

Named in the design discussion, all confirmed by the file:

- **Entry orientation fights analysis orientation.** Entry is naturally one row
  per player with a column per token; analysis needs one row per
  (token, player, event, quantity). The workbook maintains both by hand —
  `Transposed for Pivot` and `rawPersonalStats` are manual mirrors, and defect 1
  is what happens when that step is skipped once.
- **Group editing over shared formulas.** Totals and percentage rows sit directly
  above player rows in the same grid, protected only by a grey fill and a
  note in row 1.
- **Per-event named ranges.** Every new event means duplicating a tab and
  re-pointing ranges by hand — the origin of defect 2.
- **Free-text player names** as the identity key.
- **A new workbook every year**, so cross-year comparison has no home at all.

## The later workbooks

Inspected 2026-09-18. The format is not stable across years:

| | 2024 | 2025 | 2026 |
|---|---|---|---|
| Sheets | 28 | 29 | 22 |
| Event sheets | 11 | 12 | 6 |
| Columns per event sheet | 50 | 34 | 53 |
| Event naming | `V20`–`V26` | V-numbers **and** named adventures | named adventures only |
| `Condensed (Y/N)` column | — | — | **yes** |
| Trade goods | two totals | two totals | **11 itemised**, abbreviations in row 1 |
| `rawPersonalStats` | 11,948 rows | **`#REF!`** | **`#REF!`** |

### 4. The per-person long format is gone

`rawPersonalStats` contains nothing but `#REF!` in both 2025 and 2026. The only
surviving long format is `Transposed for Pivot`, which has no person dimension —
so **neither year has per-player data at all**, only per-event totals. 2024's
`Personal totals` and `rawPersonalStats` have no counterpart in either.

### 5. The 2025 pivot is missing 40% of the year

`Transposed for Pivot` carries 9 event names against 12 event sheets. Three are
typo'd variants of real sheets (`v30`→`V30`, `Runehem Ravaged`→`Runeheim
Ravaged`, `Patron Run`→`April Patron Run`), one (`v31`, 27 rows) has no sheet at
all, and `Origins` is split across `Origins` (22 rows) and `Origns` (5).

Five events are simply absent:

| Missing event | pulls |
|---|---|
| Grunnel Holiday Pt 3 | 4,891 |
| Runeheim Reforged | 4,676 |
| Ravens Eye | 4,606 |
| Runeheim Revenged | 4,369 |
| Gamehole Con | 1,836 |
| **total** | **20,378 of 50,471 — 40%** |

This is defect 1 again, five times over, in a single year.

### 6. The 2026 pivot reads the condensed totals only

Of the 44 tokens the pivot carries per event, the **condensed-only** figure
matches 42/44, 43/44, 44/44 and 43/44 for the four events that have both
treatments. The non-condensed population is dropped from the year's analysis.

### 7. The `Condensed Total` row hard-zeroes Rare and Uncommon

Reconciling `Tower of Blood (Jan)`'s own total row against the 55 player rows it
summarises, exactly two columns disagree: `Rare` (row says 0, players say 29) and
`Uncommon` (0 against 4). Its components therefore sum to 1,541 against its own
`Total Pulls` of 1,574 — **33 pulls in the data and in no breakdown**, and via
defect 6 they leave the year entirely.

Condensed treasure genuinely excludes standard-pack Rare and Uncommon; what it
does not exclude is treasure-box-only Rares. One column cannot say both, so the
total row asserts the rule and the data quietly disagrees.

### 8. Mistitled summary tabs, again

`Tower of Blood Summary - Non-Co` and `Tower of Blood Summary - Conden` both
carry `Grunnel Holiday Pt 3` in A1 — a **2025** event name, inherited by
duplicating last year's tab. Three 2026 summary tabs are named `Sheet14`,
`Sheet15`, `Sheet16`. 2025 carries a `Copy of Grunnel Holiday Pt 3 Su` tab.

### 9. The `Trade Good Distribution sheet` never existed

Row 1 of every 2024 event sheet reads *"Help track the trade good rate on the
Trade Good Distribution sheet!"*. **No such sheet exists in any of the three
workbooks.** The 2026 format solves that problem a different way, by itemising
11 trade goods into their own columns — and the dangling instruction is simply
gone from the 2025 and 2026 row 1.

## What the new site inherits

- The `tokenCategories` mapping, minus typos, minus the assumption that its
  buckets are canonical (see `domain-context.md`). Note the 2026 sheet's
  `Category` column has absorbed two more axes — it now emits `Trade 1` and
  `Trade 2` alongside the analysis buckets.
- **Not** the high-level/detail distinction. `Transposed for Pivot`'s
  `Total Type` and `rawPersonalStats`'s `Type` record which part of the wide
  sheet a number came from and nothing else, and the totals reconcile exactly
  from the itemised columns, so there is no residue to model. Measured and
  written up in `data-model.md`; this supersedes an earlier claim here that both
  distinctions needed explicit modeling.
