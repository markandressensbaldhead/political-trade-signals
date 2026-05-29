"use client";

import type {
  QuiverGovContract,
  QuiverInsiderTrade,
  QuiverLobbyingRecord,
} from "@/lib/quiver-alt-data";

function formatMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function TickerAltDataPanel({
  insiders,
  lobbying,
  contracts,
  configured,
}: {
  insiders: QuiverInsiderTrade[];
  lobbying: QuiverLobbyingRecord[];
  contracts: QuiverGovContract[];
  configured: boolean;
}) {
  if (!configured) {
    return (
      <div className="rounded-xl border border-dashed border-surface-border p-5 text-sm text-slate-500">
        Add <code className="text-accent">QUIVERQUANT_API_KEY</code> for insider,
        lobbying, and government contract context on ticker pages.
      </div>
    );
  }

  const empty =
    insiders.length === 0 && lobbying.length === 0 && contracts.length === 0;

  if (empty) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-raised p-5 text-sm text-slate-500">
        No Quiver alt-data rows for this ticker.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {insiders.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Insider trades
          </p>
          <ul className="mt-3 space-y-2">
            {insiders.slice(0, 5).map((row, i) => (
              <li key={`${row.name}-${i}`} className="text-xs text-slate-300">
                <span className="font-medium">{row.name}</span>
                <span className="text-slate-500"> · {row.transaction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lobbying.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Lobbying
          </p>
          <ul className="mt-3 space-y-2">
            {lobbying.slice(0, 5).map((row, i) => (
              <li key={`${row.client}-${i}`} className="text-xs text-slate-300">
                {formatMoney(row.amount)} · {row.client}
              </li>
            ))}
          </ul>
        </div>
      )}

      {contracts.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Gov contracts
          </p>
          <ul className="mt-3 space-y-2">
            {contracts.slice(0, 5).map((row, i) => (
              <li key={`${row.description}-${i}`} className="text-xs text-slate-300">
                {formatMoney(row.amount)} · {row.agency}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
