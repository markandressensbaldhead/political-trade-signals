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
  accent?: "bull" | "accent";
}) {
  const valueColor =
    accent === "bull"
      ? "text-bull"
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Bullish (24h)"
        value={stats.last24h}
        hint="Equity mentions only · no crypto"
        accent="bull"
      />
      <StatCard
        label="High conviction"
        value={stats.highConfidence}
        hint="≥75% confidence"
        accent="accent"
      />
      <StatCard
        label="Avg confidence"
        value={formatConfidence(stats.avgConfidence)}
        hint="Across bullish signals"
      />
      <StatCard
        label="All-time tracked"
        value={stats.total}
        hint="Bullish non-crypto feed"
      />
    </div>
  );
}
