import { NextResponse } from "next/server";

import { fetchSignalById, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  try {
    const signal = await fetchSignalById(params.id);

    if (!signal) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    return NextResponse.json({ signal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load signal";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
