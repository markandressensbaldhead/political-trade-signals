"use client";

import Link from "next/link";

import { SignalHero } from "@/components/dashboard/signal-hero";
import { HotTickers } from "@/components/dashboard/hot-tickers";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { SignalCard } from "@/components/signals/signal-card";
import { SignalFeed } from "@/components/signals/signal-feed";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

export function DashboardOverview() {
  const { data, error, loading } = useDashboardStats(60_000);

  return (
    <div className="space-y-10">
      <SignalHero />

      {error && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
          Unable to refresh signals. Retrying shortly.
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-xl border border-white/[0.06] bg-surface-raised/50 py-20 text-center text-sm text-slate-500">
          Loading signals…
        </div>
      ) : (
        data && (
          <>
            <StatsBar stats={data.stats} />

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Most mentioned
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tickers drawing repeated endorsements
                  </p>
                </div>
              </div>
              <HotTickers tickers={data.hotTickers} />
            </section>

            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Priority signals
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Highest conviction flags right now
                  </p>
                </div>
                <Link
                  href="/signals"
                  className="text-xs font-medium text-slate-400 transition hover:text-white"
                >
                  View all →
                </Link>
              </div>
              {data.topActionable.length === 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-surface-raised/50 py-16 text-center">
                  <p className="text-sm text-slate-400">No signals yet.</p>
                  <p className="mt-2 text-xs text-slate-600">
                    New endorsements appear here as they are detected.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {data.topActionable.map((signal) => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))}
                </div>
              )}
            </section>
          </>
        )
      )}

      <section>
        <SignalFeed compact showFilters={false} title="Latest" />
      </section>
    </div>
  );
}
