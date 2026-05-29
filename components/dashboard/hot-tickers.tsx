"use client";

import Link from "next/link";

import type { HotTicker } from "@/lib/signal-analytics";
import { formatSignalTime } from "@/lib/utils";
import { SentimentBadge } from "@/components/shared/sentiment-badge";
import { TickerLink } from "@/components/shared/ticker-link";

export function HotTickers({ tickers }: { tickers: HotTicker[] }) {
  if (tickers.length === 0) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-raised p-6 text-sm text-slate-500">
        No clustered mentions yet — hot tickers appear when multiple signals stack up.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tickers.map((item) => (
        <Link
          key={item.ticker}
          href={`/ticker/${item.ticker}`}
          className="group rounded-xl border border-surface-border bg-surface-raised p-4 transition hover:border-accent/30 hover:bg-white/[0.02]"
        >
          <div className="flex items-start justify-between gap-2">
            <TickerLink ticker={item.ticker} />
            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
              ×{item.count}
            </span>
          </div>
          <p className="mt-2 line-clamp-1 text-sm font-medium text-slate-200">
            {item.companyName}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <SentimentBadge sentiment={item.dominantSentiment} />
            <span className="text-[10px] text-slate-500">
              {formatSignalTime(item.latestAt)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
