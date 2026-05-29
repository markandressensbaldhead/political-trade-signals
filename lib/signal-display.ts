import type { CompanySignal, SignalSector } from "@/lib/types";

/** Minimum confidence (0–1) to show on the public feed. */
export const DISPLAY_CONFIDENCE_THRESHOLD = 0.75;

/** Confidence (0–1) for gold HIGH CONVICTION badge and feed priority. */
export const HIGH_CONVICTION_THRESHOLD = 0.9;

export const SECTOR_CHIP_CLASS: Record<SignalSector, string> = {
  AI: "bg-purple-500/15 text-purple-300 ring-purple-500/30",
  Semiconductors: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
  Cloud: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  "Defense Tech": "bg-red-500/15 text-red-300 ring-red-500/30",
  Hardware: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  "Enterprise Software": "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  "Consumer Electronics": "bg-orange-500/15 text-orange-300 ring-orange-500/30",
};

export function isHighConviction(signal: Pick<CompanySignal, "confidence">): boolean {
  return signal.confidence >= HIGH_CONVICTION_THRESHOLD;
}

export function meetsDisplayThreshold(
  signal: Pick<CompanySignal, "confidence">
): boolean {
  return signal.confidence >= DISPLAY_CONFIDENCE_THRESHOLD;
}

export function sortFeedSignals(signals: CompanySignal[]): CompanySignal[] {
  return [...signals].sort((a, b) => {
    const aHigh = isHighConviction(a);
    const bHigh = isHighConviction(b);
    if (aHigh && !bHigh) return -1;
    if (!aHigh && bHigh) return 1;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export function countFilteredBelowThresholdToday(
  signals: CompanySignal[]
): number {
  const todayEt = getTodayEtKey();

  return signals.filter((signal) => {
    if (signal.confidence >= DISPLAY_CONFIDENCE_THRESHOLD) return false;
    return getTodayEtKey(new Date(signal.created_at)) === todayEt;
  }).length;
}

function getTodayEtKey(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function normalizeSector(raw: string | null | undefined): SignalSector | null {
  if (!raw?.trim()) return null;

  const key = raw.trim().toLowerCase();
  const map: Record<string, SignalSector> = {
    ai: "AI",
    semiconductors: "Semiconductors",
    semiconductor: "Semiconductors",
    cloud: "Cloud",
    "defense tech": "Defense Tech",
    "defense technology": "Defense Tech",
    hardware: "Hardware",
    "enterprise software": "Enterprise Software",
    "consumer electronics": "Consumer Electronics",
  };

  return map[key] ?? null;
}

const TICKER_SECTOR: Partial<Record<string, SignalSector>> = {
  NVDA: "Semiconductors",
  AMD: "Semiconductors",
  INTC: "Semiconductors",
  AVGO: "Semiconductors",
  QCOM: "Semiconductors",
  MU: "Semiconductors",
  AMAT: "Semiconductors",
  LRCX: "Semiconductors",
  KLAC: "Semiconductors",
  ASML: "Semiconductors",
  TSM: "Semiconductors",
  ARM: "Semiconductors",
  ON: "Semiconductors",
  MRVL: "Semiconductors",
  DELL: "Hardware",
  HPQ: "Hardware",
  HPE: "Hardware",
  SMCI: "Hardware",
  AAPL: "Consumer Electronics",
  MSFT: "Enterprise Software",
  ORCL: "Enterprise Software",
  CRM: "Enterprise Software",
  NOW: "Enterprise Software",
  ADBE: "Enterprise Software",
  SNOW: "Enterprise Software",
  PLTR: "Defense Tech",
  GOOGL: "AI",
  GOOG: "AI",
  META: "AI",
  AMZN: "Cloud",
  IBM: "Enterprise Software",
};

export function resolveSignalSector(
  signal: Pick<CompanySignal, "ticker"> & {
    sector?: SignalSector | null;
  }
): SignalSector | null {
  return signal.sector ?? TICKER_SECTOR[signal.ticker.toUpperCase()] ?? null;
}
