"use client";

import type { CapitolTradesRecord } from "@/lib/capitol-trades";
import {
  getLagSeverity,
  lagSeverityClass,
} from "@/lib/disclosure";
import { formatSignalTime } from "@/lib/utils";

export function CongressTradesPanel({
  trades,
  title = "Congress PTR filings",
  compact = false,
}: {
  trades: CapitolTradesRecord[];
  title?: string;
  compact?: boolean;
}) {
  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
        <p className="text-sm font-semibold text-slate-300">{title}</p>
        <p className="mt-2 text-sm text-slate-500">
          No recent PTR filings for this ticker on Capitol Trades.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised">
      <div className="border-b border-surface-border px-5 py-4">
        <p className="text-sm font-semibold text-slate-300">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Filed trades — often weeks after public mentions
        </p>
      </div>
      <div className="divide-y divide-surface-border/70">
        {trades.slice(0, compact ? 5 : 15).map((trade) => {
          const severity = getLagSeverity(trade.disclosureLagDays);
          return (
            <div
              key={`${trade.politicianId}-${trade.tradeDate}-${trade.type}`}
              className="flex flex-wrap items-start justify-between gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-200">
                  {trade.politicianName}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {trade.party && `${trade.party} · `}
                  {trade.chamber} · {formatSignalTime(trade.tradeDate)}
                </p>
                {!compact && trade.amount && (
                  <p className="mt-1 text-xs text-slate-400">{trade.amount}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                    trade.type === "Purchase"
                      ? "border-bull/20 bg-bull/10 text-bull"
                      : "border-bear/20 bg-bear/10 text-bear"
                  }`}
                >
                  {trade.type}
                </span>
                {trade.disclosureLagDays != null && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${lagSeverityClass(severity)}`}
                  >
                    {trade.disclosureLagDays}d lag
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
