"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TickerLink } from "@/components/shared/ticker-link";
import { useWatchlist } from "@/lib/hooks/use-watchlist";
import type { MarketQuote } from "@/lib/market";

export function WatchlistManager() {
  const { tickers, add, remove, clear } = useWatchlist();
  const [input, setInput] = useState("");
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});

  useEffect(() => {
    if (tickers.length === 0) {
      setQuotes({});
      return;
    }

    fetch(`/api/market/ALL?batch=${encodeURIComponent(tickers.join(","))}`)
      .then((r) => r.json())
      .then((payload: { quotes?: Record<string, MarketQuote> }) => {
        setQuotes(payload.quotes ?? {});
      })
      .catch(() => setQuotes({}));
  }, [tickers]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim().toUpperCase();
    if (!value) return;
    add(value);
    setInput("");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.06] bg-surface-raised/80 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
          Add tickers
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Symbols you want flagged when Trump mentions them.
        </p>

        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Add ticker (e.g. LMT)"
            className="flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 font-mono text-sm uppercase text-slate-100 placeholder:normal-case placeholder:text-slate-500 focus:border-accent/50 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface transition hover:bg-accent-muted"
          >
            Add
          </button>
        </form>

        {tickers.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="mt-3 text-xs text-slate-500 hover:text-bear"
          >
            Clear all
          </button>
        )}
      </div>

      {tickers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.06] p-12 text-center text-sm text-slate-500">
          No tickers yet. Add symbols you trade or want to monitor for political mentions.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tickers.map((ticker) => {
            const quote = quotes[ticker];
            const change = quote?.changePercent;

            return (
              <div
                key={ticker}
                className="rounded-xl border border-white/[0.06] bg-surface-raised/80 p-4"
              >
                <div className="flex items-start justify-between">
                  <TickerLink ticker={ticker} />
                  <button
                    type="button"
                    onClick={() => remove(ticker)}
                    className="text-xs text-slate-500 hover:text-bear"
                  >
                    Remove
                  </button>
                </div>
                {quote?.shortName && (
                  <p className="mt-2 text-sm text-slate-300">{quote.shortName}</p>
                )}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-lg text-white">
                    {quote?.price != null ? `$${quote.price.toFixed(2)}` : "—"}
                  </span>
                  {change != null && (
                    <span
                      className={`font-mono text-xs ${
                        change >= 0 ? "text-bull" : "text-bear"
                      }`}
                    >
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(2)}%
                    </span>
                  )}
                </div>
                <Link
                  href={`/ticker/${ticker}`}
                  className="mt-3 inline-block text-xs text-accent hover:underline"
                >
                  View signals →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
