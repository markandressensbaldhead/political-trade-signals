import Anthropic from "@anthropic-ai/sdk";

import type { ClaudeSignalResult } from "@/lib/types";
import { isCryptoRelated } from "@/lib/product-filters";

const MODEL = "claude-sonnet-4-6";

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are a financial analyst monitoring Donald Trump and other public political figures for company mentions that could move stock prices before official disclosure windows.

Input may come from Truth Social, X (Twitter), Reuters, CNN, Fox News, CNBC, WSJ, AP, Politico, Bloomberg, or other verified public statements where Trump is speaking.

SCOPE (strict):
- Extract ONLY bullish mentions — positive tone, praise, deals, tariffs helping, contracts, investment, or clearly favorable policy toward the company.
- Skip bearish, neutral, or mixed mentions entirely.
- Skip ALL cryptocurrency and digital-asset references (Bitcoin, Ethereum, crypto exchanges, miners, blockchain tokens, stablecoins, NFTs, etc.).
- Skip companies whose primary business is crypto (e.g. Coinbase, MicroStrategy as a Bitcoin proxy, crypto miners).

For each qualifying mention return:
- company_name: full company name
- ticker: US equity ticker if known, otherwise best guess or "UNKNOWN"
- sentiment: must be "bullish"
- confidence: 0.0 to 1.0 (how clear the mention and bullish tone are)
- quote: the exact substring from the statement that triggered the signal
- speaker: who said it (name/title if identifiable, else null)
- action_note: one plain-English sentence for a retail long-bias trader — why this bullish mention might matter (policy, tariff, contract, praise). No buy/sell advice.

Return JSON only: { "signals": [ ... ] }
If no qualifying bullish non-crypto equity mentions exist, return { "signals": [] }`;

export async function analyzeStatementForSignals(input: {
  source: string;
  content: string;
  publishedAt: string;
}): Promise<ClaudeSignalResult[]> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Source: ${input.source}
Published: ${input.publishedAt}

Statement:
"""
${input.content}
"""

Extract company signals as JSON.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const rawText = textBlock?.type === "text" ? textBlock.text : "";

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return [];
  }

  let parsed: { signals?: ClaudeSignalResult[] };
  try {
    parsed = JSON.parse(jsonMatch[0]) as { signals?: ClaudeSignalResult[] };
  } catch {
    return [];
  }

  return (parsed.signals ?? []).filter(
    (signal) =>
      signal.company_name &&
      signal.ticker &&
      signal.quote &&
      signal.sentiment === "bullish" &&
      !isCryptoRelated(signal)
  );
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
