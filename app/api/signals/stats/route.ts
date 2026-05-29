import { NextResponse } from "next/server";

import { AI_TECH_WATCHLIST } from "@/lib/ai-tech-watchlist";
import {
  computeHotTickers,
  computeSignalStats,
  computeSignalStrengthIndex,
} from "@/lib/signal-analytics";
import { applyScopeFilters } from "@/lib/product-filters";
import {
  countFilteredBelowThresholdToday,
  meetsDisplayThreshold,
  sortFeedSignals,
} from "@/lib/signal-display";
import { fetchRecentSignals, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const MS_30D = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false });
  }

  try {
    const signals = applyScopeFilters(
      await fetchRecentSignals({ limit: 500 })
    );
    const displaySignals = signals.filter((s) => meetsDisplayThreshold(s));
    const stats = computeSignalStats(displaySignals);
    const hotTickers = computeHotTickers(displaySignals);
    const strengthIndex = computeSignalStrengthIndex(displaySignals, 5);
    const topActionable = sortFeedSignals(
      displaySignals.filter((s) => s.sentiment === "bullish")
    ).slice(0, 5);

    const activeTickers = new Set(
      signals
        .filter((s) => {
          const ageMs = Date.now() - new Date(s.created_at).getTime();
          return ageMs >= 0 && ageMs < MS_30D;
        })
        .map((s) => s.ticker.toUpperCase())
    );

    const watchlist = AI_TECH_WATCHLIST.map((entry) => ({
      ...entry,
      status: activeTickers.has(entry.ticker) ? "active" : "monitoring",
    }));

    return NextResponse.json({
      configured: true,
      stats,
      hotTickers,
      strengthIndex,
      topActionable,
      watchlist,
      filteredBelowThresholdToday: countFilteredBelowThresholdToday(signals),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load stats";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
