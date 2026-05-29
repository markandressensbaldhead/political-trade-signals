import { NextRequest, NextResponse } from "next/server";

import {
  fetchCapitolTradesByTicker,
  fetchCapitolTradesRecent,
  isCapitolTradesConfigured,
} from "@/lib/capitol-trades";

export async function GET(request: NextRequest) {
  if (!isCapitolTradesConfigured()) {
    return NextResponse.json({ trades: [], configured: false });
  }

  const ticker = request.nextUrl.searchParams.get("ticker");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 30);

  try {
    const trades = ticker
      ? await fetchCapitolTradesByTicker(ticker, limit)
      : await fetchCapitolTradesRecent({ pageSize: limit, maxPages: 2 });

    return NextResponse.json({
      trades,
      configured: true,
      count: trades.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load congress trades";

    return NextResponse.json({ error: message, trades: [] }, { status: 500 });
  }
}
