import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { runPublicPollPipeline } from "@/lib/scrape-runner";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPublicPollPipeline({
      truthLimit: 30,
      xLimit: 15,
      analyzeLimit: 20,
    });

    return NextResponse.json({
      success: true,
      cron: true,
      pipeline: "public_poll",
      sources: ["truth_social", "x_feed", "news_rss", "newsapi", "gnews"],
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Public poll failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
