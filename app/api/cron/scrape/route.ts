import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { runScrapePipeline } from "@/lib/scrape-runner";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScrapePipeline({
      analyzeAfterScrape: true,
      analyzeLimit: 25,
      truthLimit: 20,
    });

    return NextResponse.json({
      success: true,
      cron: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cron scrape failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
