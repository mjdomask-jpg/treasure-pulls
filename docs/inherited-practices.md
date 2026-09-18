# Inherited practices — what the auction project learned the hard way

Engineering practice borrowed from the sibling **auction price tracker**
(`C:\claude`), which has been in production on td-auctions.com for months and has
a long defect history this project can skip paying for. Nothing here is a game
fact — those are in the `td-domain` skill. Nothing here is a treasure-pull domain
fact either — those are in `domain-context.md`.

**Everything below was measured on that project's real data**, not proposed. Where
a number appears, it is the number that was counted, with the date it was counted.

The two projects share the skill and nothing else. Read
`C:\claude\CLAUDE.md` § *Where knowledge lives* before assuming a data shape
transfers — several deliberately do not, and the last section here lists them.

---

## 1. One item, one spelling — at two severities

The single most valuable pattern, because this project's whole input surface is
free text typed by many people, and its legacy workbook already carries
`Monter Bit` and `Sprit Pet`.

The auction project's `validate-prices.mjs` § 8 groups every item name twice and
reports at **two different severities**, because the two cases are not equally
certain:

| Difference | Severity | Why |
|---|---|---|
| **case or whitespace only** | **ERROR** | A typo by construction. Nobody means to record two things a reader cannot tell apart. |
| **punctuation, or a trailing plural** | **NOTE for a human** | Usually one item — but not always. |

**The reason the second one is never auto-merged**: `+1 Turkey Leg` and
`+1 Turkey Leg of Smiting` are two different tokens whose names contain one
another, and folding that pair would have collapsed 87 lots of the 2022 season
into a single price series.

**This is a measured defect, not a hypothetical.** A pass that *corrected* one
half of a name — `Folio: Brawn` to the official `Folio of X` — left
`Folio of Reflex` sitting beside `Folio of Reflexes`. A fix aimed at a split
created one, and the gate would have passed it.

**Two spellings are two series, each with half the history.** For deduction that
is worse than for pricing: a token split across two spellings halves its apparent
drop rate, and nothing in the output looks wrong.

**Apply it here as:** a check that runs over the whole token vocabulary — not per
form submission — grouping on a soft fold (lower-case, collapse whitespace,
normalise apostrophes) and a hard fold (strip non-alphanumerics, strip a trailing
`s`/`es`). Report the soft collisions as errors and the hard ones for review. Look
across *every* table that holds a token name, not just the pulls table: the
auction project found `Figurine of Power Phoenix` in one file and
`Figurine of Power: Phoenix` in another, a pair no single-file check could see.

## 2. The straight apostrophe is the rule, and never normalise apostrophes in a pipeline step

A curly apostrophe in a token name is an **ERROR**, not a note — unlike the
near-miss pairs above there is nothing to arbitrate. Names are spelled with the
straight one.

**But do not fold them mechanically.** `Thor’' Mug of Melee` carried a curly *and*
a straight apostrophe, and a mechanical fold gives `Thor''`. Resolvers may fold
apostrophes *for matching* — the auction project's does, which is the only reason
`Shaman's Belt` is findable — but the stored name is corrected by a human.

## 3. A dropdown does not stop a paste

The auction workbook has validation on every vocabulary column. It is backstopped
by the same vocabularies re-checked at the PR gate, for one reason: **a paste
bypasses sheet validation, and every routine update to that workbook is a paste.**

The browser analogue is direct. A `<select>` in the entry form constrains a person
typing into that form. It does not constrain an import, a URL parameter, a restored
draft, a bulk paste, or a future API write. **Validate where the data lands, not
only where it is entered.**

The rule that makes this cheap: it is **not an allow-list**. A genuinely new value
passes, with a note. What is never legitimate is a value differing from an existing
one only in case or whitespace. A validator that failed on a genuinely new event
name would block a legitimate update for doing nothing wrong — and a check that
blocks legitimate work gets switched off.

## 4. Provenance belongs on the ROW, not on the file

`C:\claude\backfill\order-composition.csv` is the model: 393 rows, each carrying

- `source` — `maintainer` or `thread`, i.e. who this number came from
- `agreement` — `CONFIRMED by 18 of 19 readable thread(s)`, or
  `THREADS DISAGREE — 1 of 1 say 8, not 7`
- `note` — free text, including *"The count here is a calculation, not official
  contents; either side may be wrong."*

That shape let disagreements be **surfaced and left open** instead of silently
resolved by whoever edited last. For pooled pull data from many reporters who will
disagree with each other, this is the schema to copy: a recorded value, where it
came from, and how much of the corpus backs it.

## 5. Unreconcilable is not unverified

When a check cannot examine something, it must say so — not fail it.

`onyxcheck.mjs` takes the rows it can *never* verify **out of the denominator,
each with its reason** (one auction's spreadsheet is gone; one bundle was split by
human judgement; one auction has no forum thread at all). The alternative was a
permanent score of 84/105, which **teaches the next person to hunt a bug that is
not there**.

The same principle, stated the other way, cost the auction project a blocked
publish on 2026-09-18: a recipe check treated *"I have no fixture for this"* as
*"this is wrong"*, and one new transmute produced five failures across three
sections while proving nothing. The fix was to triage first — unmapped is a NOTE
naming the remedy; only a thing that resolves and **disagrees** is a failure.

**A thing you cannot check is unverified, never incorrect.**

## 6. A bad reconciliation number is an instrument fault first

A reconciliation that comes back wrong by an **order of magnitude** is almost
always the measuring tool, not the data. The auction project lost a full season's
Onyx reconciliation to this: 59 of 361 rows matched, which looked like catastrophic
data loss and was in fact a trailing dash left by one string-strip running before
another. Fixing the instrument took it to 340/362, and a later pass to 378/378.

