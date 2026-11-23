# Module: Market rules radar

Dutch energy-market rules, each mapped to the process trawa must build. First module of the dashboard ("environmental radar").

## Route
`app/market-rules/page.tsx`

## Related contracts

- `docs/contracts/data-contract.md`
- `docs/contracts/api-contract.md`

## Current prototype data

Table `market_rules` (migration in `supabase/migrations/`, data in `supabase/seed/market_rules.sql`).
v1 content comes from the prototype at `/prototypes/nl-market-rules.html` (16 rules).

| Field | Type | Rule |
|---|---|---|
| id | text | `R01`, `R02`… never reuse |
| title | text | max ~8 words |
| kind | enum | `must` (trawa must comply) or `opp` (client rule trawa can sell into) |
| process | enum | `licence`, `risk`, `balancing`, `data`, `billing`, `customer`, `reporting`, `sales` |
| status | enum | `in_force` or `coming` |
| key_date | date | null if ongoing |
| impact | enum | `high` (blocks go-live or core margin), `medium` (needed in year one), `low` (watch) |
| rule_text | text | what the rule says, 1–3 sentences |
| impact_text | text | what it means for trawa, 1–2 sentences |
| steps | text[] | process steps trawa builds, 2–4 items |
| sources | jsonb | `[{label, url}]`, at least one |
| check | boolean | true if any source is secondary |
| checked_at | date | when sources were last checked |

This shape is legacy UI data.

It is not the target backend contract.

## Backend transition

The target UI reads the DTOs in `docs/contracts/data-contract.md` through the endpoints in `docs/contracts/api-contract.md`.

| UI area | Target data |
|---|---|
| Needs attention | Open `ActionItem` records |
| Supplier prerequisites | Verified requirement summaries for licence, balancing, data and billing |
| Market rules radar | Paginated `ComplianceRequirementSummary` records |
| Expanded rule | `ComplianceRequirementDetail` loaded on demand |
| Regional grid | `ComplianceOverview.processes` aggregates |

Compatibility rules:

- Filters and search run through the API.
- Do not filter only the currently loaded page.
- The type filter is removed because sales opportunities are outside the compliance contract.
- `active` renders as “In force”.
- `upcoming` renders as “Coming”.
- `effectiveFrom` renders as the key date.
- `relevanceSummary` renders below the title.
- `description` is literal source text.
- Action status replaces the local requirement checkbox.
- Viewer controls are read-only; mutation controls require `capabilities.canUpdateActions`.
- Primary source data renders in lists; full citations render in expanded detail.
- Loading, empty, error, retry and conflict behavior follows the API contract.

## Design contract decision

Do not add a separate design contract yet.

This module doc owns the screen and interaction intent.

The data and API contracts own backend compatibility.

Add a design contract only when multiple modules reuse a complex component or interaction pattern.

## Rules for this module

- In the prototype, `rule_text` states the source and `steps` are suggested work.
- In the target UI, `description` is literal evidence and `actions` are operational work.
- Target backend scope: B2B electricity only (SME + mid-market).
- The current “Power + gas” UI label must change before backend integration.
- Target filters: process, activity, impact, lifecycle and search.
- Sales opportunities do not use the compliance endpoint.
- Lifecycle changes come from reviewed source evidence, not from a client-side date check.
