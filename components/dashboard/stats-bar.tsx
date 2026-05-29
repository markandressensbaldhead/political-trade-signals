import type { SignalStats } from "@/lib/signal-analytics";
import { formatConfidence } from "@/lib/utils";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-surface-raised/80 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

export function StatsBar({ stats }: { stats: SignalStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Last 24 hours"
        value={stats.last24h}
        hint="New endorsements"
      />
      <StatCard
        label="High conviction"
        value={stats.highConfidence}
        hint="Strongest signals"
      />
      <StatCard
        label="Avg confidence"
        value={formatConfidence(stats.avgConfidence)}
        hint="Signal strength"
      />
      <StatCard
        label="Total tracked"
        value={stats.total}
        hint="All time"
      />
    </div>
  );
}
