"use client";

import { useEffect, useState } from "react";

import type { CompanySignal } from "@/lib/types";
import type { ChartHistory, MarketQuote } from "@/lib/market";
import { getDaysBeforeDisclosure } from "@/lib/disclosure";
import { formatConfidence, formatSignalTimeEt } from "@/lib/utils";

function ChartPlaceholder({ ticker }: { ticker: string }) {
  return (
    <div className="relative h-40 overflow-hidden rounded border border-[#1a2332] bg-[#060910]">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(#1a2332 1px, transparent 1px), linear-gradient(90deg, #1a2332 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute inset-x-0 bottom-8 flex items-end justify-between px-3">
        {[42, 58, 48, 72, 65, 80, 74, 88, 76, 92].map((h, i) => (
          <div
            key={i}
            className="w-[7%] rounded-t bg-accent/20"
            style={{ height: `${h * 0.35}%` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[10px] tracking-[0.2em] text-slate-600">
          30-DAY CHART · {ticker}
        </span>
      </div>
    </div>
  );
}

export function TradeSetupDrawer({
  signal,
  open,
  onClose,
}: {
  signal: CompanySignal;
  open: boolean;
  onClose: () => void;
}) {
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [chart, setChart] = useState<ChartHistory | null>(null);
  const [rationale, setRationale] = useState<string | null>(null);
  const [tradeDate, setTradeDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || signal.ticker === "UNKNOWN") return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setRationale(null);
    setQuote(null);
    setChart(null);
    setTradeDate(null);

    Promise.all([
      fetch(`/api/market/${encodeURIComponent(signal.ticker)}`, {
        cache: "no-store",
      }).then((r) => r.json()),
      fetch(`/api/ticker/${encodeURIComponent(signal.ticker)}`, {
        cache: "no-store",
      }).then((r) => r.json()),
      fetch(`/api/signals/${signal.id}/trade-rationale`, {
        cache: "no-store",
      }).then((r) => r.json()),
    ])
      .then(([marketPayload, tickerPayload, rationalePayload]) => {
        if (cancelled) return;
        setQuote(marketPayload.quote ?? null);
        setChart(tickerPayload.chart ?? null);
        setTradeDate(
          tickerPayload.mentionFiling?.matchingTrade?.tradeDate ?? null
        );
        if (rationalePayload.error) {
          setError(rationalePayload.error);
        } else {
          setRationale(rationalePayload.rationale ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load trade setup.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, signal.id, signal.ticker]);

  if (!open) return null;

  const disclosureDays = getDaysBeforeDisclosure(
    tradeDate ?? signal.created_at
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="relative flex h-[92vh] w-full max-w-lg flex-col border-l border-[#1a2332] bg-[#0a0f14] shadow-2xl sm:h-full">
        <header className="flex items-start justify-between gap-4 border-b border-[#1a2332] px-5 py-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-slate-500">
              TRADE SETUP
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {signal.company_name}
            </h2>
            <p className="mt-0.5 font-mono text-sm text-slate-500">
              {signal.ticker}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#1e2936] px-2.5 py-1 font-mono text-xs text-slate-400 transition hover:text-white"
          >
            ESC
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="rounded border border-[#1a2332] bg-[#0c1018] px-4 py-3">
            <p className="font-mono text-[10px] tracking-wider text-slate-500">
              CURRENT PRICE
            </p>
            {loading && quote == null ? (
              <div className="mt-2 h-8 w-32 animate-pulse rounded bg-white/[0.06]" />
            ) : quote?.price != null ? (
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-mono text-2xl font-semibold text-white">
                  ${quote.price.toFixed(2)}
                </span>
                {quote.changePercent != null && (
                  <span
                    className={`font-mono text-sm ${
                      quote.changePercent >= 0 ? "text-bull" : "text-bear"
                    }`}
                  >
                    {quote.changePercent >= 0 ? "+" : ""}
                    {quote.changePercent.toFixed(2)}%
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-2 font-mono text-sm text-slate-500">—</p>
            )}
          </div>

          {chart && chart.points.length > 0 ? (
            <div className="rounded border border-[#1a2332] bg-[#060910] p-3">
              <p className="mb-2 font-mono text-[10px] tracking-wider text-slate-500">
                30-DAY CHART
              </p>
              <div className="flex h-32 items-end gap-0.5">
                {chart.points.slice(-30).map((pt) => {
                  const closes = chart.points.slice(-30).map((p) => p.close);
                  const min = Math.min(...closes);
                  const max = Math.max(...closes);
                  const range = max - min || 1;
                  const h = ((pt.close - min) / range) * 100;
                  return (
                    <div
                      key={pt.date}
                      className="flex-1 rounded-t bg-accent/40"
                      style={{ height: `${Math.max(8, h)}%` }}
                      title={`$${pt.close.toFixed(2)}`}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <ChartPlaceholder ticker={signal.ticker} />
          )}

          <div className="rounded border border-[#1a2332] bg-[#0c1018] px-4 py-4">
            <p className="font-mono text-[10px] tracking-wider text-slate-500">
              AI TRADE RATIONALE
            </p>
            {loading && !rationale ? (
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
                <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ) : error ? (
              <p className="mt-3 text-sm text-amber-400/90">{error}</p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {rationale}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="rounded border border-[#1a2332] bg-[#080b10] px-3 py-2">
              <span className="text-slate-600">SOURCE</span>
              <p className="mt-0.5 text-slate-300">{signal.source}</p>
            </div>
            <div className="rounded border border-[#1a2332] bg-[#080b10] px-3 py-2">
              <span className="text-slate-600">CONFIDENCE</span>
              <p className="mt-0.5 text-slate-300">
                {formatConfidence(signal.confidence)}
              </p>
            </div>
            <div className="rounded border border-[#1a2332] bg-[#080b10] px-3 py-2">
              <span className="text-slate-600">DISCLOSURE</span>
              <p className="mt-0.5 text-slate-300">
                {disclosureDays != null ? `${disclosureDays}d remaining` : "—"}
              </p>
            </div>
            <div className="rounded border border-[#1a2332] bg-[#080b10] px-3 py-2">
              <span className="text-slate-600">DETECTED</span>
              <p className="mt-0.5 text-slate-300">
                {formatSignalTimeEt(signal.created_at)}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
