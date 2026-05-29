# Deploy checklist

## Free Truth Social monitoring (no Follow Trump's Truth)

The app uses **free RSS feeds** (default: [trumpstruth.org/feed](https://trumpstruth.org/feed)) — the same public mirror FTT aggregates, without a paid subscription.

**Near-real-time polling (every 15 min, free):**

1. GitHub repo → **Settings → Secrets and variables → Actions**
2. Add:
   - `APP_URL` = `https://political-trade-signals.vercel.app`
   - `CRON_SECRET` = same value as in Vercel
3. Enable Actions — workflow `.github/workflows/truth-poll.yml` runs automatically

That hits `/api/cron/truth-poll` → RSS ingest → Claude analyze → dashboard updates.

Vercel Hobby only allows **daily** crons; GitHub Actions bypasses that limit at no cost.

### Optional: free direct API (Truth Social account)

If you have a Truth Social login, copy your bearer token from browser devtools (`localStorage` → `truth:auth`) into `TRUTH_SOCIAL_ACCESS_TOKEN`. RSS remains the default.

### Paid options (skip these)

| Service | Cost |
|---------|------|
| Follow Trump's Truth webhook | Pro subscription |
| ScrapeCreators | Paid API |

---

## 1. Supabase

Run `supabase/schema.sql` in Supabase SQL Editor.

## 2. Vercel deploy

```bash
export VERCEL_TOKEN=...
node scripts/push-vercel-env.mjs
npx vercel --prod
```

Set `CRON_SECRET` on Vercel (used by GitHub Actions + manual tests).

## 3. Env vars

| Key | Required | Purpose |
|-----|----------|---------|
| `CRON_SECRET` | Yes | Auth for `/api/cron/*` |
| `ANTHROPIC_API_KEY` | Yes | Claude signal extraction |
| `SUPABASE_*` | Yes | Database (auto via Vercel Supabase link) |
| `TRUTH_SOCIAL_RSS_URL` | No | Default `https://trumpstruth.org/feed` |
| `NEWSAPI_KEY` | No | Extra headline source |
| `TWILIO_*` | No | SMS alerts |
| `FTT_WEBHOOK_SECRET` | No | Legacy paid webhook (not needed) |

## API routes

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/cron/truth-poll` | Bearer `CRON_SECRET` | **Free RSS poll + analyze** |
| `GET /api/cron/scrape` | Bearer `CRON_SECRET` | Full scrape (daily on Vercel Hobby) |
| `POST /api/webhooks/truth-social` | FTT signature | Optional paid instant push |

Test free poll:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://political-trade-signals.vercel.app/api/cron/truth-poll
```
