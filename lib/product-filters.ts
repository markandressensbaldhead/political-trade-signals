import type { CompanySignal } from "@/lib/types";

/** US-listed names commonly tied to crypto — excluded from the feed. */
export const CRYPTO_TICKERS = new Set([
  "BTC",
  "ETH",
  "COIN",
  "MSTR",
  "MARA",
  "RIOT",
  "CLSK",
  "HUT",
  "BITF",
  "GBTC",
  "BITO",
  "ETHE",
  "BKKT",
]);

const CRYPTO_KEYWORDS =
  /\b(bitcoin|btc|ethereum|ether|crypto(currency)?|blockchain|dogecoin|doge|solana|nft|web3|binance|coinbase)\b/i;

export function isCryptoRelated(input: {
  ticker: string;
  company_name: string;
  quote: string;
}): boolean {
  const ticker = input.ticker.toUpperCase();
  if (CRYPTO_TICKERS.has(ticker)) return true;

  const haystack = `${input.company_name} ${input.quote}`.toLowerCase();
  return CRYPTO_KEYWORDS.test(haystack);
}

export function isBullishSignal(signal: Pick<CompanySignal, "sentiment">): boolean {
  return signal.sentiment === "bullish";
}

/** Product scope: bullish equity mentions only, no crypto. */
export function applyProductFilters(signals: CompanySignal[]): CompanySignal[] {
  return signals.filter(
    (signal) => isBullishSignal(signal) && !isCryptoRelated(signal)
  );
}

export const PRODUCT_SENTIMENT = "bullish" as const;
