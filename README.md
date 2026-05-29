# Political Trade Signals

AI-powered alerts when public figures mention companies before official disclosure windows.

## Stack

- Next.js 14, Tailwind CSS, Supabase, Claude
- **Truth Social** (RSS + optional Mastodon token)
- NewsAPI headlines
- Twilio SMS alerts
- **Vercel Cron** (every 10 min)

## Setup

```bash
npm install
cp .env.example .env.local
# fill in keys
```

Run `supabase/schema.sql` in Supabase SQL Editor.

If the table already exists, also run `supabase/migrations/001_external_id.sql`.

```bash
npm run dev
```

## Truth Social sources

Priority order:

1. **Mastodon API** — set `TRUTH_SOCIAL_ACCESS_TOKEN` (Bearer token from Truth Social)
2. **ScrapeCreators** — set `SCRAPECREATORS_API_KEY` (paid fallback)
3. **RSS (default)** — `TRUTH_SOCIAL_RSS_URL=https://trumpstruth.org/feed` for @realDonaldTrump

Optional: `TRUTH_SOCIAL_USERNAMES=realDonaldTrump,otherHandle`

## Vercel Cron

`vercel.json` runs `/api/cron/scrape` every **10 minutes**.

On Vercel, add:

```
CRON_SECRET=your_random_secret
```

Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically on cron invocations.

The cron job:

1. Scrapes Truth Social + NewsAPI
2. Runs Claude analysis on new statements
3. Sends Twilio SMS if configured

Manual trigger:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/scrape
```

## API

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scrape` | POST | News + Truth Social ingest |
| `/api/analyze` | POST | Claude signal extraction |
| `/api/cron/scrape` | GET/POST | Cron entry (auth required) |
| `/api/signals` | GET | Dashboard feed |

POST `/api/scrape` with `{ "analyze": true }` to scrape and analyze in one call.
