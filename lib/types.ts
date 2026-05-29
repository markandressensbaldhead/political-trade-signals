export interface RawStatement {
  id: string;
  external_id: string | null;
  source: string;
  content: string;
  published_at: string;
  processed: boolean;
  created_at: string;
}

export type SignalSector =
  | "AI"
  | "Semiconductors"
  | "Cloud"
  | "Defense Tech"
  | "Hardware"
  | "Enterprise Software"
  | "Consumer Electronics";

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
  exchange: string | null;
  sector: SignalSector | null;
  created_at: string;
}

export interface SignalWithStatement extends CompanySignal {
  statement?: RawStatement | null;
}

export interface ClaudeSignalResult {
  company_name: string;
  ticker: string;
  exchange?: string | null;
  sector?: SignalSector | null;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  quote: string;
  verbatim_quote?: string;
  one_sentence_rationale?: string;
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
