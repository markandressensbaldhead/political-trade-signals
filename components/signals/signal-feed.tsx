"use client";

import { useMemo, useState } from "react";

import { SignalCard } from "@/components/signals/signal-card";
import { SignalFilters } from "@/components/signals/signal-filters";
import { rankActionableSignals } from "@/lib/signal-analytics";
import { downloadCsv, signalsToCsv } from "@/lib/export-signals";
import { useSignals, type SignalQuery } from "@/lib/hooks/use-signals";
import { useWatchlist } from "@/lib/hooks/use-watchlist";

export function SignalFeed({
  initialQuery = {},
  compact = false,
  showFilters = true,
  watchlistOnly = false,
  title = "Signal Feed",
}: {
  initialQuery?: SignalQuery;
  compact?: boolean;
  showFilters?: boolean;
  watchlistOnly?: boolean;
  title?: string;
}) {
  const { tickers } = useWatchlist();
  const [query, setQuery] = useState<SignalQuery>(initialQuery);
  const [view, setView] = useState<"cards" | "dense">("cards");

  const effectiveQuery = useMemo(
    () =>
      watchlistOnly
        ? { ...query, watchlist: tickers }
        : query,
    [query, watchlistOnly, tickers]
  );

  const { signals, loading, error, lastUpdated, refresh } = useSignals(
    effectiveQuery
  );

  const ranked = useMemo(
    () => rankActionableSignals(signals),
    [signals]
  );

  const sources = useMemo(
    () => [...new Set(signals.map((s) => s.source))].sort(),
    [signals]
  );

  if (loading && signals.length === 0) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-raised p-12 text-center text-slate-400">
        Loading signals…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {ranked.length} signals
            {lastUpdated
              ? ` · Updated ${lastUpdated.toLocaleTimeString()}`
              : ""}
            {watchlistOnly && tickers.length === 0
              ? " · add tickers on Watchlist page"
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-surface-border p-0.5">
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`rounded-md px-2.5 py-1 text-xs ${
                view === "cards" ? "bg-accent/10 text-accent" : "text-slate-400"
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView("dense")}
              className={`rounded-md px-2.5 py-1 text-xs ${
                view === "dense" ? "bg-accent/10 text-accent" : "text-slate-400"
              }`}
            >
              Dense
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                `signals-${new Date().toISOString().slice(0, 10)}.csv`,
                signalsToCsv(ranked)
              )
            }
            disabled={ranked.length === 0}
            className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-accent/40 hover:text-accent disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-accent/40 hover:text-accent"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      {showFilters && (
        <SignalFilters query={query} onChange={setQuery} sources={sources} />
      )}

      {ranked.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface-raised px-5 py-16 text-center">
          <p className="text-sm text-slate-400">No signals match your filters.</p>
        </div>
      ) : (
        <div
          className={
            view === "cards"
              ? "grid gap-4 lg:grid-cols-2"
              : "space-y-3"
          }
        >
          {ranked.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              compact={compact || view === "dense"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
