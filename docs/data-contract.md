# Compliance reporting data contract — proposal

Status: proposed for frontend/backend agreement. No schema or API implementation is included.

## Purpose

Give trawa one electricity-compliance overview for its full-stack activities:

- supply;
- manage (portal, metering and market data);
- flex (batteries, PV, heat pumps and CHP control);
- trading (day-ahead, intraday, futures, PPAs and balancing services).

The reporting workflow runs quarterly. It must separate official source evidence from reviewed requirements and operational action items.

## Non-negotiable evidence rules

- `description` and every citation excerpt contain literal source text. They are not summaries.
- Historical or expired sources may be retained for audit, but they are never used to create or display a current requirement.
- Do not use the Elektriciteitswet 1998, Gaswet or ACM policies published before 1 January 2026 as current evidence.
- Every displayed requirement, change and action item has at least one source URL.
- A requirement says only that an obligation appears relevant to trawa. It never claims that trawa is compliant or non-compliant.
- Failed or unexpectedly empty collection runs are recorded as failures. They never produce guessed records or automatic removals.
- Gas-only documents are outside scope. A mixed electricity/gas document may be in scope when its electricity provisions apply.

## Existing implementation reviewed

### `market_rules`

The first migration combines the rule, interpretation, suggested steps and sources in one row. That shape is useful for the current card UI, but it cannot provide versioned provenance, review state or an audit trail.

Important gaps:

- `rule_text` currently permits summaries; the new contract requires a literal quotation.
- `sources` stores URLs but not the exact source version, locator or quoted passage.
- `impact_text` and `steps` are mixed into the legal record even though they are internal relevance and operational work.
- `check` cannot represent pending, confirmed and dismissed reviews.
- there is no persistent action completion state or reviewer history.

Existing rows must not be promoted automatically. Each must be re-linked to a current source version and checked against the literal-text rule.

### `compliance_source_documents`

The collector migration is a useful ingestion ledger. It already stores source identifiers, URLs, dates, metadata, a stable content hash and `checked_at`.

It currently combines a logical document and a fetched version in one table. A future migration can split those concepts without discarding data:

- group existing rows by `(source, source_identifier)` to create logical documents;
- convert each unique `content_hash` row into an immutable document version;
- retain `checked_at` as evidence of when that version was observed.

The collector currently stores metadata and a link to the full XML/PDF. Requirement extraction must not begin until the referenced full text has been fetched and its exact passage and locator are available.

### Frontend

The Next.js App Router currently imports static `MarketRule[]` mock data directly into `MarketRulesDashboard`. There is no Supabase client, route handler or authenticated write path.

The proposed API returns camelCase DTOs. Database names and collector-specific XML fields stay server-side.

## Proposed data model

```text
CollectionRun
  └─< RegulatoryDocument
        └─< RegulatoryDocumentVersion
              ├─< RegulatoryChange
              │     └─< RequirementCandidate
              └─< RequirementSource >─ ComplianceRequirement
                                          └─< ActionItem

ReviewEvent / AuditEvent append to changes, candidates, requirements and actions.
```

### 1. Collection runs

One record per quarterly collector execution.

| Field | Purpose |
|---|---|
| `id` | UUID for the run |
| `scope` | Electricity, B2B, and the included trawa activities |
| `started_at`, `completed_at` | Operational timestamps |
| `status` | `running`, `succeeded`, `partial`, `failed` |
| `documents_found` | Count used for empty-result checks |
| `errors` | Structured source errors; never converted to rules |
| `collector_version` | Code/config version that produced the run |

A zero-result run is `failed` unless the configured scope explicitly expects zero records.

### 2. Regulatory documents

A stable identity for an official publication across versions.

| Field | Purpose |
|---|---|
| `id` | Internal UUID |
| `source` | `bwb`, `officiele_publicaties`, or `acm` |
| `source_identifier` | Stable upstream ID, such as a BWB identifier |
| `official_title` | Title supplied by the source |
| `source_url` | Canonical public page; required |
| `document_kind` | `regulation`, `acm_code`, `guidance`, `policy` |
| `scope_status` | `in_scope`, `out_of_scope`, `needs_scope_review` |
| `first_seen_at`, `last_checked_at` | Discovery timestamps |

