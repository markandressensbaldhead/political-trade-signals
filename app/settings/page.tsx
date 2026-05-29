import { isAnthropicConfigured } from "@/lib/claude";
import { isCapitolTradesConfigured } from "@/lib/capitol-trades";
import { isQuiverAltDataConfigured } from "@/lib/quiver-alt-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isTruthSocialConfigured } from "@/lib/truth-social";

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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">System status</h1>
        <p className="mt-1 text-sm text-slate-400">
          Integration health and pipeline endpoints.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatusPill
          label="Supabase"
          active={isSupabaseConfigured()}
          hint="Signal storage"
        />
        <StatusPill
          label="Claude"
          active={isAnthropicConfigured()}
          hint="Mention extraction"
        />
        <StatusPill
          label="Truth Social RSS"
          active={isTruthSocialConfigured()}
          hint="15m GitHub Actions poll"
        />
        <StatusPill
          label="Capitol Trades"
          active={isCapitolTradesConfigured()}
          hint="Free PTR filings"
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
          label="NewsAPI"
          active={Boolean(process.env.NEWSAPI_KEY?.trim())}
        />
        <StatusPill
          label="Twilio SMS"
          active={Boolean(
            process.env.TWILIO_ACCOUNT_SID?.trim() &&
              process.env.TWILIO_AUTH_TOKEN?.trim()
          )}
        />
        <StatusPill
          label="Pipeline auth"
          active={Boolean(process.env.CRON_SECRET?.trim())}
          hint="POST /api/scrape requires Bearer token"
        />
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
        <p className="text-sm font-semibold text-slate-300">Manual triggers</p>
        <ul className="mt-3 space-y-2 font-mono text-xs text-slate-400">
          <li>POST /api/cron/truth-poll — RSS poll (GitHub Actions)</li>
          <li>POST /api/cron/scrape — daily full pipeline</li>
          <li>POST /api/scrape — manual ingest (auth required in prod)</li>
          <li>POST /api/analyze — run Claude on backlog (auth required)</li>
        </ul>
      </div>
    </div>
  );
}
