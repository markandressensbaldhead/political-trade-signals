"use client";

import { useCallback, useEffect, useState } from "react";

import type { CompanySignal } from "@/lib/types";
import {
  formatConfidence,
  formatSignalTime,
  isWithinLastHour,
  sentimentClass,
} from "@/lib/utils";

function LiveDot({ active }: { active: boolean }) {
  if (!active) {
    return <span className="inline-block h-2 w-2 rounded-full bg-slate-600" />;
  }

  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
      <span className="relative inline-flex h-2 w-2 animate-pulseDot rounded-full bg-accent" />
    </span>
  );
}

export function SignalsTable() {
  const [signals, setSignals] = useState<CompanySignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadSignals = useCallback(async () => {
    try {
      const response = await fetch("/api/signals", { cache: "no-store" });
      const payload = (await response.json()) as {
        signals?: CompanySignal[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load signals");
      }

      setSignals(payload.signals ?? []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load signals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSignals();
    const interval = setInterval(loadSignals, 30_000);
    return () => clearInterval(interval);
  }, [loadSignals]);

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-raised p-12 text-center text-slate-400">
        Loading signal feed…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Live Signal Feed
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Auto-refreshes every 30s
            {lastUpdated
              ? ` · Updated ${lastUpdated.toLocaleTimeString()}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={loadSignals}
          className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-accent/40 hover:text-accent"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      {signals.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm text-slate-400">No signals yet.</p>
          <p className="mt-2 text-xs text-slate-500">
            Run <code className="text-accent">POST /api/scrape</code> then{" "}
            <code className="text-accent">POST /api/analyze</code> to populate
            the feed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Ticker</th>
                <th className="px-5 py-3 font-medium">Sentiment</th>
                <th className="px-5 py-3 font-medium">Confidence</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Quote</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => {
                const isLive = isWithinLastHour(signal.created_at);

                return (
                  <tr
                    key={signal.id}
                    className="border-b border-surface-border/70 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <LiveDot active={isLive} />
                        <span className="whitespace-nowrap font-mono text-xs text-slate-300">
                          {formatSignalTime(signal.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-100">
                      {signal.company_name}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent">
                        {signal.ticker}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${sentimentClass(signal.sentiment)}`}
                      >
                        {signal.sentiment}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${signal.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-slate-300">
                          {formatConfidence(signal.confidence)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{signal.source}</td>
                    <td className="max-w-md px-5 py-4 text-slate-300">
                      <span className="line-clamp-2 italic">
                        &ldquo;{signal.quote}&rdquo;
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
