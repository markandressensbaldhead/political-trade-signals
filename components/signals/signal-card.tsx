"use client";

import Link from "next/link";

import { AlphaScore } from "@/components/shared/alpha-score";
import { ConfidenceMeter } from "@/components/shared/confidence-meter";
import { SentimentBadge } from "@/components/shared/sentiment-badge";
import { TickerLink } from "@/components/shared/ticker-link";
import { buildRetailDecision } from "@/lib/signal-analytics";
import type { CompanySignal } from "@/lib/types";
import { useWatchlist } from "@/lib/hooks/use-watchlist";
import { isInWatchlist } from "@/lib/watchlist";
import { formatSignalTime, isWithinLastHour } from "@/lib/utils";

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

const decisionToneClass = {
  action: "border-bull/20 bg-bull/5 text-bull",
  caution: "border-bear/20 bg-bear/5 text-bear",
  neutral: "border-slate-500/20 bg-slate-500/5 text-slate-300",
  info: "border-accent/20 bg-accent/5 text-accent",
};

export function SignalCard({
  signal,
  compact = false,
}: {
  signal: CompanySignal;
  compact?: boolean;
}) {
  const { tickers, toggle } = useWatchlist();
  const watched = isInWatchlist(signal.ticker, tickers);
  const decision = buildRetailDecision(signal);
  const isLive = isWithinLastHour(signal.created_at);

  return (
    <article className="rounded-xl border border-white/[0.06] bg-surface-raised/80 transition hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LiveDot active={isLive} />
            <TickerLink ticker={signal.ticker} />
            <SentimentBadge sentiment={signal.sentiment} />
            {signal.speaker && (
              <span className="text-xs text-slate-500">{signal.speaker}</span>
            )}
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-white">
            {signal.company_name}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {formatSignalTime(signal.created_at)} · {signal.source}
          </p>
        </div>
        <AlphaScore signal={signal} />
      </div>

      <div className="space-y-3 px-4 py-3">
        <blockquote className="border-l-2 border-accent/40 pl-3 text-sm italic leading-relaxed text-slate-300">
          &ldquo;{signal.quote}&rdquo;
        </blockquote>

        {signal.action_note && !compact && (
          <p className="text-sm text-slate-400">{signal.action_note}</p>
        )}

        <div
          className={`rounded-lg border px-3 py-2 text-xs ${decisionToneClass[decision.tone]}`}
        >
          <span className="font-semibold">{decision.headline}</span>
          {!compact && (
            <span className="mt-1 block opacity-90">{decision.detail}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <ConfidenceMeter value={signal.confidence} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggle(signal.ticker)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                watched
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-surface-border text-slate-400 hover:text-accent"
              }`}
            >
              {watched ? "★ Watchlist" : "☆ Watchlist"}
            </button>
            <Link
              href={`/signals/${signal.id}`}
              className="rounded-lg border border-surface-border px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-accent/40 hover:text-accent"
            >
              Full context →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