Unique identity: `(source, source_identifier)`.

### 3. Regulatory document versions

An immutable snapshot of a document at a particular source version.

| Field | Purpose |
|---|---|
| `id` | Internal UUID |
| `document_id` | Parent regulatory document |
| `source_version_key` | BWB state URI, publication expression URI, or ACM modified timestamp |
| `content_hash` | Hash of normalized full content, excluding collection timestamps |
| `source_published_at` | When the authority published this version |
| `effective_from`, `effective_to` | Legal validity when supplied by the source |
| `checked_at` | When the collector verified it |
| `content_url` | Exact XML/PDF/HTML version URL |
| `raw_content` or `storage_path` | Immutable fetched source content |
| `is_current` | Server-derived current-version flag |
| `collection_run_id` | Run that first observed the version |

Historical versions remain available for audit but are excluded from current requirement endpoints.

### 4. Regulatory changes

A mechanical comparison between two versions. A change is not automatically a legal obligation.

| Field | Purpose |
|---|---|
| `id` | Internal UUID |
| `document_id` | Changed document |
| `from_version_id` | Previous version; nullable for a new document |
| `to_version_id` | Newly detected version |
| `change_kind` | `added`, `text_changed`, `metadata_changed`, `withdrawn` |
| `before_text`, `after_text` | Literal changed passages, not summaries |
| `source_locator` | Article/section/path for the changed passage |
| `detected_at` | Detection timestamp |
| `review_status` | `pending`, `confirmed`, `dismissed` |
| `reviewed_at`, `reviewed_by` | Latest review outcome |
| `revision` | Optimistic concurrency counter |

`withdrawn` is created only after a successful complete collection proves removal or expiry. It is never inferred from a failed or empty response.

### 5. Requirement candidates

A candidate connects a detected source passage to trawa's operating scope. It is not visible as a verified requirement.

| Field | Purpose |
|---|---|
| `id` | Internal UUID |
| `change_id` | Change that triggered extraction; nullable for initial backfill |
| `version_id` | Current source version |
| `title` | Short internal display title |
| `description` | Literal source quotation |
| `source_locator` | Article/section/path |
| `relevant_activities` | Any of `supply`, `manage`, `flex`, `trading` |
| `relevance_note` | Internal reason it appears relevant; not a compliance conclusion |
| `review_status` | `pending`, `confirmed`, `dismissed` |
| `created_at`, `reviewed_at`, `reviewed_by` | Workflow timestamps |
| `revision` | Optimistic concurrency counter |

Confirming a candidate creates or updates a verified compliance requirement in one transaction.

### 6. Compliance requirements

Only reviewed, current and source-backed obligations belong here.

| Field | Purpose |
|---|---|
| `id` | Stable UUID used by the frontend |
| `title` | Reviewed display title |
| `description` | Literal source quotation; never a summary |
| `process` | `licence`, `risk`, `balancing`, `data`, `billing`, `customer`, `reporting`, `sales` |
| `activities` | `supply`, `manage`, `flex`, `trading` |
| `impact` | `high`, `medium`, `low`; operational priority, not legal severity |
| `lifecycle_status` | `active`, `upcoming`, `superseded` |
| `relevance_status` | `relevant`, `needs_scope_confirmation`, `out_of_scope` |
| `review_status` | `verified`, `dismissed`; only verified records are published by default |
| `effective_from`, `effective_to` | Source effectiveness dates |
| `reviewed_at`, `reviewed_by` | Verification evidence |
| `created_at`, `updated_at` | Record timestamps |
| `revision` | Optimistic concurrency counter |

There is deliberately no `is_compliant` field.

### 7. Requirement sources

Many-to-many provenance between requirements and document versions.

| Field | Purpose |
|---|---|
| `requirement_id` | Verified requirement |
| `version_id` | Exact current document version |
| `source_url` | Required public URL, denormalized for safe rendering |
| `source_title` | Official source title |
| `source_locator` | Article, section, page or XML path |
| `quoted_text` | Literal text supporting the requirement |
| `source_published_at` | Authority publication date |
| `effective_from`, `effective_to` | Source validity dates |
| `checked_at` | Last source check timestamp |
| `is_primary` | Identifies the main citation |

