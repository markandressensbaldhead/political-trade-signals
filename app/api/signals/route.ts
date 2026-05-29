import { NextRequest, NextResponse } from "next/server";

import { filterSignals } from "@/lib/signal-analytics";
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
    const signals = await fetchRecentSignals({
      limit: 200,
      ticker,
      sentiment: sentiment || undefined,
      source: source || undefined,
      minConfidence: minConfidence ? Number(minConfidence) : undefined,
    });

    const filtered = filterSignals(signals, {
      search,
      watchlist: watchlist ? watchlist.split(",").filter(Boolean) : undefined,
    });

    return NextResponse.json({
      signals: filtered,
      configured: true,
      count: filtered.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load signals";

    return NextResponse.json({ error: message, signals: [] }, { status: 500 });
  }
}
