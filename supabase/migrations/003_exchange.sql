-- Migration 003: exchange on company_signals
alter table public.company_signals
  add column if not exists exchange text;