A database constraint should require at least one citation before a requirement can become `verified`.

### 8. Action items

Operational checklist work connected to a verified requirement.

| Field | Purpose |
|---|---|
| `id` | Stable UUID |
| `requirement_id` | Parent verified requirement |
| `title` | Concrete internal task |
| `description` | Internal execution detail, clearly separate from source text |
| `status` | `not_started`, `in_progress`, `blocked`, `completed`, `not_applicable` |
| `owner_user_id` | Authenticated assignee; nullable |
| `due_date` | Internal deadline; distinct from legal effective date |
| `completed_at`, `completed_by` | Completion evidence |
| `created_at`, `updated_at` | Record timestamps |
| `revision` | Optimistic concurrency counter |

Completing every action does not automatically declare trawa compliant.

### 9. Review and audit events

Append-only events record every state mutation.

| Field | Purpose |
|---|---|
| `id` | Event UUID |
| `entity_type`, `entity_id` | Reviewed change, candidate, requirement or action |
| `action` | `confirmed`, `dismissed`, `status_changed`, `assigned`, `completed`, `reopened` |
| `from_state`, `to_state` | JSON snapshots of changed fields |
| `reason` | Required for dismissals and `not_applicable` actions |
| `actor_user_id` | Supabase Auth user from the server session |
| `created_at` | Immutable event timestamp |

## Frontend contract

Database rows use snake_case. API DTOs use camelCase and ISO-8601 strings.

