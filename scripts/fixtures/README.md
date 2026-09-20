# Measurement fixtures

Aggregates measured from the source workbooks, committed so that
`check_conversion.mjs` runs in CI on a machine that does not have them.

**The workbooks themselves are gitignored (`*.xlsx`) and are not in this repo.**
They live on the maintainer's machine; the paths are in this project's memory
directory rather than here, because this repository is public.

## `2026_treatment_totals.csv`, `2026_trade_good_items.csv`

Measured **2026-09-19** from `2026 Treasure Pull Records.xlsx` with `py` +
`openpyxl` 3.1.5, `data_only=True`.

**Scope: the four 2026 events that carry both treatments** — `Tower of Blood
(Jan)`, `Mists of Madness (Feb)`, `Order of the Dawn (Mar)` and `Through Fear and
Fog (August)`. `Gen Con` and `Scarlet Moon Masquerade` carry the Condensed column
but have zero condensed rows, so they contribute no comparison and are excluded.

Counts are sums over **leaf token columns only**. The four rollup columns
(`Total Pulls`, `Total Other`, `Total Trade 1`, `Total Trade 2`) and the five
percentage columns (`Golem %`, `Herald's %`, `MB %`, `Other %`, `Other ≥ UR %`)
are excluded — including the percentage columns is how an earlier pass got
non-integer item totals.

Sheet layout gotchas, all of which cost time once: **row 2 is the header row**,
not row 1 (row 1 holds trade-good abbreviation codes over columns 43–53); rows
3–6 are rollups; **player rows start at row 7**; the `Total Pulls` header contains
an **embedded newline**, so match headers on `" ".join(str(v).split())`; sheet
text contains `≥`, which crashes cp1252 stdout on this box.

Good names here are the **canonical** spellings, not the workbook's column
headers — the workbook says `1,000 GP Bar` where the canonical name is
`1,000 GP Gold Bar`.

**Re-measuring is expected to change these numbers only if the workbook changes.**
It is a living Google Sheets export, so state the date of any refresh here.
