import Anthropic from "@anthropic-ai/sdk";

import type { ClaudeSignalResult } from "@/lib/types";

const MODEL = "claude-sonnet-4-6";

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are a financial analyst monitoring public political figures (presidents, candidates, cabinet members, senators) for company mentions that could move stock prices before official disclosure windows.

Extract ONLY explicit or strongly implied company references from the statement. For each mention return:
- company_name: full company name
- ticker: US stock ticker if known, otherwise best guess or "UNKNOWN"
- sentiment: bullish | bearish | neutral (based on tone toward the company)
- confidence: 0.0 to 1.0 (how clear the mention and sentiment are)
- quote: the exact substring from the statement that triggered the signal

Return JSON only: { "signals": [ ... ] }
If no investable company mentions exist, return { "signals": [] }`;

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

  const parsed = JSON.parse(jsonMatch[0]) as {
    signals?: ClaudeSignalResult[];
  };

  return (parsed.signals ?? []).filter(
    (signal) =>
      signal.company_name &&
      signal.ticker &&
      signal.quote &&
      ["bullish", "bearish", "neutral"].includes(signal.sentiment)
  );
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