```ts
export type UUID = string;
export type ISODate = string;      // YYYY-MM-DD
export type ISODateTime = string;  // RFC 3339 UTC timestamp

export type SourceKind = "bwb" | "officiele_publicaties" | "acm";
export type DocumentKind = "regulation" | "acm_code" | "guidance" | "policy";
export type TrawaActivity = "supply" | "manage" | "flex" | "trading";
export type RequirementProcess =
  | "licence"
  | "risk"
  | "balancing"
  | "data"
  | "billing"
  | "customer"
  | "reporting"
  | "sales";
export type Impact = "high" | "medium" | "low";
export type RequirementLifecycle = "active" | "upcoming" | "superseded";
export type RelevanceStatus = "relevant" | "needs_scope_confirmation" | "out_of_scope";
export type RequirementReviewStatus = "verified" | "dismissed";
export type ChangeKind = "added" | "text_changed" | "metadata_changed" | "withdrawn";
export type ReviewStatus = "pending" | "confirmed" | "dismissed";
export type ActionStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "completed"
  | "not_applicable";

export interface SourceCitation {
  documentId: UUID;
  versionId: UUID;
  source: SourceKind;
  sourceIdentifier: string;
  sourceTitle: string;
  sourceUrl: string;
  contentUrl: string | null;
  locator: string | null;
  quotedText: string;
  sourcePublishedAt: ISODate | null;
  effectiveFrom: ISODate | null;
  effectiveTo: ISODate | null;
  checkedAt: ISODateTime;
  primary: boolean;
}

export interface ActionProgress {
  total: number;
  completed: number;
  blocked: number;
}

export interface ComplianceOverview {
  requirements: {
    active: number;
    upcoming: number;
    needsScopeConfirmation: number;
  };
  actions: ActionProgress;
  pendingChanges: number;
  lastSuccessfulCollectionAt: ISODateTime | null;
  nextScheduledCollectionAt: ISODateTime | null;
}

export interface ComplianceRequirementSummary {
  id: UUID;
  title: string;
  description: string; // literal source quotation
  process: RequirementProcess;
  activities: TrawaActivity[];
  impact: Impact;
  lifecycleStatus: RequirementLifecycle;
  relevanceStatus: RelevanceStatus;
  reviewStatus: RequirementReviewStatus;
  effectiveFrom: ISODate | null;
  effectiveTo: ISODate | null;
  primarySource: SourceCitation;
  actionProgress: ActionProgress;
  reviewedAt: ISODateTime;
  updatedAt: ISODateTime;
  revision: number;
}

export interface ComplianceRequirementDetail
  extends ComplianceRequirementSummary {
  relevanceNote: string | null;
  sources: SourceCitation[];
  actions: ActionItem[];
  auditTrail: AuditEvent[];
}

export interface RegulatoryChangeSummary {
  id: UUID;
  documentId: UUID;
  documentTitle: string;
  sourceUrl: string;
  changeKind: ChangeKind;
  beforeText: string | null;
  afterText: string | null;
  locator: string | null;
  detectedAt: ISODateTime;
  reviewStatus: ReviewStatus;
  reviewedAt: ISODateTime | null;
  reviewedBy: UUID | null;
  candidateCount: number;
  revision: number;
}

export interface RegulatoryChangeDetail extends RegulatoryChangeSummary {
  fromVersion: {
    id: UUID;
    contentUrl: string | null;
    sourcePublishedAt: ISODate | null;
    effectiveFrom: ISODate | null;
    effectiveTo: ISODate | null;
    checkedAt: ISODateTime;
  } | null;
  toVersion: {
    id: UUID;
    contentUrl: string | null;
    sourcePublishedAt: ISODate | null;
    effectiveFrom: ISODate | null;
    effectiveTo: ISODate | null;
    checkedAt: ISODateTime;
  };
  candidates: RequirementCandidate[];
  auditTrail: AuditEvent[];
}

export interface RequirementCandidate {
  id: UUID;
  changeId: UUID | null;
  versionId: UUID;
  title: string;
  description: string; // literal source quotation
  sourceUrl: string;
  locator: string | null;
  activities: TrawaActivity[];
  relevanceNote: string | null;
  reviewStatus: ReviewStatus;
  createdAt: ISODateTime;
  reviewedAt: ISODateTime | null;
  reviewedBy: UUID | null;
  revision: number;
}

export interface ActionItem {
  id: UUID;
  requirementId: UUID;
  requirementTitle: string;
  sourceUrl: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  ownerUserId: UUID | null;
  dueDate: ISODate | null;
  completedAt: ISODateTime | null;
  completedBy: UUID | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  revision: number;
}

export interface ActionItemDetail extends ActionItem {
  requirement: Pick<
    ComplianceRequirementSummary,
    | "id"
    | "title"
    | "description"
    | "effectiveFrom"
    | "effectiveTo"
    | "primarySource"
  >;
  auditTrail: AuditEvent[];
}

export interface AuditEvent {
  id: UUID;
  entityType: "change" | "candidate" | "requirement" | "action";
  entityId: UUID;
  action: "confirmed" | "dismissed" | "status_changed" | "assigned" | "completed" | "reopened";
  fromState: Record<string, unknown> | null;
  toState: Record<string, unknown>;
  reason: string | null;
  actorUserId: UUID;
  createdAt: ISODateTime;
}

export interface PageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface Page<T> {
  data: T[];
  pageInfo: PageInfo;
  meta: {
    requestId: string;
    generatedAt: ISODateTime;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

export type ComplianceOverviewResponse = {
  data: ComplianceOverview;
  meta: Page<never>["meta"];
};
export type RequirementListResponse = Page<ComplianceRequirementSummary>;
export type RequirementDetailResponse = {
  data: ComplianceRequirementDetail;
  meta: Page<never>["meta"];
};
export type RegulatoryChangeListResponse = Page<RegulatoryChangeSummary>;
export type RegulatoryChangeDetailResponse = {
  data: RegulatoryChangeDetail;
  meta: Page<never>["meta"];
};
export type ActionItemListResponse = Page<ActionItem>;
export type ActionItemDetailResponse = {
  data: ActionItemDetail;
  meta: Page<never>["meta"];
};

export interface ReviewDecisionRequest {
  decision: "confirm" | "dismiss";
  reason?: string;
  expectedRevision: number;
}

export interface ActionItemPatchRequest {
  status?: ActionStatus;
  ownerUserId?: UUID | null;
  dueDate?: ISODate | null;
  reason?: string;
  expectedRevision: number;
}
```

## API endpoints

Use Next.js route handlers as the boundary between the UI and Supabase. The frontend must not query the proposed normalized tables directly.

### Read endpoints

