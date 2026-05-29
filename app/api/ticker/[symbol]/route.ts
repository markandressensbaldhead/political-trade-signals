import { NextResponse } from "next/server";

import { fetchCapitolTradesByTicker } from "@/lib/capitol-trades";
import { compareMentionToFilings } from "@/lib/disclosure";
import { applyProductFilters, isCryptoRelated } from "@/lib/product-filters";
import {
  getChartHistory,
  getMarketQuote,
  getPriceAtDate,
} from "@/lib/market";
import { fetchTickerSummary, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: { symbol: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const symbol = params.symbol.toUpperCase();

  if (isCryptoRelated({ ticker: symbol, company_name: "", quote: "" })) {
    return NextResponse.json(
      { error: "Crypto tickers are excluded from this feed" },
      { status: 404 }
    );
  }

  try {
    const summary = await fetchTickerSummary(symbol);
    const [quote, chart, congressTrades] = await Promise.all([
      getMarketQuote(symbol),
      getChartHistory(symbol, "1mo"),
      fetchCapitolTradesByTicker(symbol, 30),
    ]);

    let moveSinceFirstSignal: number | null = null;
    const oldest = summary.signals[summary.signals.length - 1];
    if (oldest && quote.price != null) {
      const priceAtSignal = await getPriceAtDate(symbol, oldest.created_at);
      if (priceAtSignal != null && priceAtSignal !== 0) {
        moveSinceFirstSignal =
          ((quote.price - priceAtSignal) / priceAtSignal) * 100;
      }
    }

    const mentionFiling = compareMentionToFilings(
      summary.signals,
      congressTrades
    );

    return NextResponse.json({
      summary,
      quote,
      chart,
      congressTrades,
      mentionFiling,
      moveSinceFirstSignal,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load ticker";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
