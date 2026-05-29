"use client";

import Link from "next/link";

import type { SignalStrengthEntry } from "@/lib/signal-analytics";

function TrendArrow({ trend }: { trend: SignalStrengthEntry["trend"] }) {
  if (trend === "up") {
    return (
      <span className="font-mono text-sm text-bull" title="Mentions up week over week">
        ↑
      </span>
    );
  }

  if (trend === "down") {
    return (
      <span className="font-mono text-sm text-bear" title="Mentions down week over week">
        ↓
      </span>
    );
  }

  return (
    <span className="font-mono text-sm text-slate-600" title="Mentions flat week over week">
      →
    </span>
  );
}

export function SignalStrengthIndex({
  entries,
}: {
  entries: SignalStrengthEntry[];
}) {
  const maxCount = entries[0]?.count ?? 1;

  return (
    <aside className="w-full shrink-0 lg:w-[280px]">
      <div className="sticky top-24 rounded border border-[#1a2332] bg-[#0c1018]">
        <header className="border-b border-[#1a2332] px-4 py-3">
          <h2 className="font-mono text-[11px] font-semibold tracking-[0.15em] text-slate-400">
            SIGNAL STRENGTH INDEX
          </h2>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
            Top mentions · last 30 days
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center font-mono text-[11px] text-slate-600">
            No repeated mentions yet.
          </p>
        ) : (
          <ul className="divide-y divide-[#1a2332]">
            {entries.map((entry) => {
              const barWidth = Math.max(8, (entry.count / maxCount) * 100);

              return (
                <li key={entry.ticker}>
                  <Link
                    href={`/ticker/${entry.ticker}`}
                    className="block px-4 py-3 transition hover:bg-white/[0.02]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {entry.companyName}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                          {entry.ticker}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 pt-0.5">
                        <span className="font-mono text-xs tabular-nums text-slate-400">
                          {entry.count}
                        </span>
                        <TrendArrow trend={entry.trend} />
                      </div>
                    </div>

                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#080b10]">
                      <div
                        className="h-full rounded-full bg-accent/70 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
