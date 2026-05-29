import { NextRequest, NextResponse } from "next/server";

import { filterSignals } from "@/lib/signal-analytics";
import { applyScopeFilters } from "@/lib/product-filters";
import {
  countFilteredBelowThresholdToday,
  DISPLAY_CONFIDENCE_THRESHOLD,
  meetsDisplayThreshold,
  sortFeedSignals,
} from "@/lib/signal-display";
import { fetchRecentSignals, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ signals: [], configured: false });
  }

  const params = request.nextUrl.searchParams;
  const search = params.get("search") ?? undefined;
  const ticker = params.get("ticker") ?? undefined;
  const sentiment = params.get("sentiment") ?? undefined;
  const source = params.get("source") ?? undefined;
  const minConfidence = params.get("minConfidence");
  const watchlist = params.get("watchlist");

  try {
    const scoped = applyScopeFilters(
      await fetchRecentSignals({
        limit: 500,
        ticker,
        sentiment: sentiment || undefined,
        source: source || undefined,
        minConfidence: minConfidence ? Number(minConfidence) : undefined,
      })
    );

    const filtered = filterSignals(scoped, {
      search,
      watchlist: watchlist ? watchlist.split(",").filter(Boolean) : undefined,
    });

    const displaySignals = sortFeedSignals(
      filtered.filter((signal) => meetsDisplayThreshold(signal))
    );

    return NextResponse.json({
      signals: displaySignals,
      configured: true,
      count: displaySignals.length,
      filteredBelowThresholdToday: countFilteredBelowThresholdToday(scoped),
      displayThreshold: DISPLAY_CONFIDENCE_THRESHOLD,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load signals";

    return NextResponse.json({ error: message, signals: [] }, { status: 500 });
  }
}
