import { analyzeRawStatement } from "@/lib/ingest-statement";
import { isAnthropicConfigured } from "@/lib/claude";
import { isAnalyzableStatementContent } from "@/lib/statement-utils";
import {
  fetchRecentRawStatements,
  isSupabaseConfigured,
  statementHasSignals,
} from "@/lib/supabase";

export interface AnalyzePipelineResult {
  configured: boolean;
  windowHours: number;
  scanned: number;
  processed: number;
  skipped: number;
  signalsCreated: number;
  results: {
    statementId: string;
    signalsCreated: number;
    alerted: boolean;
    skipped?: boolean;
  }[];
  error?: string;
}

export async function runAnalyzePipeline(
  options: { hours?: number; force?: boolean } = {}
): Promise<AnalyzePipelineResult> {
  const hours = options.hours ?? 48;

  if (!isAnthropicConfigured()) {
    return {
      configured: false,
      windowHours: hours,
      scanned: 0,
      processed: 0,
      skipped: 0,
      signalsCreated: 0,
      results: [],
      error: "ANTHROPIC_API_KEY is not configured",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      windowHours: hours,
      scanned: 0,
      processed: 0,
      skipped: 0,
      signalsCreated: 0,
      results: [],
      error: "Supabase is not configured",
    };
  }

  const statements = await fetchRecentRawStatements(hours);
  const results: AnalyzePipelineResult["results"] = [];
  let processed = 0;
  let skipped = 0;
  let signalsCreated = 0;

  for (const statement of statements) {
    const hasSignals = await statementHasSignals(statement.id);

    if (hasSignals) {
      skipped += 1;
      results.push({
        statementId: statement.id,
        signalsCreated: 0,
        alerted: false,
        skipped: true,
      });
      continue;
    }

    if (statement.processed && !options.force) {
      skipped += 1;
      results.push({
        statementId: statement.id,
        signalsCreated: 0,
        alerted: false,
        skipped: true,
      });
      continue;
    }

    if (!isAnalyzableStatementContent(statement.content)) {
      skipped += 1;
      results.push({
        statementId: statement.id,
        signalsCreated: 0,
        alerted: false,
        skipped: true,
      });
      continue;
    }

    const analysis = await analyzeRawStatement(statement);
    processed += 1;
    signalsCreated += analysis.signalsCreated;
    results.push({
      statementId: analysis.statementId,
      signalsCreated: analysis.signalsCreated,
      alerted: analysis.alerted,
    });
  }

  return {
    configured: true,
    windowHours: hours,
    scanned: statements.length,
    processed,
    skipped,
    signalsCreated,
    results,
  };
}
