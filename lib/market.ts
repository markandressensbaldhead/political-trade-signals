import { BRAND } from "@/lib/brand";

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

export interface MarketQuote {
  ticker: string;
  price: number | null;
  changePercent: number | null;
  currency: string;
  shortName: string | null;
}

export interface ChartHistoryPoint {
  date: string;
  close: number;
}

export interface ChartHistory {
  ticker: string;
  points: ChartHistoryPoint[];
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/\./g, "-");
}

function yahooHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": `Mozilla/5.0 (compatible; ${BRAND.userAgent}; +${BRAND.url})`,
  };
}

async function fetchChartQuote(ticker: string): Promise<MarketQuote> {
  const normalized = normalizeTicker(ticker);
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(normalized)}?interval=1d&range=1d`;

  const response = await fetch(url, {
    headers: yahooHeaders(),
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance error (${response.status})`);
  }

  const payload = (await response.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          symbol?: string;
          regularMarketPrice?: number;
          chartPreviousClose?: number;
          shortName?: string;
          longName?: string;
          currency?: string;
        };
      }>;
    };
  };

  const meta = payload.chart?.result?.[0]?.meta;
  const price =
    typeof meta?.regularMarketPrice === "number"
      ? meta.regularMarketPrice
      : null;
  const previousClose =
    typeof meta?.chartPreviousClose === "number"
      ? meta.chartPreviousClose
      : null;
  const changePercent =
    price != null && previousClose != null && previousClose !== 0
      ? ((price - previousClose) / previousClose) * 100
      : null;

  return {
    ticker: meta?.symbol ?? normalized,
    price,
    changePercent,
    currency: meta?.currency ?? "USD",
    shortName: meta?.shortName ?? meta?.longName ?? null,
  };
}

export async function getMarketQuotes(
  tickers: string[]
): Promise<Record<string, MarketQuote>> {
  const uniqueTickers = [
    ...new Set(tickers.map(normalizeTicker).filter(Boolean)),
  ];
  const quotes: Record<string, MarketQuote> = {};

  const results = await Promise.all(
    uniqueTickers.map(async (ticker) => {
      try {
        return await fetchChartQuote(ticker);
      } catch {
        return {
          ticker,
          price: null,
          changePercent: null,
          currency: "USD",
          shortName: null,
        } satisfies MarketQuote;
      }
    })
  );

  for (const quote of results) {
    quotes[normalizeTicker(quote.ticker)] = quote;
  }

  return quotes;
}

export async function getMarketQuote(ticker: string): Promise<MarketQuote> {
  const quotes = await getMarketQuotes([ticker]);
  return (
    quotes[normalizeTicker(ticker)] ?? {
      ticker: normalizeTicker(ticker),
      price: null,
      changePercent: null,
      currency: "USD",
      shortName: null,
    }
  );
}

export async function getChartHistory(
  ticker: string,
  range: "5d" | "1mo" | "3mo" = "5d"
): Promise<ChartHistory> {
  const normalized = normalizeTicker(ticker);
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(normalized)}?interval=1d&range=${range}`;

  try {
    const response = await fetch(url, {
      headers: yahooHeaders(),
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return { ticker: normalized, points: [] };
    }

    const payload = (await response.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: (number | null)[] }> };
        }>;
      };
    };

    const result = payload.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const points: ChartHistoryPoint[] = [];

    for (let i = 0; i < timestamps.length; i += 1) {
      const close = closes[i];
      if (close == null) continue;
      points.push({
        date: new Date(timestamps[i] * 1000).toISOString(),
        close,
      });
    }

    return { ticker: normalized, points };
  } catch {
    return { ticker: normalized, points: [] };
  }
}

export async function getPriceAtDate(
  ticker: string,
  isoDate: string
): Promise<number | null> {
  const normalized = normalizeTicker(ticker);
  const target = new Date(isoDate).getTime();
  const period1 = Math.floor((target - 7 * 86400000) / 1000);
  const period2 = Math.floor((target + 86400000) / 1000);
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(normalized)}?interval=1d&period1=${period1}&period2=${period2}`;

  try {
    const response = await fetch(url, {
      headers: yahooHeaders(),
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: (number | null)[] }> };
        }>;
      };
    };

    const result = payload.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    let bestPrice: number | null = null;
    let bestDelta = Infinity;

    for (let i = 0; i < timestamps.length; i += 1) {
      const close = closes[i];
      if (close == null) continue;
      const delta = Math.abs(timestamps[i] * 1000 - target);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestPrice = close;
      }
    }

    return bestPrice;
  } catch {
    return null;
  }
}

export { normalizeTicker };
