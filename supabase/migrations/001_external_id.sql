-- Run once if raw_statements already exists without external_id
alter table public.raw_statements
  add column if not exists external_id text unique;

create index if not exists raw_statements_external_id_idx
  on public.raw_statements (external_id);
