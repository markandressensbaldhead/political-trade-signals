# Deploy checklist

Complete these once, then the system runs automatically.

## 1. Supabase (5 min)

1. Create a project at https://supabase.com/dashboard (or reuse an existing one)
2. SQL Editor → paste **`supabase/schema.sql`** → Run
3. Settings → API → copy:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Paste into `.env.local`

## 2. Local run

```bash
cd ~/Desktop/political-trade-signals
npm install
npm run dev
```

Open http://localhost:3000/dashboard

## 3. Vercel deploy

```bash
npm i -g vercel   # if needed
vercel link       # create/link project "political-trade-signals"
export VERCEL_TOKEN=...   # vercel.com/account/tokens
bash scripts/push-vercel-env.sh
vercel --prod
```

**Cron** (`/api/cron/scrape` every 10 min) requires **Vercel Pro**.

Set `CRON_SECRET` in Vercel — Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron requests.

## 4. Follow Trump's Truth webhook (instant)

Pro plan required at https://www.followtrumpstruth.com

1. Deploy first so you have a public HTTPS URL
2. Dashboard → Integrations → Add endpoint:
   ```
   https://YOUR-DOMAIN.vercel.app/api/webhooks/truth-social
   ```
3. Copy the **secret key** shown once
4. Set `FTT_WEBHOOK_SECRET` in `.env.local` and Vercel:
   ```bash
   bash scripts/push-vercel-env.sh
   vercel --prod
   ```
5. Click **Test** in FTT Integrations

When Trump posts, FTT pushes to your webhook → Claude analyzes → signals appear on dashboard + optional Twilio SMS.

## 5. Optional keys

| Key | Purpose |
|-----|---------|
| `NEWSAPI_KEY` | Headline scraper (newsapi.org) |
| `TWILIO_*` | SMS alerts on high-confidence signals |
| `TRUTH_SOCIAL_ACCESS_TOKEN` | Direct Truth Social API (optional) |
| `SCRAPECREATORS_API_KEY` | Paid Truth Social fallback |

## API reference

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /api/cron/scrape` | Bearer `CRON_SECRET` | Cron: scrape + analyze |
| `POST /api/webhooks/truth-social` | `X-Ftt-Signature` | Instant Truth Social posts |
| `POST /api/scrape` | none | Manual scrape |
| `POST /api/analyze` | none | Manual analyze |

Manual cron test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR-DOMAIN.vercel.app/api/cron/scrape
```
