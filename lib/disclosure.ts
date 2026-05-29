import type { CapitolTradesRecord } from "@/lib/capitol-trades";
import type { CompanySignal } from "@/lib/types";

export const STOCK_ACT_LAG_DAYS = 45;

export function daysSince(isoDate: string): number {
  const time = new Date(isoDate).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.round((Date.now() - time) / 86400000));
}

/** Days remaining in the 45-day STOCK Act disclosure window from a trade or mention date. */
export function getDaysBeforeDisclosure(
  anchorDate: string | null | undefined
): number | null {
  if (!anchorDate) return null;
  const elapsed = daysSince(anchorDate);
  return Math.max(0, STOCK_ACT_LAG_DAYS - elapsed);
}

export type LagSeverity = "low" | "medium" | "high";

export function getDisclosureLagDays(
  tradeDate: string,
  filingDate: string | null
): number | null {
  if (!filingDate) return null;
  const tradeTime = new Date(tradeDate).getTime();
  const filingTime = new Date(filingDate).getTime();
  if (!Number.isFinite(tradeTime) || !Number.isFinite(filingTime)) return null;
  return Math.max(0, Math.round((filingTime - tradeTime) / 86400000));
}

export function getLagSeverity(days: number | null): LagSeverity {
  if (days == null) return "medium";
  if (days <= 30) return "low";
  if (days <= 45) return "medium";
  return "high";
}

export function lagSeverityClass(severity: LagSeverity): string {
  switch (severity) {
    case "low":
      return "text-bull border-bull/20 bg-bull/10";
    case "high":
      return "text-bear border-bear/20 bg-bear/10";
    default:
      return "text-amber-300 border-amber-500/20 bg-amber-500/10";
  }
}

export interface MentionFilingStatus {
  status: "pre_filing" | "filed_after_mention" | "no_mention" | "no_filing_data";
  headline: string;
  detail: string;
  daysSinceMention: number | null;
  daysToFiling: number | null;
  matchingTrade: CapitolTradesRecord | null;
}

export function compareMentionToFilings(
  signals: CompanySignal[],
  trades: CapitolTradesRecord[]
): MentionFilingStatus {
  if (signals.length === 0) {
    return {
      status: "no_mention",
      headline: "No political mentions tracked",
      detail: "Add to watchlist to catch the next mention.",
      daysSinceMention: null,
      daysToFiling: null,
      matchingTrade: null,
    };
  }

  const latestSignal = signals[0];
  const signalTime = new Date(latestSignal.created_at).getTime();
  const daysSinceMention = Math.max(
    0,
    Math.round((Date.now() - signalTime) / 86400000)
  );

  const tradeAfterMention = trades.find(
    (t) => new Date(t.tradeDate).getTime() >= signalTime - 86400000 * 7
  );

  if (!tradeAfterMention) {
    const withinWindow = daysSinceMention <= STOCK_ACT_LAG_DAYS;
    return {
      status: "pre_filing",
      headline: withinWindow
        ? "Pre-filing window — your edge"
        : "Mentioned, no PTR filed yet",
      detail: withinWindow
        ? `Public mention ${daysSinceMention}d ago. Congress PTR filings often lag ~${STOCK_ACT_LAG_DAYS} days — you're ahead of Capitol Trades.`
        : `Last mention ${daysSinceMention} days ago with no matching PTR on record for this ticker.`,
      daysSinceMention,
      daysToFiling: withinWindow ? STOCK_ACT_LAG_DAYS - daysSinceMention : null,
      matchingTrade: null,
    };
  }

  const daysToFiling = tradeAfterMention.filingDate
    ? Math.max(
        0,
        Math.round(
          (new Date(tradeAfterMention.filingDate).getTime() - signalTime) /
            86400000
        )
      )
    : null;

  return {
    status: "filed_after_mention",
    headline: "Congress trade filed after mention",
    detail: `${tradeAfterMention.politicianName} ${tradeAfterMention.type.toLowerCase()}d — filed ${daysToFiling ?? "?"} days after your signal. Compare timing for edge validation.`,
    daysSinceMention,
    daysToFiling,
    matchingTrade: tradeAfterMention,
  };
}
