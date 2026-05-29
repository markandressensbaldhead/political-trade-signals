-- Political trade signal system schema
-- Run in Supabase SQL Editor or via psql

create extension if not exists "pgcrypto";

create table if not exists public.raw_statements (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  source text not null,
  content text not null,
  published_at timestamptz not null,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.company_signals (
  id uuid primary key default gen_random_uuid(),
  raw_statement_id uuid references public.raw_statements (id) on delete cascade,
  company_name text not null,
  ticker text not null,
  sentiment text not null check (sentiment in ('bullish', 'bearish', 'neutral')),
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  quote text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists raw_statements_external_id_idx
  on public.raw_statements (external_id);

create index if not exists raw_statements_processed_idx
  on public.raw_statements (processed, published_at desc);

create index if not exists raw_statements_published_at_idx
  on public.raw_statements (published_at desc);

create index if not exists company_signals_created_at_idx
  on public.company_signals (created_at desc);

create index if not exists company_signals_ticker_idx
  on public.company_signals (ticker);

alter table public.raw_statements enable row level security;
alter table public.company_signals enable row level security;

create policy "Allow public read on raw_statements"
  on public.raw_statements for select
  using (true);

create policy "Allow public read on company_signals"
  on public.company_signals for select
  using (true);

create policy "Allow service role insert on raw_statements"
  on public.raw_statements for insert
  with check (true);

create policy "Allow service role update on raw_statements"
  on public.raw_statements for update
  using (true);

create policy "Allow service role insert on company_signals"
  on public.company_signals for insert
  with check (true);
