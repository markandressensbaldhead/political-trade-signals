"use client";

import Link from "next/link";

import type { HotTicker } from "@/lib/signal-analytics";
import { formatSignalTime } from "@/lib/utils";
import { TickerLink } from "@/components/shared/ticker-link";

export function HotTickers({ tickers }: { tickers: HotTicker[] }) {
  if (tickers.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-surface-raised/50 p-8 text-center text-sm text-slate-500">
        No clustered mentions yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tickers.map((item) => (
        <Link
          key={item.ticker}
          href={`/ticker/${item.ticker}`}
          className="group rounded-xl border border-white/[0.06] bg-surface-raised/80 p-4 transition hover:border-white/[0.12] hover:bg-white/[0.02]"
        >
          <div className="flex items-start justify-between gap-2">
            <TickerLink ticker={item.ticker} />
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-slate-400">
              ×{item.count}
            </span>
          </div>
          <p className="mt-2 line-clamp-1 text-sm font-medium text-slate-200">
            {item.companyName}
          </p>
          <p className="mt-3 text-[10px] text-slate-600">
            {formatSignalTime(item.latestAt)}
          </p>
        </Link>
      ))}
    </div>
  );
}
