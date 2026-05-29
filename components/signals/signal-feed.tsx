"use client";

import { useMemo, useState } from "react";

import { SignalCard } from "@/components/signals/signal-card";
import { SignalFeedEmptyState } from "@/components/signals/signal-feed-empty";
import {
  SignalFeedBar,
  applyFeedToggle,
  applySectorFilter,
  type FeedToggle,
  type SectorFilter,
} from "@/components/signals/signal-feed-bar";
import { downloadCsv, signalsToCsv } from "@/lib/export-signals";
import { useSignals, type SignalQuery } from "@/lib/hooks/use-signals";
import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { sortFeedSignals } from "@/lib/signal-display";
import {
  isWithinLast24Hours,
  sortSignalsByRecent,
} from "@/lib/signal-feed-utils";

export function SignalFeed({
  initialQuery = {},
  showFilters = true,
  watchlistOnly = false,
  title,
}: {
  initialQuery?: SignalQuery;
  showFilters?: boolean;
  watchlistOnly?: boolean;
  title?: string;
}) {
  const { tickers } = useWatchlist();
  const [query] = useState<SignalQuery>(initialQuery);
  const [feedToggle, setFeedToggle] = useState<FeedToggle>("all");
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>("all");

  const effectiveQuery = useMemo(
    () =>
      watchlistOnly ? { ...query, watchlist: tickers } : query,
    [query, watchlistOnly, tickers]
  );

  const { signals, loaded, error, lastUpdated, refresh } = useSignals(
    effectiveQuery
  );

  const sorted = useMemo(() => sortSignalsByRecent(signals), [signals]);
  const recentHistory = useMemo(() => sorted.slice(0, 10), [sorted]);
  const latestSignal = sorted[0] ?? null;

  const signals24h = useMemo(
    () => sorted.filter((s) => isWithinLast24Hours(s.created_at)),
    [sorted]
  );

  const filtered24h = useMemo(() => {
    const toggled = applyFeedToggle(signals24h, feedToggle);
    const sectored = applySectorFilter(toggled, sectorFilter);
    return sortFeedSignals(sectored);
  }, [signals24h, feedToggle, sectorFilter]);

  const noSignalsIn24h = loaded && signals24h.length === 0;
  const filterExcludesAll =
    loaded && signals24h.length > 0 && filtered24h.length === 0;

  return (
    <div className="space-y-4">
      {(title || lastUpdated) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="font-mono text-xs font-semibold tracking-[0.15em] text-slate-500">
              {title}
            </h2>
          )}
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="font-mono text-[11px] text-slate-600">
                Updated{" "}
                {lastUpdated.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/New_York",
                })}{" "}
                ET
              </span>
            )}
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `signals-${new Date().toISOString().slice(0, 10)}.csv`,
                  signalsToCsv(filtered24h)
                )
              }
              disabled={filtered24h.length === 0}
              className="rounded border border-[#1e2936] px-2.5 py-1 font-mono text-[11px] text-slate-500 transition hover:border-[#2a3544] hover:text-slate-300 disabled:opacity-40"
            >
              EXPORT
            </button>
            <button
              type="button"
              onClick={refresh}
              className="rounded border border-[#1e2936] px-2.5 py-1 font-mono text-[11px] text-slate-500 transition hover:border-[#2a3544] hover:text-slate-300"
            >
              REFRESH
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
          Unable to load signals. Try refreshing.
        </div>
      )}

      {showFilters && (
        <SignalFeedBar
          active={feedToggle}
          onChange={setFeedToggle}
          sector={sectorFilter}
          onSectorChange={setSectorFilter}
          count={filtered24h.length}
        />
      )}

      {watchlistOnly && tickers.length === 0 ? (
        <div className="rounded border border-[#1a2332] bg-[#0c1018] px-5 py-16 text-center">
          <p className="text-sm text-slate-500">
            Add tickers to your watchlist to see matching alerts.
          </p>
        </div>
      ) : filtered24h.length > 0 ? (
        <div className="space-y-3">
          {filtered24h.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      ) : noSignalsIn24h || !loaded ? (
        <SignalFeedEmptyState
          latest={loaded ? latestSignal : null}
          history={loaded ? recentHistory : []}
        />
      ) : filterExcludesAll ? (
        <div className="rounded border border-[#1a2332] bg-[#0c1018] px-5 py-16 text-center">
          <p className="font-mono text-sm text-slate-500">
            No alerts match this filter.
          </p>
        </div>
      ) : null}
    </div>
  );
}
