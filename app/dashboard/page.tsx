import { SignalsTable } from "@/components/signals-table";
import { isAnthropicConfigured } from "@/lib/claude";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isTruthSocialConfigured } from "@/lib/truth-social";

function StatusPill({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        active
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-surface-border bg-surface-raised text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-slate-600"}`}
      />
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const supabaseReady = isSupabaseConfigured();
  const claudeReady = isAnthropicConfigured();
  const newsReady = Boolean(process.env.NEWSAPI_KEY?.trim());
  const truthReady = isTruthSocialConfigured();
  const cronReady = Boolean(process.env.CRON_SECRET?.trim());
  const freePollReady = Boolean(process.env.TRUTH_SOCIAL_RSS_URL?.trim() || true);
  const twilioReady = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim()
  );

  return (
    <div className="finance-grid min-h-screen">
      <header className="border-b border-surface-border/80 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Pre-disclosure alpha
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Political Trade Signals
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Flag company mentions from Truth Social, speeches, and news — before
              the 45-day STOCK Act disclosure window.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label="Supabase" active={supabaseReady} />
            <StatusPill label="Claude" active={claudeReady} />
            <StatusPill label="Truth Social" active={truthReady} />
            <StatusPill label="NewsAPI" active={newsReady} />
            <StatusPill label="Vercel Cron" active={cronReady} />
            <StatusPill label="Free RSS poll" active={freePollReady} />
            <StatusPill label="Twilio SMS" active={twilioReady} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Pipeline
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Truth Social + News → Claude → SMS
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Free Truth poll
            </p>
            <p className="mt-2 font-mono text-xs text-accent">
              POST /api/cron/truth-poll
            </p>
            <p className="mt-1 text-xs text-slate-500">
              RSS every 15m via GitHub Actions
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Instant webhook
            </p>
            <p className="mt-2 font-mono text-xs text-slate-500">
              Optional paid FTT — not required
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Manual scrape
            </p>
            <p className="mt-2 font-mono text-xs text-accent">
              POST /api/scrape
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Auto cron
            </p>
            <p className="mt-2 font-mono text-xs text-accent">
              GET /api/cron/scrape
            </p>
            <p className="mt-1 text-xs text-slate-500">Daily at 12:00 UTC (Hobby plan)</p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Analyzer
            </p>
            <p className="mt-2 font-mono text-xs text-accent">
              POST /api/analyze
            </p>
          </div>
        </div>

        <SignalsTable />
      </main>
    </div>
  );
}
