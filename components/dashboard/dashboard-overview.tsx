"use client";

import Link from "next/link";

import { AiTechWatchlist } from "@/components/dashboard/ai-tech-watchlist";
import { SignalHero } from "@/components/dashboard/signal-hero";
import { HotTickers } from "@/components/dashboard/hot-tickers";
import { SignalStrengthIndex } from "@/components/dashboard/signal-strength-index";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { SignalCard } from "@/components/signals/signal-card";
import { SignalFeedSkeleton } from "@/components/signals/signal-card-skeleton";
import { SignalFeed } from "@/components/signals/signal-feed";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

export function DashboardOverview() {
  const { data, error, loading } = useDashboardStats(60_000);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-10">
        <SignalHero />

        {error && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
            Unable to refresh signals. Retrying shortly.
          </div>
        )}

        {loading && !data ? (
          <SignalFeedSkeleton count={3} />
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
                  <div className="space-y-3">
                    {data.topActionable.map((signal) => (
                      <SignalCard key={signal.id} signal={signal} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )
        )}

        <section className="space-y-8">
          <SignalFeed showFilters={false} title="LATEST" />
          {data && <AiTechWatchlist entries={data.watchlist} />}
        </section>
      </div>

      <SignalStrengthIndex
        entries={data?.strengthIndex ?? []}
      />
    </div>
  );
}
