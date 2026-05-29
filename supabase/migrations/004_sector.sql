-- Migration 004: sector tagging on company_signals
alter table public.company_signals
  add column if not exists sector text;
