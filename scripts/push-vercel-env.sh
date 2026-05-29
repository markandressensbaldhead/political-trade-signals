#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_FILE="${1:-$ROOT/.env.local}"

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Missing $SECRETS_FILE"
  exit 1
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN."
  echo "Create one at https://vercel.com/account/tokens then run:"
  echo "  export VERCEL_TOKEN=your_token"
  echo "  bash scripts/push-vercel-env.sh"
  exit 1
fi

PROJECT_ID="${VERCEL_PROJECT_ID:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Fetching project ID for political-trade-signals..."
  PROJECT_ID=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
    "https://api.vercel.com/v9/projects/political-trade-signals" | \
    node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.id||'')})")
fi

if [[ -z "$PROJECT_ID" ]]; then
  echo "Could not resolve Vercel project ID. Run 'vercel link' first or set VERCEL_PROJECT_ID."
  exit 1
fi

set -a
source "$SECRETS_FILE"
set +a

add_env() {
  local key="$1"
  local value="$2"

  if [[ -z "$value" || "$value" == your_* || "$value" == *"_here" ]]; then
    echo "Skipping empty/placeholder $key"
    return
  fi

  echo "Setting $key..."
  curl -s -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?upsert=true" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(node -e "
      console.log(JSON.stringify({
        key: process.argv[1],
        value: process.argv[2],
        type: 'encrypted',
        target: ['production', 'preview', 'development']
      }))
    " "$key" "$value")" > /dev/null
}

add_env ANTHROPIC_API_KEY "${ANTHROPIC_API_KEY:-}"
add_env SUPABASE_URL "${SUPABASE_URL:-}"
add_env SUPABASE_ANON_KEY "${SUPABASE_ANON_KEY:-}"
add_env SUPABASE_SERVICE_ROLE_KEY "${SUPABASE_SERVICE_ROLE_KEY:-}"
add_env NEWSAPI_KEY "${NEWSAPI_KEY:-}"
add_env CRON_SECRET "${CRON_SECRET:-}"
add_env FTT_WEBHOOK_SECRET "${FTT_WEBHOOK_SECRET:-}"
add_env TRUTH_SOCIAL_RSS_URL "${TRUTH_SOCIAL_RSS_URL:-}"
add_env TRUTH_SOCIAL_USERNAMES "${TRUTH_SOCIAL_USERNAMES:-}"
add_env TRUTH_SOCIAL_ACCESS_TOKEN "${TRUTH_SOCIAL_ACCESS_TOKEN:-}"
add_env SCRAPECREATORS_API_KEY "${SCRAPECREATORS_API_KEY:-}"
add_env TWILIO_ACCOUNT_SID "${TWILIO_ACCOUNT_SID:-}"
add_env TWILIO_AUTH_TOKEN "${TWILIO_AUTH_TOKEN:-}"
add_env TWILIO_PHONE_FROM "${TWILIO_PHONE_FROM:-}"
add_env TWILIO_PHONE_TO "${TWILIO_PHONE_TO:-}"

echo ""
echo "Done. Redeploy:"
echo "https://vercel.com/dashboard → political-trade-signals → Deployments → Redeploy"
