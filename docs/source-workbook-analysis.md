# Legacy workbook analysis

Source: `2024 Treasure Pull Records.xlsx` — the current Google Sheets workflow,
one workbook per year. Inspected 2026-08-19 (openpyxl). All figures below are
measured from the file, not estimated.

## Shape

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

## What the new site inherits

- The `tokenCategories` mapping, minus typos, minus the assumption that its
  buckets are canonical (see `domain-context.md`).
- The distinction between high-level counts and the detailed per-token breakdown
  — `Transposed for Pivot` carries a `Total Type` column of `High Level` vs
  detail, and `rawPersonalStats` a `Type` of `Normal` (1,732) vs `Special`
  (10,216). Both distinctions need explicit modeling rather than a column
  convention.
