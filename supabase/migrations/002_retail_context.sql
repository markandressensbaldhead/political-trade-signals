-- Migration 002: retail trader context fields
alter table public.company_signals
  add column if not exists speaker text,
  add column if not exists action_note text;
