"use client";

import { useState } from "react";

import { TradeSetupDrawer } from "@/components/signals/trade-setup-drawer";
import { getDaysBeforeDisclosure } from "@/lib/disclosure";
import {
  SECTOR_CHIP_CLASS,
  isHighConviction,
  resolveSignalSector,
} from "@/lib/signal-display";
import type { CompanySignal, SignalSector } from "@/lib/types";
import { formatConfidence, formatSignalTimeEt } from "@/lib/utils";

function SentimentBadge({ sentiment }: { sentiment: CompanySignal["sentiment"] }) {
  const bullish = sentiment === "bullish";
  const bearish = sentiment === "bearish";

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${
        bullish
          ? "bg-bull/15 text-bull ring-1 ring-bull/30"
          : bearish
            ? "bg-bear/15 text-bear ring-1 ring-bear/30"
            : "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20"
      }`}
    >
      {bullish ? "BULLISH" : bearish ? "BEARISH" : "NEUTRAL"}
    </span>
  );
}

function SectorChip({ sector }: { sector: SignalSector }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide ring-1 ${SECTOR_CHIP_CLASS[sector]}`}
    >
      {sector.toUpperCase()}
    </span>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-[#1e2936] bg-[#080b10] px-2.5 py-1 font-mono text-[11px]">
      <span className="text-slate-600">{label}</span>
      <span className="text-slate-300">{value}</span>
    </span>
  );
}

export function SignalCard({ signal }: { signal: CompanySignal }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const disclosureDays = getDaysBeforeDisclosure(signal.created_at);
  const highConviction = isHighConviction(signal);
  const sector = resolveSignalSector(signal);

  return (
    <>
      <article
        className={`rounded border bg-[#0c1018] transition hover:border-[#243044] ${
          highConviction
            ? "border-amber-500/40 ring-1 ring-amber-500/20"
            : "border-[#1a2332]"
        }`}
      >
        <div className="border-b border-[#1a2332] px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <SentimentBadge sentiment={signal.sentiment} />
              {highConviction && (
                <span className="inline-flex rounded border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-300">
                  HIGH CONVICTION
                </span>
              )}
            </div>
            <time
              dateTime={signal.created_at}
              className="shrink-0 font-mono text-[11px] text-slate-500"
            >
              {formatSignalTimeEt(signal.created_at)}
            </time>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold leading-tight text-white">
              {signal.company_name}
            </h3>
            <span className="rounded border border-[#1e2936] bg-[#080b10] px-2 py-0.5 font-mono text-xs text-slate-500">
              {signal.ticker}
            </span>
            {sector && <SectorChip sector={sector} />}
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <blockquote className="rounded border border-[#151c28] bg-[#080b10] px-4 py-3.5 text-sm italic leading-relaxed text-slate-400">
            &ldquo;{signal.quote}&rdquo;
          </blockquote>

          <div className="flex flex-wrap gap-2">
            <StatChip label="Source" value={signal.source} />
            <StatChip
              label="Confidence"
              value={formatConfidence(signal.confidence)}
            />
            <StatChip
              label="Days Before Disclosure"
              value={disclosureDays != null ? `${disclosureDays}d` : "—"}
            />
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-full rounded border border-accent/30 bg-accent/10 py-2.5 font-mono text-xs font-semibold tracking-wider text-accent transition hover:border-accent/50 hover:bg-accent/15"
          >
            View Trade Setup
          </button>
        </div>
      </article>

      <TradeSetupDrawer
        signal={signal}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
