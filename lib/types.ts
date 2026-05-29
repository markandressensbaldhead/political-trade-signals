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
  speaker: string | null;
  action_note: string | null;
  created_at: string;
}

export interface SignalWithStatement extends CompanySignal {
  statement?: RawStatement | null;
}

export interface ClaudeSignalResult {
  company_name: string;
  ticker: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  quote: string;
  speaker?: string | null;
  action_note?: string | null;
}

export interface TickerSummary {
  ticker: string;
  companyName: string;
  signalCount: number;
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
  latestSignal: CompanySignal | null;
  signals: CompanySignal[];
}
