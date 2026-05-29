import { NextResponse } from "next/server";

import { fetchSignalById, isSupabaseConfigured } from "@/lib/supabase";
import { applyProductFilters } from "@/lib/product-filters";

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

    if (applyProductFilters([signal]).length === 0) {
      return NextResponse.json({ error: "Signal not in feed scope" }, { status: 404 });
    }

    return NextResponse.json({ signal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load signal";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
