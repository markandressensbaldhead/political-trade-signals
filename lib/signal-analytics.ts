import type { CompanySignal } from "@/lib/types";
import { isWithinLastHour } from "@/lib/utils";

export interface SignalStats {
  total: number;
  last24h: number;
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
  highConfidence: number;
  sources: Record<string, number>;
}

export interface HotTicker {
  ticker: string;
  companyName: string;
  count: number;
  netSentiment: number;
  avgConfidence: number;
  latestAt: string;
  dominantSentiment: CompanySignal["sentiment"];
}

export interface RetailDecision {
  headline: string;
  detail: string;
  tone: "action" | "caution" | "neutral" | "info";
}

const MS_24H = 24 * 60 * 60 * 1000;

export function computeAlphaScore(signal: CompanySignal): number {
  let score = signal.confidence * 65;

  if (signal.sentiment === "bullish") score += 18;
  if (signal.sentiment === "bearish") score += 12;
  if (isWithinLastHour(signal.created_at)) score += 10;

  const source = signal.source.toLowerCase();
  if (source.includes("truth")) score += 5;
  if (signal.action_note) score += 2;

  return Math.min(100, Math.round(score));
}

export function computeSignalStats(signals: CompanySignal[]): SignalStats {
  const cutoff = Date.now() - MS_24H;
  const last24hSignals = signals.filter(
    (s) => new Date(s.created_at).getTime() >= cutoff
  );

  const bullish = last24hSignals.filter((s) => s.sentiment === "bullish").length;
  const bearish = last24hSignals.filter((s) => s.sentiment === "bearish").length;
  const neutral = last24hSignals.filter((s) => s.sentiment === "neutral").length;
  const avgConfidence =
    last24hSignals.length > 0
      ? last24hSignals.reduce((sum, s) => sum + s.confidence, 0) /
        last24hSignals.length
      : 0;
  const highConfidence = last24hSignals.filter((s) => s.confidence >= 0.75).length;

  const sources: Record<string, number> = {};
  for (const signal of last24hSignals) {
    sources[signal.source] = (sources[signal.source] ?? 0) + 1;
  }

  return {
    total: signals.length,
    last24h: last24hSignals.length,
    bullish,
    bearish,
    neutral,
    avgConfidence,
    highConfidence,
    sources,
  };
}

export function computeHotTickers(
  signals: CompanySignal[],
  limit = 8
): HotTicker[] {
  const byTicker = new Map<string, CompanySignal[]>();

  for (const signal of signals) {
    const key = signal.ticker.toUpperCase();
    if (key === "UNKNOWN") continue;
    const bucket = byTicker.get(key) ?? [];
    bucket.push(signal);
    byTicker.set(key, bucket);
  }

  const hot: HotTicker[] = [];

  for (const [ticker, bucket] of byTicker) {
    const sorted = [...bucket].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest = sorted[0];
    const netSentiment = bucket.reduce((sum, s) => {
      if (s.sentiment === "bullish") return sum + 1;
      if (s.sentiment === "bearish") return sum - 1;
      return sum;
    }, 0);
    const avgConfidence =
      bucket.reduce((sum, s) => sum + s.confidence, 0) / bucket.length;

    const sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };
    for (const s of bucket) sentimentCounts[s.sentiment] += 1;
    const dominantSentiment = (
      Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "neutral"
    ) as CompanySignal["sentiment"];

    hot.push({
      ticker,
      companyName: latest.company_name,
      count: bucket.length,
      netSentiment,
      avgConfidence,
      latestAt: latest.created_at,
      dominantSentiment,
    });
  }

  return hot
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
    })
    .slice(0, limit);
}

export function rankActionableSignals(
  signals: CompanySignal[],
  limit = 20
): CompanySignal[] {
  return [...signals]
    .sort((a, b) => computeAlphaScore(b) - computeAlphaScore(a))
    .slice(0, limit);
}

export function buildRetailDecision(signal: CompanySignal): RetailDecision {
  const score = computeAlphaScore(signal);
  const conf = Math.round(signal.confidence * 100);

  if (signal.confidence >= 0.7) {
    return {
      headline: "Research long / add to watchlist",
      detail: `${conf}% confidence bullish mention — often precedes congress filings by ~45 days. Verify catalyst and size before entry.`,
      tone: "action",
    };
  }

  if (score >= 75) {
    return {
      headline: "Worth a deeper look",
      detail: `Alpha score ${score}/100. Read full statement context before acting.`,
      tone: "action",
    };
  }

  return {
    headline: "Lower conviction — wait for confirmation",
    detail: `Confidence ${conf}%. Consider waiting for a clearer bullish mention or second signal.`,
    tone: "info",
  };
}

export function filterSignals(
  signals: CompanySignal[],
  filters: {
    search?: string;
    ticker?: string;
    sentiment?: string;
    source?: string;
    minConfidence?: number;
    watchlist?: string[];
  }
): CompanySignal[] {
  return signals.filter((signal) => {
    if (filters.ticker && signal.ticker.toUpperCase() !== filters.ticker.toUpperCase()) {
      return false;
    }

    if (filters.sentiment && signal.sentiment !== filters.sentiment) {
      return false;
    }

    if (filters.source && signal.source !== filters.source) {
      return false;
    }

    if (
      filters.minConfidence != null &&
      signal.confidence < filters.minConfidence
    ) {
      return false;
    }

    if (filters.watchlist?.length) {
      const set = new Set(filters.watchlist.map((t) => t.toUpperCase()));
      if (!set.has(signal.ticker.toUpperCase())) return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [
        signal.company_name,
        signal.ticker,
        signal.quote,
        signal.source,
        signal.action_note ?? "",
        signal.speaker ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}
