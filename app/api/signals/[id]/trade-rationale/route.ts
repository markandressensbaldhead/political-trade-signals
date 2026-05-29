import { NextResponse } from "next/server";

import { generateTradeRationale, isAnthropicConfigured } from "@/lib/claude";
import { applyScopeFilters } from "@/lib/product-filters";
import { fetchSignalById, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { error: "Analysis unavailable" },
      { status: 503 }
    );
  }

  try {
    const signal = await fetchSignalById(params.id);

    if (!signal || applyScopeFilters([signal]).length === 0) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    const rationale = await generateTradeRationale(signal);

    return NextResponse.json({ rationale });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate rationale";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
