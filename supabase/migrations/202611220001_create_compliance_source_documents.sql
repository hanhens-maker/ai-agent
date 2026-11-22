create table public.compliance_source_documents (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('bwb', 'officiele_publicaties', 'acm')),
  source_identifier text not null,
  title text not null,
  document_kind text not null check (
    document_kind in ('regulation', 'acm_code', 'guidance', 'policy')
  ),
  version_key text,
  source_url text not null,
  document_url text,
  publication_date date,
  modified_at_source text,
  valid_from date,
  valid_to date,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (source, source_identifier, content_hash)
);

comment on table public.compliance_source_documents is
  'Versioned official source documents collected for trawa compliance research.';
comment on column public.compliance_source_documents.content_hash is
  'Stable hash excluding checked_at; a changed source creates a new version row.';

create index compliance_source_documents_lookup
  on public.compliance_source_documents (source, source_identifier, checked_at desc);

alter table public.compliance_source_documents enable row level security;

create policy "compliance_source_documents_public_read"
  on public.compliance_source_documents
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete, truncate, references, trigger
  on table public.compliance_source_documents
  from anon, authenticated;
grant select on table public.compliance_source_documents to anon, authenticated;
