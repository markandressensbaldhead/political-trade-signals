import type { SignalStats } from "@/lib/signal-analytics";
import { formatConfidence } from "@/lib/utils";

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "bull" | "bear" | "accent";
}) {
  const valueColor =
    accent === "bull"
      ? "text-bull"
      : accent === "bear"
        ? "text-bear"
        : accent === "accent"
          ? "text-accent"
          : "text-white";

  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-2 font-mono text-2xl font-semibold ${valueColor}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function StatsBar({ stats }: { stats: SignalStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Last 24h"
        value={stats.last24h}
        hint="Fresh political mentions"
        accent="accent"
      />
      <StatCard
        label="Bullish"
        value={stats.bullish}
        hint="Positive tone"
        accent="bull"
      />
      <StatCard
        label="Bearish"
        value={stats.bearish}
        hint="Negative tone"
        accent="bear"
      />
      <StatCard
        label="Avg confidence"
        value={formatConfidence(stats.avgConfidence)}
        hint="Model certainty"
      />
      <StatCard
        label="High conviction"
        value={stats.highConfidence}
        hint="≥75% confidence"
      />
    </div>
  );
}
