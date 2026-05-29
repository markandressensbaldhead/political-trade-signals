import { NextResponse } from "next/server";

import { fetchRecentSignals, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ signals: [], configured: false });
  }

  try {
    const signals = await fetchRecentSignals(100);
    return NextResponse.json({ signals, configured: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load signals";

    return NextResponse.json({ error: message, signals: [] }, { status: 500 });
  }
}
