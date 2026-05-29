export interface RawStatement {
  id: string;
  external_id: string | null;
  source: string;
  content: string;
  published_at: string;
  processed: boolean;
  created_at: string;
}

export interface CompanySignal {
  id: string;
  raw_statement_id: string | null;
  company_name: string;
  ticker: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  quote: string;
  source: string;
  created_at: string;
}

export interface ClaudeSignalResult {
  company_name: string;
  ticker: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  quote: string;
}
