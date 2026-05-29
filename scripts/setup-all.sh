#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMA="$ROOT/supabase/schema.sql"
MIGRATION="$ROOT/supabase/migrations/001_external_id.sql"

echo "=== Political Trade Signals — setup ==="
echo ""

if [[ -z "${SUPABASE_DB_URL:-}" && -z "${DATABASE_URL:-}" ]]; then
  echo "Step 1: Supabase schema (manual if no DATABASE_URL)"
  echo "  Open https://supabase.com/dashboard → SQL Editor"
  echo "  Paste and run: $SCHEMA"
  echo "  If tables already exist, also run: $MIGRATION"
  echo ""
else
  echo "Step 1: Applying schema via psql..."
  DB_URL="${SUPABASE_DB_URL:-$DATABASE_URL}"
  psql "$DB_URL" -f "$SCHEMA"
  psql "$DB_URL" -f "$MIGRATION" || true
  echo "Schema applied."
  echo ""
fi

echo "Step 2: Install dependencies"
echo "  cd $ROOT && npm install"
echo ""

echo "Step 3: Push env to Vercel"
echo "  export VERCEL_TOKEN=..."
echo "  bash scripts/push-vercel-env.sh"
echo ""

echo "Step 4: Deploy"
echo "  npx vercel --prod"
echo ""

echo "Step 5: Follow Trump's Truth webhook (instant alerts)"
echo "  URL: https://YOUR-DOMAIN/api/webhooks/truth-social"
echo "  Dashboard: https://www.followtrumpstruth.com → Integrations"
echo "  Paste FTT_WEBHOOK_SECRET from FTT into .env.local + Vercel"
echo ""

echo "Step 6: Cron runs automatically every 10 min (Vercel Pro required)"
echo "  Path: /api/cron/scrape"
echo "  Auth: CRON_SECRET (Vercel injects Bearer header)"
echo ""

if [[ -f "$ROOT/.env.local" ]]; then
  echo "Local .env.local exists."
  grep -E '^(ANTHROPIC|SUPABASE_URL|CRON_SECRET|FTT_)' "$ROOT/.env.local" | sed 's/=.*/=***/' || true
fi
