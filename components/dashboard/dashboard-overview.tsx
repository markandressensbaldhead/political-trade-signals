"use client";

import Link from "next/link";

import { CongressPulse } from "@/components/congress/congress-pulse";
import { HotTickers } from "@/components/dashboard/hot-tickers";
import { DecisionRail } from "@/components/dashboard/decision-rail";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { SignalCard } from "@/components/signals/signal-card";
import { SignalFeed } from "@/components/signals/signal-feed";
import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

export function DashboardOverview() {
  const { data, error, loading } = useDashboardStats(60_000);

  return (
    <div className="space-y-8">
      <DecisionRail />

      {error && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-xl border border-surface-border bg-surface-raised p-12 text-center text-slate-400">
          Loading command center…
        </div>
      ) : (
        data && (
          <>
            <StatsBar stats={data.stats} />

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Hot tickers
                </h2>
                <span className="text-xs text-slate-500">
                  Most mentioned · pre-disclosure signals
                </span>
              </div>
              <HotTickers tickers={data.hotTickers} />
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Top actionable
                </h2>
                <Link href="/signals" className="text-xs text-accent hover:underline">
                  View all signals →
                </Link>
              </div>
              {data.topActionable.length === 0 ? (
                <div className="rounded-xl border border-surface-border bg-surface-raised p-8 text-center text-sm text-slate-500">
                  Waiting for first analyzed mentions. RSS poll runs every 15 minutes.
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

      <CongressPulse />

      <section>
        <SignalFeed compact showFilters={false} title="Live feed" />
      </section>
    </div>
  );
}
