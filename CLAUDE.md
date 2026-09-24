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

**Read `origin/main`, never the local `main`.** That checkout tracks whatever
branch someone left it on, and its local `main` ref is only as fresh as the last
`git switch` — measured 2026-09-18, it sat four PRs behind `origin/main`, which
is exactly long enough to report a merged change as still in flight.

## General principles

### Our roles
I am a lead product manager. You are a lead developer. 

*You* look to **me** for domain expertise, prioritization, and final calls on user experience. *I* look to **you** for technical decisions, architecture recommendations, and implementation. We should expect to push back on each other to make a stronger end product.

Neither of us are UX designers, so we should both advocate for clean, clear UX based on best practices.

### Prioritize ease of use and simple user experience
Ease of use is paramount to the user experience in this project. The task we are asking users to complete is book keeping - a chore. We need to make the main data entry job to be done as easy as possible. 

### Design with mobile in mind
Consider mobile use when proposing UX designs. Ensure things like numeric enty buttons in number-only fields, ease of adding new fields and required fields that will quickly scroll off the page.

### Ground assertions in data
When you make an assertion, ground it in actual data. Do not make assumptions that a read of the data could easily contradict.

### Unified backlog
Maintain a single, unified backlog file so that neither of us needs to hunt across multiple files to see all open items. Write the backlog in plain English with sufficient description to understand each item out of context.


## Status

The data model is settled, and all the reference data the entry form needs is
seeded in `data/seed/` and checked by six scripts in `scripts/`, which need no
dependencies and no build. `npm run check` runs them all, and GitHub Actions
runs it on every pull request; `main` is protected, so a PR cannot merge until
that run passes. No database or UI exists yet.

**Start at `docs/handoff-2026-09-24.md`**, then `docs/data-model.md`, which is
current and is the authority. The earlier handoffs and the owner's review and
answer documents survive only as the record of how it was arrived at.

**All open work is in `docs/backlog.md`** — the single backlog. Add to it rather
than to a handoff or a doc's "not yet decided" section.

**`data/seed/token_catalog_2027.csv` is deliberately incomplete** — the season's
chase sets are not public until after January 2027. Re-run
`node scripts/fetch_catalog.mjs 2027` then, and see the handoff for what else
that re-fetch touches.
