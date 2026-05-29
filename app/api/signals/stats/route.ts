import { NextResponse } from "next/server";

import {
  computeHotTickers,
  computeSignalStats,
  rankActionableSignals,
} from "@/lib/signal-analytics";
import { fetchRecentSignals, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false });
  }

  try {
    const signals = await fetchRecentSignals(200);
    const stats = computeSignalStats(signals);
    const hotTickers = computeHotTickers(signals);
    const topActionable = rankActionableSignals(signals, 5);

    return NextResponse.json({
      configured: true,
      stats,
      hotTickers,
      topActionable,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load stats";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