**Corollary: a strip that runs too early strands what the next transform uncovers.**
Order matters in a normalisation chain, and nothing tells you it is wrong except an
implausible number.

## 7. Pool with quantity-weighted MODE, and flag ties rather than break them

Measured across 32 forum threads and 22 different auctioneers, reconstructing
prices from prose:

| Rule | Items reproduced (of 576) |
|---|---|
| **Quantity-weighted mode** | **513** |
| Minimum | 435 |
| Maximum | 405 |

**Ties are flagged, never broken.** The plan going in assumed "ties go low, and
that is settled". The recorded corpus splits **8 low, 5 high, 1 midpoint** — so it
is not settled, and a tie broken by floating-point comparison silently picked the
wrong reading more than once.

This is the pooling rule for *this* project's central problem: many players
reporting the same event, disagreeing. Take the most common value, weighted by
quantity; when two values tie, surface it rather than pick.

## 8. Names a script invents are checked by nothing

`forumClose.gs` wrote the item name `Random UR` into the pipeline. The shipped CSV
holds that string **zero** times, against 21 rows spelled `Random Ultra Rare`.
Nothing caught it, because the one auction that would have exercised the path had
been transcribed by hand before the importer existed.

**A name a script generates is unverified until the day it is first used.** If code
here will ever synthesise a token name, an event name or a player key, assert it
against the existing vocabulary at the point it is written, not at the point it is
read.

Related, and from the same project: **a measurement taken on dummy data is not
evidence about the world**, and **a value nobody displays is a value nobody
checks**.

## 9. Pin tests to STRUCTURE, not to values

Six times now a check in the auction repo has blocked a legitimate data update
while proving nothing — a pinned row count, a mutation case keyed on a dollar sign
the export happened to drop, corpus tallies in a test that was not a data test at
all (one cloned recipe broke eleven assertions).

The rule that came out of it: **assert the shape, assert the invariant, and prove
the loosened check still catches the bug it was written for.** A test pinned to a
count or a formatted value is a hard block on real data reaching the site, and it
shows up as a red check on the update, so it looks like the update is broken.

This matters here from the first data gate onward, because this project's data is
*supposed* to grow every event.

## 10. A validator can be calibrated ON the defect it should catch

A carve-out written to explain an anomaly can end up **blessing** it. The auction
project's price validator had a rule saying one auction's 40 rows were "two sets"
— a carve-out with exactly one occupant, which is as likely to be the bug as the
rule. It was the bug.

**Grep for an existing check before proposing one**, and treat any exemption whose
population is one as unexplained rather than explained.

## 11. Diff everything the change touched, not the part you prepared

A paste into one tab of the auction workbook changed *other* published files,
because a withheld-item column is a query over the price tab and rollups sit above
that. A prices-only update carried nine metadata cells and six context cells
nobody typed.

And the sharper version: **the defect this kind of data produces most often is a
row keyed to the wrong parent**, and no validator can see it. The fix is to diff
the whole sweep after applying findings, not only the rows you set out to change.

---

## Questions already answered — do not re-derive these

**Can a player's existing collection be imported from an outside community site,
rather than re-entered here?** **Investigated and answered — no, not
automatically.** The verdict, the measurements behind it, and the one remaining
option are written up in the auction project's backlog as `PIPE-4` and `PIPE-5`
(`C:\claude\site\docs\backlog.md`).

**Read that before designing any import feature**, and note three conclusions that
carry over without needing the detail:

- The blocker is ordinary browser security working as intended, not a bug and not
  something to engineer around. A static site with no backend cannot read another
  site's authenticated response.
- **Any design that collects a community member's password for another site is
  ruled out on principle, not on difficulty**, and stays ruled out however it is
  re-framed. If that idea resurfaces here, it has already been decided.
- **`Monster Trophy` is absent from the other site's catalogue entirely**, so the
  token this project most wants to cross-reference could never import even in the
  best case.

**Is a bookmarklet a fallback?** Only on desktop. Bookmarklets do not work on
phones, and much of this community's traffic is on one.

> **Deliberately non-specific.** The site, its owner and the technical particulars
> are left out of this public repository until that owner has actually been asked
> — `PIPE-5` is open and the conversation has not happened. Restore the detail
> here once it has, or leave the pointer and keep the specifics in the auction
> project's backlog, which is private.

---

## What does NOT transfer

Listed explicitly, because the temptation is to reuse working code from a sibling
project that shares a domain.

| | Why not |
|---|---|
| **The static-site architecture** | The auction site is read-only with no per-user state; every statistic is derived on demand from checked-in CSVs. This project takes writes and needs identity. None of its publish pipeline applies. |
| **`src/lib/categories.ts`** | That list is the **auction sale axis** — how a lot was *sold* in a group buy. It has no meaning for a loot drop. Already flagged in `domain-context.md`. |
| **`categories-and-colors.md` as-is** | It colours the sale axis, not the rarity ladder. A rarity-colour table for the main ladder does not exist in either project yet; it would have to be authored. |
| **`auctionStyle` / `completionStyle` vocabularies** | Order-shape vocabulary. No counterpart here. |
| **Identity handling** | The auction site has none to copy — it stores no per-user state at all. The "no full login, pick your name from a list" decision in `domain-context.md` stands on its own. |

---

## One operational warning

`C:\claude\site` is **shared with other concurrent sessions and moves between
branches without notice.** Measurements taken from it are measurements of a branch
at a moment. Two reads minutes apart genuinely can disagree — that happened during
the review that produced this document, when another session committed a rename
mid-pass.

**Quote the branch and the date with any number taken from it**, and settle a
surprise with `git -C C:\claude\site log --oneline -3 -- <path>` before assuming
you misread.
