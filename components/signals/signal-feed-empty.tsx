"use client";

import type { CompanySignal } from "@/lib/types";
import { truncateQuote } from "@/lib/signal-feed-utils";
import {
  formatConfidence,
  formatHistoryDate,
  formatSignalDate,
} from "@/lib/utils";

function RecentHistoryTable({ signals }: { signals: CompanySignal[] }) {
  return (
    <section>
      <h3 className="mb-3 font-mono text-xs font-semibold tracking-[0.15em] text-slate-500">
        RECENT HISTORY
      </h3>
      <div className="overflow-x-auto rounded border border-[#1a2332] bg-[#0c1018]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#1a2332] font-mono text-[10px] tracking-wider text-slate-600">
              <th className="px-4 py-2.5 font-semibold">DATE</th>
              <th className="px-4 py-2.5 font-semibold">COMPANY</th>
              <th className="px-4 py-2.5 font-semibold">TICKER</th>
              <th className="px-4 py-2.5 font-semibold">CONFIDENCE</th>
              <th className="px-4 py-2.5 font-semibold">SOURCE</th>
            </tr>
          </thead>
          <tbody>
            {signals.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center font-mono text-xs text-slate-600"
                >
                  No prior signals on record.
                </td>
              </tr>
            ) : (
              signals.map((signal) => (
                <tr
                  key={signal.id}
                  className="border-b border-[#1a2332]/60 last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-500">
                    {formatHistoryDate(signal.created_at)}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 text-slate-300">
                    {signal.company_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-400">
                    {signal.ticker}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-400">
                    {formatConfidence(signal.confidence)}
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-2.5 text-xs text-slate-500">
                    {signal.source}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SignalFeedEmptyState({
  latest,
  history,
}: {
  latest: CompanySignal | null;
  history: CompanySignal[];
}) {
  return (
    <div className="space-y-6">
      <article className="rounded border border-[#1a2332] bg-[#0c1018] px-5 py-5">
        <p className="text-sm leading-relaxed text-slate-400">
          No new signals in the last 24 hours.
          {latest ? (
            <>
              {" "}
              The last flagged company was{" "}
              <span className="font-semibold text-white">
                {latest.company_name}
              </span>{" "}
              on{" "}
              <span className="text-slate-300">
                {formatSignalDate(latest.created_at)}
              </span>
              {" "}
              —{" "}
              <span className="italic text-slate-500">
                &ldquo;{truncateQuote(latest.quote)}&rdquo;
              </span>
            </>
          ) : null}
        </p>
      </article>

      <RecentHistoryTable signals={history} />
    </div>
  );
}
