"use client";

import Link from "next/link";

import type { AiTechWatchlistEntry } from "@/lib/ai-tech-watchlist";

export type WatchlistRow = AiTechWatchlistEntry & {
  status: "active" | "monitoring";
};

export function AiTechWatchlist({ entries }: { entries: WatchlistRow[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-mono text-xs font-semibold tracking-[0.15em] text-slate-400">
          AI/TECH WATCHLIST
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          High-probability targets — public praise, CEO visits, and White House
          alignment
        </p>
      </div>

      <div className="overflow-x-auto rounded border border-[#1a2332] bg-[#0c1018]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#1a2332] font-mono text-[10px] tracking-wider text-slate-600">
              <th className="px-4 py-2.5 font-semibold">TICKER</th>
              <th className="px-4 py-2.5 font-semibold">COMPANY</th>
              <th className="px-4 py-2.5 font-semibold">RELATIONSHIP</th>
              <th className="px-4 py-2.5 font-semibold">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.ticker}
                className="border-b border-[#1a2332]/60 last:border-0"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/ticker/${entry.ticker}`}
                    className="font-mono text-xs font-semibold text-accent hover:underline"
                  >
                    {entry.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{entry.companyName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{entry.reason}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {entry.relationshipTag}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {entry.status === "active" ? (
                    <span className="inline-flex rounded border border-bull/30 bg-bull/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-bull">
                      ACTIVE SIGNAL
                    </span>
                  ) : (
                    <span className="inline-flex rounded border border-[#1e2936] bg-[#080b10] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-slate-500">
                      MONITORING
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
