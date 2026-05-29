import { NextRequest, NextResponse } from "next/server";

import { getMarketQuote, getMarketQuotes } from "@/lib/market";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const batch = request.nextUrl.searchParams.get("batch");

  try {
    if (batch) {
      const tickers = batch.split(",").filter(Boolean);
      const quotes = await getMarketQuotes(tickers);
      return NextResponse.json({ quotes });
    }

    const quote = await getMarketQuote(params.symbol);
    return NextResponse.json({ quote });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load market data";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
