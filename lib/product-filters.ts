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

/** News & media companies — excluded from the feed. */
export const NEWS_MEDIA_TICKERS = new Set([
  "FOX",
  "FOXA",
  "NWS",
  "NWSA",
  "NYT",
  "WBD",
  "PARA",
  "PARAA",
  "CMCSA",
  "DIS",
  "GCI",
  "SSP",
  "LBRDA",
  "LBRDK",
  "SIRI",
  "MSGS",
  "TGNA",
  "NXST",
  "GTN",
  "IHRT",
  "CNET",
]);

/** Core AI & tech tickers — product scope is limited to this sector. */
export const AI_TECH_TICKERS = new Set([
  "AAPL",
  "MSFT",
  "GOOGL",
  "GOOG",
  "META",
  "AMZN",
  "NVDA",
  "AMD",
  "INTC",
  "AVGO",
  "QCOM",
  "MU",
  "AMAT",
  "LRCX",
  "KLAC",
  "ASML",
  "TSM",
  "ARM",
  "CRM",
  "ORCL",
  "IBM",
  "ADBE",
  "NOW",
  "INTU",
  "SNOW",
  "PLTR",
  "CRWD",
  "PANW",
  "ZS",
  "FTNT",
  "NET",
  "DDOG",
  "MDB",
  "TEAM",
  "WDAY",
  "VEEV",
  "HUBS",
  "SHOP",
  "UBER",
  "LYFT",
  "TSLA",
  "DELL",
  "HPQ",
  "HPE",
  "CSCO",
  "SMCI",
  "AI",
  "PATH",
  "S",
  "OKTA",
  "TWLO",
  "U",
  "RBLX",
  "SNAP",
  "PINS",
  "TTD",
  "APP",
  "BILL",
  "CFLT",
  "ESTC",
  "GTLB",
  "MNDY",
  "DOCN",
  "IONQ",
  "RGTI",
  "QBTS",
  "SOUN",
  "BBAI",
  "ON",
  "MRVL",
  "TXN",
  "ADI",
  "NXPI",
  "CDNS",
  "SNPS",
  "ANET",
  "KEYS",
  "TER",
  "MPWR",
  "SWKS",
  "QRVO",
  "STX",
  "WDC",
  "NTAP",
  "PSTG",
  "AKAM",
  "FFIV",
  "JNPR",
  "EPAM",
  "GLOB",
  "IT",
  "CTSH",
  "ACN",
  "SAP",
  "ADSK",
  "ANSS",
  "PTC",
  "ROP",
  "TYL",
  "CDW",
  "HP",
]);

const CRYPTO_KEYWORDS =
  /\b(bitcoin|btc|ethereum|ether|crypto(currency)?|blockchain|dogecoin|doge|solana|nft|web3|binance|coinbase)\b/i;

const NEWS_MEDIA_KEYWORDS =
  /\b(news\s*(network|corp|corporation|company|media|outlet|organization)?|media\s*company|newspaper|journalism|journalist|broadcasting|cnn|fox\s*news|foxnews|msnbc|nbc\s*news|abc\s*news|cbs\s*news|cnbc|reuters|associated\s*press|\bap\s*news|politico|the\s*failing\s*new\s*york\s*times|new\s*york\s*times|wall\s*street\s*journal|wsj|washington\s*post|usa\s*today|news\s*corp|warner\s*bros|warner\s*brothers|paramount|comcast|disney\s*\+|huffpost|buzzfeed|substack|daily\s*wire|newsmax|oann|breitbart|huffington)\b/i;

const AI_TECH_KEYWORDS =
  /\b(artificial\s*intelligence|\bai\b|machine\s*learning|deep\s*learning|large\s*language\s*model|\bllm\b|semiconductor|chipmaker|microprocessor|gpu|data\s*center|cloud\s*computing|cybersecurity|enterprise\s*software|saas|tech(nology)?\s*(company|sector|giant|firm)|software\s*company|nvidia|microsoft|google|alphabet|meta\s*platforms|amazon\s*web\s*services|\baws\b|openai|palantir|servicenow|salesforce|oracle|adobe|intel|advanced\s*micro|broadcom|qualcomm|micron|applied\s*materials|lam\s*research|kla\s*corporation|asml|arm\s*holdings|super\s*micro|dell\s*technologies|cisco|workday|snowflake|crowdstrike|palo\s*alto\s*networks|datadog|mongodb|monday\.com|cloudflare|autodesk|synopsys|cadence|apple\s*inc|tesla)\b/i;

/** NYSE / NASDAQ style tickers only — excludes OTC, crypto, and unknown symbols. */
const MAJOR_EXCHANGE_TICKER = /^[A-Z]{1,5}(-[A-Z])?$/;

type ScopeInput = {
  ticker: string;
  company_name: string;
  quote: string;
};

export function isCryptoRelated(input: ScopeInput): boolean {
  const ticker = input.ticker.toUpperCase();
  if (CRYPTO_TICKERS.has(ticker)) return true;

  const haystack = `${input.company_name} ${input.quote}`.toLowerCase();
  return CRYPTO_KEYWORDS.test(haystack);
}

export function isNewsMediaRelated(input: ScopeInput): boolean {
  const ticker = input.ticker.toUpperCase();
  if (NEWS_MEDIA_TICKERS.has(ticker)) return true;

  const haystack = `${input.company_name} ${input.quote}`.toLowerCase();
  return NEWS_MEDIA_KEYWORDS.test(haystack);
}

export function isAiTechRelated(input: ScopeInput): boolean {
  const ticker = input.ticker.toUpperCase();
  if (AI_TECH_TICKERS.has(ticker)) return true;

  const haystack = `${input.company_name} ${input.quote}`.toLowerCase();
  return AI_TECH_KEYWORDS.test(haystack);
}

export function isNyseNasdaqTicker(ticker: string): boolean {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized || normalized === "UNKNOWN") return false;
  return MAJOR_EXCHANGE_TICKER.test(normalized);
}

export function matchesProductScope(input: ScopeInput): boolean {
  return (
    isNyseNasdaqTicker(input.ticker) &&
    !isCryptoRelated(input) &&
    !isNewsMediaRelated(input) &&
    isAiTechRelated(input)
  );
}

export function isBullishSignal(signal: Pick<CompanySignal, "sentiment">): boolean {
  return signal.sentiment === "bullish";
}

/** Product scope: NYSE/NASDAQ AI & tech only — no crypto, no news/media. */
export function applyScopeFilters(signals: CompanySignal[]): CompanySignal[] {
  return signals.filter((signal) => matchesProductScope(signal));
}

/** @deprecated Use applyScopeFilters — bullish filter is now a UI toggle. */
export function applyProductFilters(signals: CompanySignal[]): CompanySignal[] {
  return applyScopeFilters(signals).filter(isBullishSignal);
}

export const PRODUCT_SENTIMENT = "bullish" as const;
