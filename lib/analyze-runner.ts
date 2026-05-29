import { analyzeRawStatement } from "@/lib/ingest-statement";
import { isAnthropicConfigured } from "@/lib/claude";
import {
  fetchUnprocessedStatements,
  isSupabaseConfigured,
} from "@/lib/supabase";

export interface AnalyzePipelineResult {
  configured: boolean;
  processed: number;
  results: {
    statementId: string;
    signalsCreated: number;
    alerted: boolean;
  }[];
  error?: string;
}

export async function runAnalyzePipeline(
  limit = 10
): Promise<AnalyzePipelineResult> {
  if (!isAnthropicConfigured()) {
    return {
      configured: false,
      processed: 0,
      results: [],
      error: "ANTHROPIC_API_KEY is not configured",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      processed: 0,
      results: [],
      error: "Supabase is not configured",
    };
  }

  const statements = await fetchUnprocessedStatements(limit);
  const results: AnalyzePipelineResult["results"] = [];

  for (const statement of statements) {
    const analysis = await analyzeRawStatement(statement);
    results.push({
      statementId: analysis.statementId,
      signalsCreated: analysis.signalsCreated,
      alerted: analysis.alerted,
    });
  }

  return {
    configured: true,
    processed: statements.length,
    results,
  };
}
