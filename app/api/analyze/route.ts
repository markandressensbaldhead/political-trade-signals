import { NextResponse } from "next/server";

import { isPipelineAuthorized } from "@/lib/api-auth";
import { runAnalyzePipeline } from "@/lib/analyze-runner";
import { isAnthropicConfigured } from "@/lib/claude";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!isPipelineAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let limit = 10;

  try {
    const body = await request.json();
    if (typeof body.limit === "number" && body.limit > 0 && body.limit <= 50) {
      limit = body.limit;
    }
  } catch {
    // use default limit
  }

  const result = await runAnalyzePipeline(limit);

  if (!result.configured) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    ...result,
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/analyze",
    method: "POST",
    description:
      "Runs Claude analysis on unprocessed raw_statements and writes company_signals.",
    configured: isAnthropicConfigured() && isSupabaseConfigured(),
  });
}
