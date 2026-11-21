# Module: Market rules radar

Dutch energy-market rules, each mapped to the process trawa must build. First module of the dashboard ("environmental radar").

## Route
`app/market-rules/page.tsx`

## Data
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

## Rules for this module
- `rule_text` states the source. `steps` are our suggestion: label them as such in the UI.
- Scope assumptions (confirm before widening): B2B only (SME + mid-market), power and gas.
- Key filters in the UI: process, kind, status, search.
- When a `key_date` passes, update `status` and re-check the source.
