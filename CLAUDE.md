# Treasure Pulls

A web form for True Dungeon players to record their loot drops, replacing the
per-year Google Sheets workbook the community currently uses. The purpose of the
data is to **deduce the mix of a given year's treasure**, which the company does
not publish.

## Where knowledge lives

- **General True Dungeon domain** — tokens, rarity, tiers, trade goods,
  transmuting, seasons vs event years — is in the **`td-domain` skill**
  (`~/.claude/skills/td-domain/`). Load it before reasoning about game concepts.
  It is the authority for game facts; do not re-derive them here.
- **This project's domain** — how treasure pulls are recorded, per-event
  structure, the community's analysis buckets — is in `docs/domain-context.md`.
- **The legacy workbook** it replaces is analyzed in
  `docs/source-workbook-analysis.md`.
- **The stack, and the alternatives rejected** — Cloudflare Pages + Pages
  Functions + D1, what carries over from the auction project's build and what
  deliberately does not, and the consequences the write endpoint has to be
  designed against — is in `docs/stack.md`.
- **Engineering practice inherited from the auction project** — name hygiene,
  where to validate, row-level provenance, how to pool disagreeing reporters, and
  which of its patterns deliberately do *not* transfer — is in
  `docs/inherited-practices.md`. Read it before designing the data gate or the
  entry form. It also points at the questions already answered over there, so they
  do not get re-derived — including whether a player's collection can be imported
  from an outside site. **That section is deliberately non-specific because this
  repository is public**; the detail lives in the auction project's backlog.

The sibling **auction price tracker** lives at `C:\claude`. The two projects share
the `td-domain` skill and nothing else — do not copy its data shapes, category
lists, or UI code without checking they mean the same thing here. They often
don't. `docs/inherited-practices.md` § *What does NOT transfer* is the list of the
ones that look reusable and are not.

**That working copy is shared with other Claude sessions and moves between
branches without notice.** Any fact read out of it is a fact about one branch at
one moment; quote the branch and date, and check
`git -C C:\claude\site log --oneline -3 -- <path>` when two reads disagree.

## Status

Pre-implementation. Nothing built yet; this directory holds staged findings from
the design discussion of 2026-08-19, plus the stack decision of 2026-09-18.

Next up, in dependency order: the data model, then seed vocabularies as CSVs,
then the name-hygiene validator (which needs no UI and no database), then the
entry form.
