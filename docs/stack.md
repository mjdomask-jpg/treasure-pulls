# Stack decision

Decided 2026-09-18. **Cloudflare Pages + Pages Functions + D1**, with a periodic
export of D1 back into CSVs committed to this repository.

This document records the alternatives that were rejected and why, because the
seductive wrong answer here is a good idea in the wrong place and will otherwise
be proposed again.

## The one thing this project needs that the auction project cannot do

The sibling auction site is static on GitHub Pages and has **no write path**. That
is not an unbuilt feature; it is recorded as a wall in three separate places in
its docs, most plainly at `docs/backlog.md:1374` —

> server-side save codes are *"Impossible, not unbuilt: static hosting on GitHub
> Pages has no write path, and a repo token in client JS would be public."*

The same constraint killed share codes for its shopping list, which fell back to
`localStorage`. **This project takes writes from many people and needs identity**,
so breaking that wall is the entire problem the stack has to solve. Everything
else about the auction project's setup is worth keeping.

## What carries over unchanged

Measured 2026-09-18 on `C:\claude\site`, branch `rune-giant-totem`:

| Piece | Version there | Keep? |
|---|---|---|
| Vite | 8 | Yes |
| React + react-dom | 19 | Yes |
| TypeScript | ~6.0 | Yes |
| oxlint | 1.x | Yes |
| Node engine | ≥24 | Yes |
| Validators / tests | plain `node scripts/*.mjs`, no framework | **Yes — this especially** |

No ORM, no test framework, no build magic. The validator-as-a-node-script pattern
is what makes `docs/inherited-practices.md` § 1-3 portable at all, so it is kept
deliberately rather than by inertia.

**`react-router` in Hash mode and `base: './'` are not inherited.** Both exist over
there solely because GitHub Pages serves that site from a repo subpath
(`vite.config.ts` says so in a comment). Cloudflare Pages serves from a root with
SPA fallback, so this project uses ordinary browser-history routing and an absolute
base. Do not copy the hash-routing workaround for a problem this project does not
have — note that the machine-level warning about `Page.navigate` and hash-only URL
changes stops applying here too.

## What is new

- **Cloudflare account and the `wrangler` CLI.** This is the whole cost of the
  decision, stated plainly. Nothing else in the toolchain changes.
- **Pages Functions** — the write endpoints, living in `functions/` in this repo
  and deploying with the same push that deploys the frontend.
- **D1** — the write store.

**D1 is SQLite, and that is the reason it was chosen over a hosted Postgres.**
`.gitattributes` already commits this repository to CSVs as the data spine "once
entry exists", and `inherited-practices.md` § 1 requires a name-hygiene check that
runs across *every* table holding a token name at once — the auction project found
`Figurine of Power Phoenix` in one file and `Figurine of Power: Phoenix` in
another, a pair no single-file check could see. An export of the whole database to
flat CSVs is what makes that check possible, and out of SQLite it is a query
rather than a migration.

So the data flow is: **entry → Function → D1 → periodic export → CSVs in git → the
existing `.mjs` validators run in CI.** The auction project's data gate ports over
to the exported files without modification.

## Alternatives rejected

| Option | Why not |
|---|---|
| **GitHub Pages frontend + a standalone Worker** | Works, and is the fallback if the Cloudflare move is ever regretted. Rejected only because it is two deploy targets and a CORS boundary for exactly the same result. |
| **Vercel + Supabase / Postgres** | A second vendor and a heavier database than a community of dozens needs. The largest event in the 2024 workbook was 5,081 pulls. |
| **Stay in Google Sheets with an Apps Script write API** | Reintroduces the failure modes `source-workbook-analysis.md` exists to remove. The auction project already runs Apps Script (`apps-script/`), so the familiarity is real — and § 8 there records `forumClose.gs` inventing the name `Random UR` and nothing catching it. |
| **Commit each submission straight to git** | See below. |

### Why not commit each submission to git

This is the appealing one and it should be written down as rejected, because every
argument for it is correct. The data spine would live in git with full history,
every row would carry a commit author, and CI would validate each submission at the
moment it arrived. It is the purest possible version of
`inherited-practices.md` § 4.

It fails on **concurrency and latency**, not on principle. A rebuild takes minutes,
and forty players entering pulls during a single Gen Con run would race each
other's commits against one branch. `V26` alone had 41 players.

**It is a good export mechanism and a bad write path.** The scheduled D1 → CSV
export is this idea, moved to where it works.

## Consequences to design against

**The no-login decision survives, but its threat model changes.**
`domain-context.md` settles identity as "no full login; pick your name from a
list", reasoning that the community is small and malicious behavior is handled
socially. That reasoning holds for a spreadsheet shared by link. **A public HTTP
write endpoint is discoverable in a way the Sheet never was.** The decision stands;
these come with it:

- **The pulls table is append-only.** No hard delete, ever — a correction is a new
  row that supersedes an earlier one. This costs nothing, because § 4 already
  requires every row to carry `source`, `agreement` and `note`.
- **Rate limiting in the Function**, not in the form. § 3 is the general form of
  this: *a dropdown does not stop a paste*, and a `<select>` constrains a person
  typing but not an import, a replayed request or a script.
- **Validate where the data lands.** The Function re-checks the vocabulary the form
  offered. Per § 3 this is **not an allow-list** — a genuinely new event or token
  passes with a note. A value differing from an existing one only in case or
  whitespace is **snapped to the existing spelling, not rejected**; the typed form
  is kept in `submitted_as`. **No data check ever refuses a submission**
  (`data-model.md` § 7, owner 2026-09-24). What the Function may refuse is abuse,
  such as rate-limited traffic or a request that is malformed and did not come
  from the form.
- **An admin-side revert**, since there is no delete and no login to gate one.

## Deliberately still open

- **Export cadence** — scheduled, on a trigger, or manual. Depends on how fresh
  the deduction pages need to be, which nobody has needed yet.
- **The schema itself.** Nothing above constrains it beyond "SQLite" and
  "append-only". The row shape belongs in a data-model document, and the fields it
  has to carry — event, event year separate from token vintage, the condensed and
  raw representations that must reconcile, and the § 4 provenance columns — are
  already settled in `domain-context.md`.
- **Free-tier quotas.** D1's published limits comfortably exceed this workload, but
  the exact numbers were not measured for this document. Check them before launch
  rather than quoting them from here.
