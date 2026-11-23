# AGENTS.md

Rules for every agent in this repo (Claude Code, Codex, Cursor). Read this first, then the doc for the module you work on.

## Project
GTM Netherlands dashboard for trawa, a German B2B energy supplier entering the Dutch market.
Users: trawa's Netherlands launch team (view only for now).
Goal: show which Dutch rules, processes and market signals trawa needs to go live in NL.

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres) for module data
- Hosted on Vercel

## Structure
```
app/                  routes; one folder per module (app/market-rules/)
components/           shared UI
lib/                  Supabase client, shared types, helpers
supabase/migrations/  schema changes (SQL, one file per change)
supabase/seed/        data per module (SQL or JSON)
docs/                 module docs: read before you work on a module
```

## Modules
Working on a module? Read its doc first.
- Market rules radar → `docs/market-rules.md`
- Repository boundaries or system flow → `docs/Architecture.md`
- Frontend design or backend integration that renders dashboard data → `docs/frontend-design-contract.md`
- Market rules frontend or data integration → also read `docs/contracts/data-contract.md` and `docs/contracts/api-contract.md` before changing UI or data access. The contracts are proposed; migrations and APIs described there are not implemented unless present in the repo.
- New module → copy the shape of `docs/market-rules.md` and add a line here

## Commands
```bash
npm run dev        # local preview
npm run lint
npm run typecheck
npm run build
```

## How you work
- Work on a branch. Open a PR. Never push to `main`.
- Never write to the live Supabase database. Data and schema change only through files in `supabase/migrations/` and `supabase/seed/`. A repository maintainer applies them.
- Every table has Row Level Security on. Today: public read, no write. Design so edit roles (Fardau, Vincent) can be added later without a rebuild.
- Never commit secrets. Keys live in `.env.local` (git-ignored) and Vercel settings.

## Before each task
- Run `git fetch origin`, then check if this branch is behind origin/main.
- If it is: commit or stash your own work first, then `git merge origin/main`.
- Never use reset --hard, checkout -- or stash drop. Never discard uncommitted work.
- On a merge conflict: stop and ask me. Don't resolve it on your own.

## Coordinating across worktrees
- After fetching, check the changed files in open PRs for overlap with the files you plan to edit. Use a draft PR to share work another agent depends on before it lands on `main`.
- The frontend agent owns layout, styling and interactions. The data agent owns collection, extraction and mapping records into the agreed component props. Preserve the existing design when connecting data. If an open frontend PR changes those props, coordinate the mismatch on that PR before editing the shared component.
- When a data shape changes, include a sample record, the affected component and a link to the relevant contract in the PR. Request frontend confirmation that the component can render the sample.

## After each task
- Commit, push the branch and open a PR. Don't sync again.

## Before you open a PR
1. `npm run lint`, `npm run typecheck`, `npm run build` all pass.
2. Screenshot every page you changed (desktop and phone width) and add it to the PR.
3. PR description: what changed, why, which sources you used.

## Sources
- Never invent a rule, number, date or requirement. No source, no item.
- Official first: ACM, RVO, Belastingdienst, TenneT, GTS, Rijksoverheid, wetten.overheid.nl, EUR-Lex.
- Secondary sources (news, comparison sites, advisers) are allowed but must be flagged `check: true`.
- Store the source URL and the date you checked it with every item.

## Writing
- English. Keep Dutch legal terms (salderingsregeling, Energiewet, energiebesparingsplicht) with a short English gloss the first time.
- Slide-short. One idea per line. No fluff, no marketing words.
- Name things the way trawa would: "business customers", "connection", "supplier licence".
