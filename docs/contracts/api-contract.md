# Compliance reporting API contract — proposal

Status: proposed for frontend/backend agreement.

No `/api/v1/*` route handler is implemented.

The related domain model and evidence rules are in [data-contract.md](data-contract.md).

## Purpose

Give the dashboard a stable boundary over Supabase without exposing database rows, collector metadata or service-role access to the browser.

Next.js route handlers own:

- request validation;
- authentication and authorization;
- database-to-DTO mapping;
- pagination and filter semantics;
- transaction calls for reviews and action updates;
- consistent errors and request IDs.

## Conventions

- Base path: `/api/v1`.
- JSON property names use camelCase.
- Database columns remain snake_case.
- UUIDs are strings.
- Dates use `YYYY-MM-DD`.
- Timestamps use RFC 3339 UTC.
- Enum values use lowercase snake_case.
- Unknown query parameters return `400 INVALID_FILTER`.
- Responses include a request ID and generation timestamp.

## Response envelopes

Single resource:

```json
{
  "data": {},
  "meta": {
    "requestId": "request-id",
    "generatedAt": "2026-11-23T12:00:00Z"
  }
}
```

Collection:

```json
{
  "data": [],
  "pageInfo": {
    "nextCursor": null,
    "hasNextPage": false
  },
  "meta": {
    "requestId": "request-id",
    "generatedAt": "2026-11-23T12:00:00Z"
  }
}
```

Error:

```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "The activity filter is invalid.",
    "requestId": "request-id",
    "details": {}
  }
}
```

`details` is optional and must not expose secrets, SQL or internal stack traces.

## Resource DTOs

The TypeScript DTO definitions in the [frontend contract](data-contract.md#frontend-contract) are part of this proposal.

The public resources are:

| Resource | Purpose |
|---|---|
| `ComplianceOverview` | Dashboard totals and collection health |
| `ComplianceRequirementSummary` | Published requirement card |
| `ComplianceRequirementDetail` | Requirement, citations, actions and audit trail |
| `RegulatoryChangeSummary` | Change-review inbox row |
| `RegulatoryChangeDetail` | Version comparison and candidates |
| `RequirementCandidate` | Source passage awaiting review |
| `ActionItem` | Internal operational checklist row |
| `ActionItemDetail` | Action, parent requirement and audit trail |
| `SourceCitation` | Exact versioned evidence shown to the user |
| `AuditEvent` | Append-only state-change record |

`description` and `quotedText` contain literal source text.

The API does not return an `isCompliant` field.

## Read endpoints

| Endpoint | Purpose | Filters |
|---|---|---|
| `GET /api/v1/compliance/overview` | Counts, action progress and collection health | `activity` |
| `GET /api/v1/requirements` | Published requirement cards | `process`, `activity`, `impact`, `lifecycleStatus`, `relevanceStatus`, `effectiveOn`, `search`, `cursor`, `limit`, `sort` |
| `GET /api/v1/requirements/:id` | Requirement, citations, actions and audit trail | none |
| `GET /api/v1/regulatory-changes` | Change-review inbox | `reviewStatus`, `changeKind`, `source`, `detectedFrom`, `detectedTo`, `search`, `cursor`, `limit`, `sort` |
| `GET /api/v1/regulatory-changes/:id` | Changed passages, versions and candidates | none |
| `GET /api/v1/requirement-candidates` | Candidate-review inbox | `reviewStatus`, `activity`, `changeId`, `cursor`, `limit` |
| `GET /api/v1/action-items` | Internal checklist | `status`, `ownerUserId`, `requirementId`, `activity`, `dueBefore`, `dueAfter`, `cursor`, `limit`, `sort` |
| `GET /api/v1/action-items/:id` | Action, requirement and audit trail | none |
| `GET /api/v1/source-documents/:id` | Document identity and current-version metadata | `includeVersions=true|false` |
| `GET /api/v1/collection-runs` | Collection history and errors | `status`, `cursor`, `limit` |

### Requirement defaults

`GET /api/v1/requirements` returns only records with:

- `reviewStatus=verified`;
- `relevanceStatus=relevant`;
- `lifecycleStatus=active|upcoming`.

Historical or superseded evidence requires an authorized audit request and is never mixed into the default feed.

### Pagination

- `limit` defaults to 25 and is capped at 100.
- `cursor` is opaque.
- The cursor contains the selected sort key and the record ID.
- Offset pagination is not exposed.
- A cursor cannot be reused with different filters or sort order.

### Filters

- Multiple values for one enum filter are comma-separated and use OR semantics.
- Different filter keys use AND semantics.
- Date filters use `YYYY-MM-DD`.
- Search covers title, literal description and source title.
- Invalid values return `400 INVALID_FILTER`.

Example: `activity=supply,manage&impact=high`.

### Sort values

| Resource | Allowed values |
|---|---|
| Requirements | `impact_desc`, `effective_from_asc`, `updated_at_desc` |
| Regulatory changes | `detected_at_desc`, `document_title_asc` |
| Action items | `due_date_asc`, `updated_at_desc` |

The first value in each row is the default.

## Authorized mutation endpoints

| Endpoint | Body | Result |
|---|---|---|
| `POST /api/v1/regulatory-changes/:id/review` | `{ decision, reason?, expectedRevision }` | Updates review state and appends an audit event |
| `POST /api/v1/requirement-candidates/:id/review` | `{ decision, reason?, expectedRevision }` | Confirms into a verified requirement or dismisses the candidate |
| `PATCH /api/v1/action-items/:id` | `{ status?, ownerUserId?, dueDate?, reason?, expectedRevision }` | Updates checklist state and appends an audit event |

`decision` is `confirm` or `dismiss`.

Mutation rules:

- Resolve the actor from the Supabase session.
- Require reviewer or admin authorization for review decisions.
- Require a reason for dismissals and `not_applicable` actions.
- Require `expectedRevision` for optimistic locking.
- Return `409 CONFLICT` for a stale revision.
- Change state and append the audit event in one transaction or RPC.
- Never accept changes to quoted source text from the client.
- Completing all actions never declares trawa compliant.

## Authorization

| Role | Access |
|---|---|
| `viewer` | Published read endpoints |
| `reviewer` | Viewer access plus reviews and action updates |
| `admin` | Reviewer access plus future role and system administration |

The role model is proposed.

No authenticated mutation may ship until Supabase Auth, role claims and matching RLS/server checks exist.

## Status codes

| Status | Code | Use |
|---|---|---|
| `400` | `INVALID_FILTER` or `INVALID_BODY` | Request validation failed |
| `401` | `UNAUTHENTICATED` | No valid session |
| `403` | `FORBIDDEN` | Session lacks the required role |
| `404` | `NOT_FOUND` | Resource is absent or not visible to the caller |
| `409` | `CONFLICT` | `expectedRevision` is stale |
| `422` | `INVALID_STATE` | Transition violates a workflow rule |
| `500` | `INTERNAL_ERROR` | Unexpected server failure |
| `503` | `DEPENDENCY_UNAVAILABLE` | Required upstream service is unavailable |

## Versioning

- `/api/v1` changes only in backward-compatible ways.
- Adding an optional field is backward-compatible.
- Removing or renaming a field, enum value or endpoint requires a new API version.
- The shared TypeScript DTO module becomes the compile-time source of truth when implementation starts.

## Not implemented

- API route handlers;
- shared DTO module in `lib/`;
- Supabase query adapters;
- authentication and roles;
- normalized review and action tables;
- transaction RPCs;
- scheduled collection-run API data.

Do not present sample DTOs as verified legal or production data.