| Endpoint | Purpose | Filters |
|---|---|---|
| `GET /api/v1/compliance/overview` | Counts, action progress, upcoming dates and last successful collection | `activity` |
| `GET /api/v1/requirements` | Published requirement cards | `process`, `activity`, `impact`, `lifecycleStatus`, `relevanceStatus`, `effectiveOn`, `search`, `cursor`, `limit`, `sort` |
| `GET /api/v1/requirements/:id` | Requirement detail, all citations, actions and audit trail | none |
| `GET /api/v1/regulatory-changes` | Change-review inbox | `reviewStatus`, `changeKind`, `source`, `detectedFrom`, `detectedTo`, `search`, `cursor`, `limit`, `sort` |
| `GET /api/v1/regulatory-changes/:id` | Changed passages, versions and candidates | none |
| `GET /api/v1/requirement-candidates` | Candidate-review inbox | `reviewStatus`, `activity`, `changeId`, `cursor`, `limit` |
| `GET /api/v1/action-items` | Company checklist | `status`, `ownerUserId`, `requirementId`, `activity`, `dueBefore`, `dueAfter`, `cursor`, `limit`, `sort` |
| `GET /api/v1/action-items/:id` | Action detail and audit trail | none |
| `GET /api/v1/source-documents/:id` | Raw document identity and current version metadata | `includeVersions=true|false` |
| `GET /api/v1/collection-runs` | Quarterly run history and errors | `status`, `cursor`, `limit` |

Defaults:

- `/requirements` returns only `reviewStatus=verified`, `relevanceStatus=relevant`, and `lifecycleStatus=active|upcoming`.
- expired/superseded evidence is never returned unless an authorized audit request explicitly asks for history.
- `limit` defaults to 25 and is capped at 100.
- cursor pagination is opaque and based on the selected sort key plus `id`; offset pagination is not exposed.
- multi-value enum filters use comma-separated values and OR semantics, for example `activity=supply,manage`.
- different filter keys use AND semantics. Date filters are ISO `YYYY-MM-DD`; invalid filters return `400 INVALID_FILTER`.
- searches cover title, literal description and source title. They do not search generated legal summaries because none are stored.

Recommended sort values:

- requirements: `impact_desc`, `effective_from_asc`, `updated_at_desc`;
- changes: `detected_at_desc`, `document_title_asc`;
- actions: `due_date_asc`, `updated_at_desc`.

### Authorized mutation endpoints

| Endpoint | Body | Result |
|---|---|---|
| `POST /api/v1/regulatory-changes/:id/review` | `{ decision: "confirm" | "dismiss", reason?: string, expectedRevision: number }` | Updates review state and appends an audit event |
| `POST /api/v1/requirement-candidates/:id/review` | `{ decision: "confirm" | "dismiss", reason?: string, expectedRevision: number }` | Confirm creates/updates a verified requirement; dismiss requires a reason |
| `PATCH /api/v1/action-items/:id` | `{ status?, ownerUserId?, dueDate?, reason?, expectedRevision }` | Updates checklist state and appends an audit event |

Mutation rules:

- resolve the actor from the authenticated Supabase session, never from request JSON;
- require reviewer/admin authorization for reviews;
- require a reason for dismissals and `not_applicable`;
- return `409 CONFLICT` when `expectedRevision` is stale;
- update state and insert the audit event in one database transaction/RPC;
- never allow a client to edit quoted source text.

## Change detection and review flow

1. A scheduled quarterly run creates a `CollectionRun`.
2. The collector resolves each stable source document and fetches its current full text.
3. If the run fails or unexpectedly returns zero records, it is marked failed and stops. Existing records remain current.
4. A previously unseen content hash creates an immutable `RegulatoryDocumentVersion`.
5. The server compares it with the prior current version and stores literal before/after passages in `RegulatoryChange`.
6. The change enters `reviewStatus=pending`. This means “the source changed,” not “the obligation changed.”
7. Extraction may create `RequirementCandidate` records containing literal passages and a non-legal relevance mapping to supply/manage/flex/trading.
8. An authorized reviewer confirms or dismisses the change and each candidate.
9. Confirming a candidate creates or updates a verified `ComplianceRequirement` with version-specific citations.
10. Verified requirements appear in the default dashboard feed. Dismissed candidates remain in the audit trail.
11. Operational `ActionItem` records form the checklist. Their completion state never changes the legal meaning of the requirement.

