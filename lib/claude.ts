import Anthropic from "@anthropic-ai/sdk";

import type { ClaudeSignalResult } from "@/lib/types";
import { isCryptoRelated, isNyseNasdaqTicker, matchesProductScope } from "@/lib/product-filters";
import { normalizeSector } from "@/lib/signal-display";

const MODEL = "claude-sonnet-4-6";

export const ANALYZE_SYSTEM_PROMPT =
  "You are a financial analyst specializing in technology stocks. Read this statement from a US political figure. Identify only publicly traded AI and technology companies listed on NYSE or NASDAQ that are mentioned positively or with implied endorsement. Technology includes: semiconductors, enterprise software, cloud computing, AI infrastructure, defense tech, hardware manufacturers, and consumer electronics. Ignore all other sectors entirely — no banks, no retail, no pharma, no energy, no crypto. For each qualifying company return: company_name, ticker, exchange, sector (pick one: AI, Semiconductors, Cloud, Defense Tech, Hardware, Enterprise Software, Consumer Electronics), sentiment, confidence (0-100), verbatim_quote, and a one_sentence_rationale explaining the signal. Return JSON array only. If no qualifying tech companies are mentioned, return an empty array.";

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  return new Anthropic({ apiKey });
}

const MAJOR_EXCHANGES = new Set(["NYSE", "NASDAQ", "NYQ", "NMS", "NGM", "NCM"]);

function normalizeConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value > 1) return Math.min(1, Math.max(0, value / 100));
  return Math.min(1, Math.max(0, value));
}

function parseClaudeJsonArray(rawText: string): ClaudeSignalResult[] {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? rawText.trim();

  const arrayMatch = candidate.match(/\[[\s\S]*\]/);
  const objectMatch = candidate.match(/\{[\s\S]*\}/);

  let parsed: unknown;
  try {
    if (arrayMatch) {
      parsed = JSON.parse(arrayMatch[0]);
    } else if (objectMatch) {
      const obj = JSON.parse(objectMatch[0]) as {
        signals?: ClaudeSignalResult[];
      };
      parsed = obj.signals ?? [];
    } else {
      return [];
    }
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];
  return parsed as ClaudeSignalResult[];
}

function normalizeExchange(exchange: string | null | undefined): string | null {
  if (!exchange) return null;
  const upper = exchange.trim().toUpperCase();
  if (upper === "NYSE" || upper === "NYQ") return "NYSE";
  if (upper === "NASDAQ" || upper === "NMS" || upper === "NGM" || upper === "NCM") {
    return "NASDAQ";
  }
  return null;
}

function isMajorExchange(exchange: string | null | undefined): boolean {
  if (!exchange) return false;
  const upper = exchange.trim().toUpperCase();
  return MAJOR_EXCHANGES.has(upper);
}

function mapClaudeResult(raw: ClaudeSignalResult): ClaudeSignalResult | null {
  const quote = (raw.verbatim_quote ?? raw.quote ?? "").trim();
  const ticker = raw.ticker?.trim().toUpperCase() ?? "";
  const exchange = normalizeExchange(raw.exchange);
  const sentiment = raw.sentiment?.toLowerCase();

  if (!raw.company_name?.trim() || !ticker || ticker === "UNKNOWN" || !quote) {
    return null;
  }

  if (sentiment !== "bullish" && sentiment !== "bearish") {
    return null;
  }

  if (!isMajorExchange(raw.exchange) && !isMajorExchange(exchange ?? undefined)) {
    if (!isNyseNasdaqTicker(ticker)) {
      return null;
    }
  }

  const mapped: ClaudeSignalResult = {
    company_name: raw.company_name.trim(),
    ticker,
    exchange: exchange ?? raw.exchange?.trim().toUpperCase() ?? null,
    sector: normalizeSector(raw.sector ?? null),
    sentiment,
    confidence: normalizeConfidence(raw.confidence),
    quote,
    action_note:
      raw.one_sentence_rationale?.trim() ?? raw.action_note?.trim() ?? null,
  };

  if (isCryptoRelated(mapped) || !matchesProductScope(mapped)) {
    return null;
  }

  return mapped;
}

export async function analyzeStatementForSignals(input: {
  source: string;
  content: string;
  publishedAt: string;
}): Promise<ClaudeSignalResult[]> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: ANALYZE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Source: ${input.source}
Published: ${input.publishedAt}

Analyze only the statement text below. Do not browse URLs or external links.

"""
${input.content}
"""`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const rawText = textBlock?.type === "text" ? textBlock.text : "";

  return parseClaudeJsonArray(rawText)
    .map(mapClaudeResult)
    .filter((signal): signal is ClaudeSignalResult => signal != null);
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

const RATIONALE_PROMPT = `You are a senior equity strategist writing for a Bloomberg terminal alert panel.

Given a political trade signal, write exactly ONE paragraph (3-5 sentences) explaining the trade setup for a retail investor. Cover:
- Why the political mention may move the stock
- Key risk or timing consideration around the 45-day congressional disclosure window
- A neutral, analytical tone — no explicit buy/sell commands

Return plain text only. No markdown, bullets, or headers.`;

export async function generateTradeRationale(signal: {
  company_name: string;
  ticker: string;
  sentiment: string;
  confidence: number;
  quote: string;
  source: string;
  action_note?: string | null;
}): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: RATIONALE_PROMPT,
    messages: [
      {
        role: "user",
        content: `Company: ${signal.company_name} (${signal.ticker})
Sentiment: ${signal.sentiment}
Confidence: ${Math.round(signal.confidence * 100)}%
Source: ${signal.source}
Quote: "${signal.quote}"
${signal.action_note ? `Context: ${signal.action_note}` : ""}

Write the trade rationale paragraph.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text.trim() : "";
}
