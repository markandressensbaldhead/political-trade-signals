"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { CapitolTradesRecord } from "@/lib/capitol-trades";
import { formatSignalTime } from "@/lib/utils";

export function CongressPulse() {
  const [trades, setTrades] = useState<CapitolTradesRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/congress/trades?limit=8", { cache: "no-store" })
      .then((r) => r.json())
      .then((payload: { trades?: CapitolTradesRecord[] }) => {
        setTrades(payload.trades ?? []);
      })
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-raised p-6 text-sm text-slate-500">
        Loading congress filings…
      </div>
    );
  }

  if (trades.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Latest PTR filings
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Capitol Trades — what hit the public record recently
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised">
        <div className="divide-y divide-surface-border/70">
          {trades.map((trade) => (
            <Link
              key={`${trade.politicianId}-${trade.ticker}-${trade.tradeDate}`}
              href={`/ticker/${trade.ticker}`}
              className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {trade.politicianName}
                </p>
                <p className="text-xs text-slate-500">
                  {formatSignalTime(trade.tradeDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent">
                  {trade.ticker}
                </span>
                <span
                  className={`text-xs font-medium ${
                    trade.type === "Purchase" ? "text-bull" : "text-bear"
                  }`}
                >
                  {trade.type}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
