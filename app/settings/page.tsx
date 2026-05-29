import { isAnthropicConfigured } from "@/lib/claude";
import { isCapitolTradesConfigured } from "@/lib/capitol-trades";
import {
  getPrimarySpeakerLabel,
  getPublicSourceStatuses,
  isAnyPublicSourceConfigured,
} from "@/lib/public-sources";
import { isQuiverAltDataConfigured } from "@/lib/quiver-alt-data";
import { isSupabaseConfigured } from "@/lib/supabase";

function StatusPill({
  label,
  active,
  hint,
}: {
  label: string;
  active: boolean;
  hint?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-accent/30 bg-accent/5"
          : "border-surface-border bg-surface-raised"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${active ? "bg-accent" : "bg-slate-600"}`}
        />
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const publicSources = getPublicSourceStatuses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">System status</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tracking verified public statements from {getPrimarySpeakerLabel()}.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Statement ingestion (every 15 min)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {publicSources.map((source) => (
            <StatusPill
              key={source.id}
              label={source.label}
              active={source.active}
              hint={source.hint}
            />
          ))}
          <StatusPill
            label="Any source live"
            active={isAnyPublicSourceConfigured()}
            hint="At least one ingestion path active"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Analysis &amp; enrichment
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatusPill
            label="Supabase"
            active={isSupabaseConfigured()}
            hint="Signal storage"
          />
          <StatusPill
            label="Claude"
            active={isAnthropicConfigured()}
            hint="Bullish mention extraction"
          />
          <StatusPill
            label="Capitol Trades"
            active={isCapitolTradesConfigured()}
            hint="PTR filing overlay"
          />
          <StatusPill
            label="QuiverQuant alt-data"
            active={isQuiverAltDataConfigured()}
            hint="Insider / lobbying / contracts"
          />
          <StatusPill
            label="Vercel cron"
            active={Boolean(process.env.CRON_SECRET?.trim())}
            hint="Daily full scrape"
          />
          <StatusPill
            label="Twilio SMS"
            active={Boolean(
              process.env.TWILIO_ACCOUNT_SID?.trim() &&
                process.env.TWILIO_AUTH_TOKEN?.trim()
            )}
          />
        </div>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
        <p className="text-sm font-semibold text-slate-300">Cron endpoints</p>
        <ul className="mt-3 space-y-2 font-mono text-xs text-slate-400">
          <li>POST /api/cron/public-poll — Truth + X + news (GitHub Actions 15m)</li>
          <li>POST /api/cron/truth-poll — alias for public poll</li>
          <li>POST /api/cron/scrape — daily full pipeline</li>
          <li>POST /api/scrape — manual ingest (auth required in prod)</li>
          <li>POST /api/analyze — run Claude on backlog (auth required)</li>
        </ul>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-5 text-sm text-slate-400">
        <p className="font-medium text-slate-300">Optional env keys</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>X_BEARER_TOKEN — official X API for @realDonaldTrump posts</li>
          <li>NEWSAPI_KEY — Reuters, CNN, Fox, WSJ, AP, CNBC, etc.</li>
          <li>GNEWS_API_KEY — GNews search API</li>
          <li>NEWS_RSS_FEEDS — custom RSS (url::Label|url::Label)</li>
          <li>X_RSS_URL — custom X RSS bridge if API unavailable</li>
        </ul>
      </div>
    </div>
  );
}
