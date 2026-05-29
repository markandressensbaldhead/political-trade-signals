import type { RawStatement } from "@/lib/types";
import {
  analyzeStatementForSignals,
  isAnthropicConfigured,
} from "@/lib/claude";
import {
  insertCompanySignals,
  insertRawStatementIfNew,
  isSupabaseConfigured,
  markStatementProcessed,
} from "@/lib/supabase";
import { matchesProductScope } from "@/lib/product-filters";

async function sendTwilioAlert(message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_FROM?.trim();
  const to = process.env.TWILIO_PHONE_TO?.trim();

  if (!accountSid || !authToken || !from || !to) {
    return false;
  }

  const body = new URLSearchParams({ To: to, From: from, Body: message });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  return response.ok;
}

export interface AnalyzeStatementResult {
  statementId: string;
  signalsCreated: number;
  alerted: boolean;
  tickers: string[];
}

export async function analyzeRawStatement(
  statement: RawStatement
): Promise<AnalyzeStatementResult> {
  if (!isAnthropicConfigured()) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const signals = await analyzeStatementForSignals({
    source: statement.source,
    content: statement.content,
    publishedAt: statement.published_at,
  });

  let signalsCreated = 0;
  let alerted = false;
  const tickers: string[] = [];

  if (signals.length > 0) {
    const eligible = signals.filter((signal) => matchesProductScope(signal));

    if (eligible.length === 0) {
      await markStatementProcessed(statement.id);
      return {
        statementId: statement.id,
        signalsCreated: 0,
        alerted: false,
        tickers: [],
      };
    }

    const rows = await insertCompanySignals(
      eligible.map((signal) => ({
        raw_statement_id: statement.id,
        company_name: signal.company_name,
        ticker: signal.ticker.toUpperCase(),
        sentiment: signal.sentiment,
        confidence: signal.confidence,
        quote: signal.quote,
        source: statement.source,
        speaker: signal.speaker ?? null,
        action_note: signal.action_note ?? null,
        exchange: signal.exchange ?? null,
        sector: signal.sector ?? null,
      }))
    );

    signalsCreated = rows.length;
    tickers.push(...rows.map((row) => row.ticker));

    const top = rows.sort((a, b) => b.confidence - a.confidence)[0];
    alerted = top
      ? top.sentiment === "bullish" &&
        (await sendTwilioAlert(
          `Bullish: ${top.ticker} (${Math.round(top.confidence * 100)}%) — "${top.quote.slice(0, 120)}"`
        ))
      : false;
  }

  await markStatementProcessed(statement.id);

  return {
    statementId: statement.id,
    signalsCreated,
    alerted,
    tickers,
  };
}

export interface IngestAndAnalyzeResult {
  inserted: boolean;
  duplicate: boolean;
  analyzed: boolean;
  statementId: string;
  signalsCreated: number;
  alerted: boolean;
  tickers: string[];
}

export async function ingestAndAnalyzeStatement(input: {
  external_id: string;
  source: string;
  content: string;
  published_at: string;
}): Promise<IngestAndAnalyzeResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const { row, inserted } = await insertRawStatementIfNew(input);

  if (!inserted) {
    return {
      inserted: false,
      duplicate: true,
      analyzed: false,
      statementId: row.id,
      signalsCreated: 0,
      alerted: false,
      tickers: [],
    };
  }

  if (!isAnthropicConfigured()) {
    return {
      inserted: true,
      duplicate: false,
      analyzed: false,
      statementId: row.id,
      signalsCreated: 0,
      alerted: false,
      tickers: [],
    };
  }

  const analysis = await analyzeRawStatement(row);

  return {
    inserted: true,
    duplicate: false,
    analyzed: true,
    statementId: analysis.statementId,
    signalsCreated: analysis.signalsCreated,
    alerted: analysis.alerted,
    tickers: analysis.tickers,
  };
}