## Sample responses

Every response below is sample contract data, not a legal statement or a verified obligation.

### Compliance overview component — sample data

```json
{
  "data": {
    "requirements": { "active": 8, "upcoming": 2, "needsScopeConfirmation": 1 },
    "actions": { "total": 24, "completed": 9, "blocked": 2 },
    "pendingChanges": 1,
    "lastSuccessfulCollectionAt": "2026-10-01T06:30:00Z",
    "nextScheduledCollectionAt": "2027-01-01T06:30:00Z"
  },
  "meta": {
    "requestId": "sample-request-overview",
    "generatedAt": "2026-11-22T12:00:00Z"
  }
}
```

### Requirement card list — sample data

```json
{
  "data": [
    {
      "id": "50000000-0000-4000-8000-000000000001",
      "title": "Sample electricity-market requirement",
      "description": "SAMPLE DATA — a literal quotation from the cited current source version appears here.",
      "process": "data",
      "activities": ["supply", "manage"],
      "impact": "high",
      "lifecycleStatus": "active",
      "relevanceStatus": "relevant",
      "reviewStatus": "verified",
      "effectiveFrom": null,
      "effectiveTo": null,
      "primarySource": {
        "documentId": "10000000-0000-4000-8000-000000000001",
        "versionId": "20000000-0000-4000-8000-000000000001",
        "source": "bwb",
        "sourceIdentifier": "SAMPLE-BWB-ID",
        "sourceTitle": "Sample official source title",
        "sourceUrl": "https://wetten.overheid.nl/",
        "contentUrl": null,
        "locator": "Sample article locator",
        "quotedText": "SAMPLE DATA — exact source text would be stored here.",
        "sourcePublishedAt": null,
        "effectiveFrom": null,
        "effectiveTo": null,
        "checkedAt": "2026-11-22T09:00:00Z",
        "primary": true
      },
      "actionProgress": { "total": 3, "completed": 1, "blocked": 0 },
      "reviewedAt": "2026-11-22T10:00:00Z",
      "updatedAt": "2026-11-22T10:00:00Z",
      "revision": 1
    }
  ],
  "pageInfo": { "nextCursor": null, "hasNextPage": false },
  "meta": {
    "requestId": "sample-request-requirements",
    "generatedAt": "2026-11-22T12:00:00Z"
  }
}
```

### Regulatory-change inbox — sample data

```json
{
  "data": [
    {
      "id": "30000000-0000-4000-8000-000000000001",
      "documentId": "10000000-0000-4000-8000-000000000001",
      "documentTitle": "Sample official source title",
      "sourceUrl": "https://wetten.overheid.nl/",
      "changeKind": "text_changed",
      "beforeText": "SAMPLE DATA — literal text from the previous version.",
      "afterText": "SAMPLE DATA — literal text from the new version.",
      "locator": "Sample article locator",
      "detectedAt": "2026-10-01T06:35:00Z",
      "reviewStatus": "pending",
      "reviewedAt": null,
      "reviewedBy": null,
      "candidateCount": 1,
      "revision": 1
    }
  ],
  "pageInfo": { "nextCursor": null, "hasNextPage": false },
  "meta": {
    "requestId": "sample-request-changes",
    "generatedAt": "2026-11-22T12:00:00Z"
  }
}
```

### Action checklist — sample data

```json
{
  "data": [
    {
      "id": "60000000-0000-4000-8000-000000000001",
      "requirementId": "50000000-0000-4000-8000-000000000001",
      "requirementTitle": "Sample electricity-market requirement",
      "sourceUrl": "https://wetten.overheid.nl/",
      "title": "Sample: document the applicable operating procedure",
      "description": "SAMPLE DATA — internal execution detail, not quoted law.",
      "status": "in_progress",
      "ownerUserId": null,
      "dueDate": null,
      "completedAt": null,
      "completedBy": null,
      "createdAt": "2026-11-22T10:05:00Z",
      "updatedAt": "2026-11-22T10:05:00Z",
      "revision": 1
    }
  ],
  "pageInfo": { "nextCursor": null, "hasNextPage": false },
  "meta": {
    "requestId": "sample-request-actions",
    "generatedAt": "2026-11-22T12:00:00Z"
  }
}
```

