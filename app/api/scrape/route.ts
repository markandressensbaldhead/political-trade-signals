import { NextResponse } from "next/server";

import { isPipelineAuthorized } from "@/lib/api-auth";
import { runAnalyzePipeline } from "@/lib/analyze-runner";
import { runScrapePipeline } from "@/lib/scrape-runner";

export async function POST(request: Request) {
  if (!isPipelineAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let newsQuery: string | undefined;
  let truthLimit = 20;
  let analyzeAfterScrape = false;
  let analyzeLimit = 10;

  try {
    const body = await request.json();
    if (typeof body.query === "string" && body.query.trim()) {
      newsQuery = body.query.trim();
    }
    if (typeof body.truthLimit === "number") {
      truthLimit = Math.min(Math.max(body.truthLimit, 1), 50);
    }
    if (body.analyze === true) {
      analyzeAfterScrape = true;
    }
    if (typeof body.analyzeLimit === "number") {
      analyzeLimit = Math.min(Math.max(body.analyzeLimit, 1), 50);
    }
  } catch {
    // defaults
  }

  try {
    const result = await runScrapePipeline({
      newsQuery,
      truthLimit,
      analyzeAfterScrape,
      analyzeLimit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Scrape pipeline failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/scrape",
    method: "POST",
    description:
      "Ingests Truth Social, X, major news RSS/API, and optional NewsAPI into raw_statements.",
    sources: [
      "truth_social",
      "x_feed",
      "news_rss",
      "newsapi",
      "gnews",
    ],
    cron: "/api/cron/scrape",
    publicPoll: "/api/cron/public-poll",
  });
}
