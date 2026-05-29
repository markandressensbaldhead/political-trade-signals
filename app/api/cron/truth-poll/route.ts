import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { runTruthPollPipeline } from "@/lib/scrape-runner";

export const maxDuration = 60;

/** Free Truth Social poller — RSS only, no paid FTT webhook. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runTruthPollPipeline();

    return NextResponse.json({
      success: true,
      cron: true,
      mode: "free_rss_poll",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Truth poll failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