### Requirement detail drawer — sample data

```json
{
  "data": {
    "id": "50000000-0000-4000-8000-000000000001",
    "title": "Sample electricity-market requirement",
    "description": "SAMPLE DATA — a literal quotation from the cited current source version appears here.",
    "process": "data",
    "activities": ["supply", "manage"],
    "impact": "high",
    "lifecycleStatus": "active",
    "relevanceStatus": "relevant",
    "reviewStatus": "verified",
    "effectiveFrom": null,
    "effectiveTo": null,
    "relevanceNote": "SAMPLE DATA — appears related to electricity supply and portal data flows; this is not a compliance conclusion.",
    "primarySource": {
      "documentId": "10000000-0000-4000-8000-000000000001",
      "versionId": "20000000-0000-4000-8000-000000000001",
      "source": "bwb",
      "sourceIdentifier": "SAMPLE-BWB-ID",
      "sourceTitle": "Sample official source title",
      "sourceUrl": "https://wetten.overheid.nl/",
      "contentUrl": null,
      "locator": "Sample article locator",
      "quotedText": "SAMPLE DATA — exact source text would be stored here.",
      "sourcePublishedAt": null,
      "effectiveFrom": null,
      "effectiveTo": null,
      "checkedAt": "2026-11-22T09:00:00Z",
      "primary": true
    },
    "sources": [],
    "actionProgress": { "total": 1, "completed": 0, "blocked": 0 },
    "actions": [],
    "auditTrail": [],
    "reviewedAt": "2026-11-22T10:00:00Z",
    "updatedAt": "2026-11-22T10:00:00Z",
    "revision": 1
  },
  "meta": {
    "requestId": "sample-request-requirement-detail",
    "generatedAt": "2026-11-22T12:00:00Z"
  }
}
```

## Decisions required before implementation

The frontend and backend agents must agree on these points before any migration or route handler is added.

| Decision | Recommendation | Dependency / consequence |
|---|---|---|
| Publication gate | Default UI shows only `verified` requirements | Auto-publishing unreviewed extraction would blur source changes and verified obligations |
| API boundary | Next.js `/api/v1/*` route handlers return camelCase DTOs | Prevents database schema leakage into components |
| Activities | Fixed enum: supply, manage, flex, trading | Matches `docs/company.md`; gas is excluded |
| Process taxonomy | Retain the existing eight process values for the first version | Avoids redesigning current filters; frontend can also filter by activity |
| Opportunities | Remove `kind=opp` from this compliance contract | Sales opportunities are not compliance obligations and need a separate future contract |
| Literal text | `description` and `quotedText` are exact source passages | Existing seed rows require re-verification before migration |
| Review roles | `viewer`, `reviewer`, `admin` through Supabase Auth | Current app has no auth or write policy; mutations cannot ship first |
| Action ownership | Decide whether actions are assigned to named users or teams | Determines whether `ownerUserId` is enough or a team table is needed |
| Audit retention | Append-only and retained indefinitely | Needed to explain dismissals, reopened tasks and version changes |
| Full-text storage | Store immutable source content in Supabase Storage and metadata in Postgres | Avoids oversized database rows while preserving reproducible evidence |
| Initial backfill | Re-review existing `market_rules`; do not copy them automatically | Current `rule_text` is not guaranteed to be literal text |
| Empty runs | Surface as a failed collection banner in the dashboard | Prevents missing upstream data from looking like regulatory removal |
| Quarterly schedule | Agree the exact timezone/date and retry policy | Contract examples assume a quarterly run, not a daily monitor |
| Optimistic locking | Use integer `revision` and return HTTP 409 on stale writes | Prevents reviewers from overwriting each other |

## Recommended first implementation slice after agreement

1. Freeze the TypeScript DTOs in a shared server/frontend module.
2. Add read-only route handlers backed by temporary adapter data.
3. Replace `MarketRule` mock imports with `/api/v1/requirements` and `/api/v1/compliance/overview`.
4. Add migrations for the normalized evidence, review and action entities only after the DTO review is accepted.
5. Add authenticated review/action mutations and audit events last.

This order lets the frontend validate the contract before the database design becomes costly to change.
