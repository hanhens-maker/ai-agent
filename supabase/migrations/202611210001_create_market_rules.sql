create type public.market_rule_kind as enum ('must', 'opp');
create type public.market_rule_process as enum (
  'licence',
  'risk',
  'balancing',
  'data',
  'billing',
  'customer',
  'reporting',
  'sales'
);
create type public.market_rule_status as enum ('in_force', 'coming');
create type public.market_rule_impact as enum ('high', 'medium', 'low');

create table public.market_rules (
  id text primary key check (id ~ '^R[0-9]{2,}$'),
  title text not null,
  kind public.market_rule_kind not null,
  process public.market_rule_process not null,
  status public.market_rule_status not null,
  key_date date,
  impact public.market_rule_impact not null,
  rule_text text not null,
  impact_text text not null,
  steps text[] not null check (cardinality(steps) between 2 and 4),
  sources jsonb not null check (
    jsonb_typeof(sources) = 'array'
    and jsonb_array_length(sources) > 0
  ),
  "check" boolean not null default false,
  checked_at date not null
);

comment on table public.market_rules is
  'Dutch energy-market rules and the processes trawa needs to build.';
comment on column public.market_rules.steps is
  'Suggested implementation steps for trawa; these are not source quotations.';
comment on column public.market_rules."check" is
  'True when at least one source is secondary and the rule needs verification.';

alter table public.market_rules enable row level security;

create policy "market_rules_public_read"
  on public.market_rules
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete, truncate, references, trigger
  on table public.market_rules
  from anon, authenticated;
grant select on table public.market_rules to anon, authenticated;
