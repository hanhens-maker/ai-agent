# Frontend design contract

Status: accepted baseline for dashboard presentation and responsive behavior.

Last reviewed: 23 November 2026.

## Purpose

Protect the approved trawa dashboard design while backend data, APIs and Supabase schemas evolve.

Backend integration must replace the data source, not redesign the screen.

## Ownership boundary

The frontend owns:

- page structure and information hierarchy;
- component markup and interaction patterns;
- responsive behavior and breakpoints;
- colour, typography, spacing, gradients, borders, radii and shadows;
- loading, empty and error presentation;
- desktop and phone screenshot baselines.

Backend and data work owns:

- `app/api/` route handlers;
- server-only Supabase access;
- DTO mapping and adapters in `lib/`;
- validation, authorization and error mapping;
- migrations, RLS policies and seed data;
- source collection and evidence processing.

Backend work may change `app/market-rules/page.tsx` only to load data through the agreed API or adapter boundary. It must preserve the dashboard component's presentation contract.

## Protected frontend surfaces

Do not change these files during backend-only work:

- `components/market-rules-dashboard.tsx`;
- `components/icons.tsx`;
- visual rules and tokens in `app/globals.css`;
- `docs/screenshots/market-rules-desktop.png`;
- `docs/screenshots/market-rules-phone.png`.

An explicit design or frontend task may change them.

If a backend change needs different data, update the DTO, route handler and adapter first. Do not solve a data mismatch by removing UI sections, rewriting component markup or replacing styles.

## Dashboard invariants

Preserve these areas and interactions:

- Needs attention;
- Supplier prerequisites;
- Market rules radar;
- Regional grid layer;
- completion checkboxes or their API-backed action status equivalent;
- compact phone detail actions;
- search, filters and expandable rule details;
- source and evidence links.

The approved visual language uses:

- cream-white surfaces instead of neutral grey-white;
- trawa green colour tokens and gradients;
- green-tinted shadows and borders;
- rounded panels, controls and status pills;
- strong, compact dashboard typography;
- dense list treatment on phone and full metadata on desktop.

Do not replace the design with grayscale wireframe styling.

## Responsive contract

The dashboard is fluid between these Tailwind breakpoints:

| Breakpoint | Width | Expected behavior |
|---|---:|---|
| Base | below 640px | Compact inbox-style rows, icon-only detail action and horizontally scrollable data tables |
| `sm` | 640px | Roomier spacing and labelled detail actions |
| `md` | 768px | Full rule metadata and multi-column rule rows |
| `lg` | 1024px | Persistent desktop sidebar |
| `xl` | 1280px | Wider filter and content arrangement |

Do not make layouts depend on one fixed viewport width.

Use flexible columns, `minmax()`, truncation and overflow handling where content length varies.

Tables scroll horizontally on narrow screens rather than compressing columns until labels become unreadable.

## Mobile 8-point grid

Use an 8px baseline for phone layout geometry.

- Primary spacing: 8, 16, 24 and 32px.
- Compact control and row dimensions: multiples of 8 where practical.
- Panel radii: 8, 16 or 24px.
- A 4px half-step is allowed only for optical alignment or small internal gaps.
- Typography is not forced to multiples of 8, but line heights should align with the 8px rhythm where practical.
- Compact visible icons may sit inside a larger clickable area so the interface remains usable.

## Data integration rules

Follow `docs/contracts/data-contract.md` and `docs/contracts/api-contract.md`.

- Components consume camelCase DTOs, not database rows.
- Supabase and collector fields stay behind route handlers.
- Preserve the existing eight process values during the first backend integration.
- Map backend lifecycle and action states into the existing presentation instead of renaming or removing UI sections.
- Add loading, empty, error, retry and permission states in the established visual language.

## Change control

A PR may change the protected frontend only when its scope explicitly includes design or frontend behavior.

For every intentional visual change:

1. Explain the design change in the PR description.
2. Run lint, typecheck and build.
3. Capture and commit desktop and phone screenshots.
4. Embed both screenshots in the PR description.
5. Confirm that unchanged breakpoints have not regressed.

Backend-only PRs should state that the frontend design contract was preserved.
