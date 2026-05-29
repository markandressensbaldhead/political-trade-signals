import { NextResponse } from "next/server";

import { isPipelineAuthorized } from "@/lib/api-auth";
import { runAnalyzePipeline } from "@/lib/analyze-runner";
import { isAnthropicConfigured } from "@/lib/claude";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!isPipelineAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let hours = 48;
  let force = false;

  try {
    const body = await request.json();
    if (typeof body.hours === "number" && body.hours > 0 && body.hours <= 168) {
      hours = body.hours;
    }
    if (body.force === true) {
      force = true;
    }
  } catch {
    // use defaults
  }

  const result = await runAnalyzePipeline({ hours, force });

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
      "Analyzes raw_statements from the last 48 hours with Claude and writes company_signals.",
    configured: isAnthropicConfigured() && isSupabaseConfigured(),
    defaults: { hours: 48 },
  });
}
