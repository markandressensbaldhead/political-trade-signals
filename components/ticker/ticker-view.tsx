"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CongressTradesPanel } from "@/components/congress/congress-trades-panel";
import { SignalCard } from "@/components/signals/signal-card";
import { MentionFilingBanner } from "@/components/ticker/mention-filing-banner";
import { PriceSparkline } from "@/components/ticker/price-sparkline";
import { TickerAltDataPanel } from "@/components/ticker/ticker-alt-data-panel";
import { ConfidenceMeter } from "@/components/shared/confidence-meter";
import { SentimentBadge } from "@/components/shared/sentiment-badge";
import type { CapitolTradesRecord } from "@/lib/capitol-trades";
import type { MentionFilingStatus } from "@/lib/disclosure";
import type { ChartHistory, MarketQuote } from "@/lib/market";
import type {
  QuiverGovContract,
  QuiverInsiderTrade,
  QuiverLobbyingRecord,
} from "@/lib/quiver-alt-data";
import type { TickerSummary } from "@/lib/types";
import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { isInWatchlist } from "@/lib/watchlist";
import { formatConfidence } from "@/lib/utils";

export function TickerView({ symbol }: { symbol: string }) {
  const { tickers, toggle } = useWatchlist();
  const watched = isInWatchlist(symbol, tickers);

  const [summary, setSummary] = useState<TickerSummary | null>(null);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [chart, setChart] = useState<ChartHistory | null>(null);
  const [congressTrades, setCongressTrades] = useState<CapitolTradesRecord[]>(
    []
  );
  const [mentionFiling, setMentionFiling] =
    useState<MentionFilingStatus | null>(null);
  const [moveSinceFirst, setMoveSinceFirst] = useState<number | null>(null);
  const [altData, setAltData] = useState<{
    insiders: QuiverInsiderTrade[];
    lobbying: QuiverLobbyingRecord[];
    contracts: QuiverGovContract[];
    configured: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/ticker/${encodeURIComponent(symbol)}`, { cache: "no-store" }),
      fetch(`/api/ticker/${encodeURIComponent(symbol)}/alt-data`, {
        cache: "no-store",
      }),
    ])
      .then(async ([tickerRes, altRes]) => {
        const payload = (await tickerRes.json()) as {
          summary?: TickerSummary;
          quote?: MarketQuote;
          chart?: ChartHistory;
          congressTrades?: CapitolTradesRecord[];
          mentionFiling?: MentionFilingStatus;
          moveSinceFirstSignal?: number | null;
          error?: string;
        };

        if (payload.error || !payload.summary) {
          throw new Error(payload.error ?? "Failed to load");
        }

        setSummary(payload.summary);
        setQuote(payload.quote ?? null);
        setChart(payload.chart ?? null);
        setCongressTrades(payload.congressTrades ?? []);
        setMentionFiling(payload.mentionFiling ?? null);
        setMoveSinceFirst(payload.moveSinceFirstSignal ?? null);

        const altPayload = (await altRes.json()) as typeof altData;
        setAltData(altPayload);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load ticker")
      )
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-raised p-12 text-center text-slate-400">
        Loading {symbol}…
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-xl border border-bear/20 bg-bear/5 p-8 text-center text-bear">
        {error ?? "Ticker not found"}
      </div>
    );
  }

  const firstSignalDate = summary.signals[summary.signals.length - 1]?.created_at;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/signals" className="text-sm text-slate-500 hover:text-accent">
          ← All signals
        </Link>
        <button
          type="button"
          onClick={() => toggle(symbol)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            watched
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-surface-border text-slate-400 hover:text-accent"
          }`}
        >
          {watched ? "★ On watchlist" : "☆ Add to watchlist"}
        </button>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-mono text-sm text-accent">{symbol}</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {quote?.shortName ?? summary.companyName}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {summary.signalCount} political mention
              {summary.signalCount === 1 ? "" : "s"} ·{" "}
              {congressTrades.length} PTR filing
              {congressTrades.length === 1 ? "" : "s"}
            </p>
          </div>
          {quote?.price != null && (
            <div className="text-right">
              <p className="font-mono text-3xl font-semibold text-white">
                ${quote.price.toFixed(2)}
              </p>
              {quote.changePercent != null && (
                <p
                  className={`font-mono text-sm ${
                    quote.changePercent >= 0 ? "text-bull" : "text-bear"
                  }`}
                >
                  {quote.changePercent >= 0 ? "+" : ""}
                  {quote.changePercent.toFixed(2)}% today
                </p>
              )}
              {moveSinceFirst != null && (
                <p className="mt-1 text-xs text-slate-500">
                  {moveSinceFirst >= 0 ? "+" : ""}
                  {moveSinceFirst.toFixed(1)}% since first mention
                </p>
              )}
            </div>
          )}
        </div>

        {chart && chart.points.length > 1 && (
          <div className="mt-6">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">
              1mo price · dashed line = first mention
            </p>
            <PriceSparkline
              points={chart.points}
              width={640}
              height={80}
              signalDate={firstSignalDate}
            />
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-surface-border bg-surface p-3">
            <p className="text-[10px] uppercase text-slate-500">Bullish mentions</p>
            <p className="font-mono text-xl text-bull">{summary.signalCount}</p>
          </div>
          <div className="rounded-lg border border-surface-border bg-surface p-3">
            <p className="text-[10px] uppercase text-slate-500">Avg confidence</p>
            <p className="font-mono text-xl text-white">
              {formatConfidence(summary.avgConfidence)}
            </p>
          </div>
        </div>

        {summary.latestSignal && (
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
            Latest tone:
            <SentimentBadge sentiment={summary.latestSignal.sentiment} />
            <ConfidenceMeter
              value={summary.latestSignal.confidence}
              width="w-16"
            />
          </div>
        )}
      </div>

      {mentionFiling && <MentionFilingBanner status={mentionFiling} />}

      <CongressTradesPanel trades={congressTrades} />

      {altData && (
        <TickerAltDataPanel
          insiders={altData.insiders}
          lobbying={altData.lobbying}
          contracts={altData.contracts}
          configured={altData.configured}
        />
      )}

      {summary.signals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border p-12 text-center text-sm text-slate-500">
          No pre-disclosure mentions for {symbol} yet — add to watchlist to catch the next one.
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Bullish mentions
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {summary.signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
