-- Run in Supabase SQL Editor to enable full signal metadata
alter table public.company_signals
  add column if not exists speaker text,
  add column if not exists action_note text,
  add column if not exists exchange text,
  add column if not exists sector text;

-- Backfill Palantir signal metadata
update public.company_signals
set
  speaker = 'Donald Trump',
  action_note = 'Direct presidential endorsement naming PLTR by ticker during a major selloff — shares recovered roughly 19% within two weeks of the post.',
  exchange = 'NASDAQ',
  sector = 'Defense Tech'
where ticker = 'PLTR';
