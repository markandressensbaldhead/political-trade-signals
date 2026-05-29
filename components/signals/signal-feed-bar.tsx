"use client";

import type { SignalSector } from "@/lib/types";
import { resolveSignalSector } from "@/lib/signal-display";

export type FeedToggle = "all" | "bullish" | "high_conviction";

export type SectorFilter = "all" | SignalSector;

const SENTIMENT_TOGGLES: { id: FeedToggle; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "bullish", label: "BULLISH ONLY" },
  { id: "high_conviction", label: "HIGH CONVICTION" },
];

export const SECTOR_FILTERS: { id: SectorFilter; label: string }[] = [
  { id: "all", label: "ALL SECTORS" },
  { id: "AI", label: "AI" },
  { id: "Semiconductors", label: "SEMICONDUCTORS" },
  { id: "Cloud", label: "CLOUD" },
  { id: "Defense Tech", label: "DEFENSE TECH" },
  { id: "Hardware", label: "HARDWARE" },
  { id: "Enterprise Software", label: "ENTERPRISE SW" },
  { id: "Consumer Electronics", label: "CONSUMER ELEC" },
];

function ToggleButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide transition ${
        selected
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-[#1e2936] bg-[#0a0f14] text-slate-500 hover:border-[#2a3544] hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

export function SignalFeedBar({
  active,
  onChange,
  sector,
  onSectorChange,
  count,
}: {
  active: FeedToggle;
  onChange: (next: FeedToggle) => void;
  sector: SectorFilter;
  onSectorChange: (next: SectorFilter) => void;
  count: number;
}) {
  return (
    <div className="space-y-3 border-b border-[#1a2332] pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {SENTIMENT_TOGGLES.map((toggle) => (
            <ToggleButton
              key={toggle.id}
              selected={active === toggle.id}
              label={toggle.label}
              onClick={() => onChange(toggle.id)}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] text-slate-600">
          {count} {count === 1 ? "ALERT" : "ALERTS"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SECTOR_FILTERS.map((filter) => (
          <ToggleButton
            key={filter.id}
            selected={sector === filter.id}
            label={filter.label}
            onClick={() => onSectorChange(filter.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function applyFeedToggle<
  T extends { sentiment: string; confidence: number },
>(signals: T[], toggle: FeedToggle): T[] {
  switch (toggle) {
    case "bullish":
      return signals.filter((s) => s.sentiment === "bullish");
    case "high_conviction":
      return signals.filter((s) => s.confidence >= 0.9);
    default:
      return signals;
  }
}

export function applySectorFilter<
  T extends { ticker: string; sector?: SignalSector | null },
>(signals: T[], sector: SectorFilter): T[] {
  if (sector === "all") return signals;
  return signals.filter((s) => resolveSignalSector(s) === sector);
}
