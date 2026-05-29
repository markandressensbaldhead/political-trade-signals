"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MentionFilingBanner } from "@/components/ticker/mention-filing-banner";
import { AlphaScore } from "@/components/shared/alpha-score";
import { ConfidenceMeter } from "@/components/shared/confidence-meter";
import { SentimentBadge } from "@/components/shared/sentiment-badge";
import { TickerLink } from "@/components/shared/ticker-link";
import { buildRetailDecision } from "@/lib/signal-analytics";
import type { MentionFilingStatus } from "@/lib/disclosure";
import type { SignalWithStatement } from "@/lib/types";
import type { MarketQuote } from "@/lib/market";
import { formatSignalTime } from "@/lib/utils";

export function SignalDetailView({ id }: { id: string }) {
  const [signal, setSignal] = useState<SignalWithStatement | null>(null);
  const [market, setMarket] = useState<MarketQuote | null>(null);
  const [mentionFiling, setMentionFiling] =
    useState<MentionFilingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/signals/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(async (payload: { signal?: SignalWithStatement; error?: string }) => {
        if (payload.error || !payload.signal) {
          throw new Error(payload.error ?? "Not found");
        }
        setSignal(payload.signal);

        if (payload.signal.ticker !== "UNKNOWN") {
          const [marketRes, tickerRes] = await Promise.all([
            fetch(`/api/market/${encodeURIComponent(payload.signal.ticker)}`),
            fetch(`/api/ticker/${encodeURIComponent(payload.signal.ticker)}`),
          ]);
          const marketPayload = (await marketRes.json()) as {
            quote?: MarketQuote;
          };
          const tickerPayload = (await tickerRes.json()) as {
            mentionFiling?: MentionFilingStatus;
          };
          setMarket(marketPayload.quote ?? null);
          setMentionFiling(tickerPayload.mentionFiling ?? null);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-raised p-12 text-center text-slate-400">
        Loading signal…
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="rounded-xl border border-bear/20 bg-bear/5 p-8 text-center">
        <p className="text-bear">{error ?? "Signal not found"}</p>
        <Link href="/signals" className="mt-4 inline-block text-sm text-accent">
          ← Back to feed
        </Link>
      </div>
    );
  }

  const decision = buildRetailDecision(signal);

  return (
    <div className="space-y-6">
      <Link href="/signals" className="text-sm text-slate-500 hover:text-accent">
        ← Signal feed
      </Link>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TickerLink ticker={signal.ticker} />
              <SentimentBadge sentiment={signal.sentiment} size="md" />
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              {signal.company_name}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {formatSignalTime(signal.created_at)} · {signal.source}
              {signal.speaker ? ` · ${signal.speaker}` : ""}
            </p>
          </div>
          <AlphaScore signal={signal} size="lg" />
        </div>

        {market?.price != null && (
          <div className="mt-4 inline-flex items-baseline gap-2 rounded-lg border border-surface-border bg-surface px-4 py-2">
            <span className="font-mono text-lg text-white">
              ${market.price.toFixed(2)}
            </span>
            {market.changePercent != null && (
              <span
                className={`font-mono text-sm ${
                  market.changePercent >= 0 ? "text-bull" : "text-bear"
                }`}
              >
                {market.changePercent >= 0 ? "+" : ""}
                {market.changePercent.toFixed(2)}% today
              </span>
            )}
          </div>
        )}

        <blockquote className="mt-6 border-l-4 border-accent/50 pl-4 text-lg italic leading-relaxed text-slate-200">
          &ldquo;{signal.quote}&rdquo;
        </blockquote>

        {signal.action_note && (
          <div className="mt-4 rounded-lg border border-surface-border bg-surface p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Why it might matter
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {signal.action_note}
            </p>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
          <p className="font-semibold text-accent">{decision.headline}</p>
          <p className="mt-1 text-sm text-slate-300">{decision.detail}</p>
        </div>

        <div className="mt-4">
          <ConfidenceMeter value={signal.confidence} width="w-32" />
        </div>
      </div>

      {mentionFiling && <MentionFilingBanner status={mentionFiling} />}

      {signal.statement && (
        <div className="rounded-xl border border-surface-border bg-surface-raised p-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Full statement context
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Published {formatSignalTime(signal.statement.published_at)}
          </p>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {signal.statement.content}
          </div>
        </div>
      )}
    </div>
  );
}
