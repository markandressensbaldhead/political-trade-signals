export interface AiTechWatchlistEntry {
  ticker: string;
  companyName: string;
  relationshipTag: string;
  reason: string;
}

export const AI_TECH_WATCHLIST: AiTechWatchlistEntry[] = [
  {
    ticker: "DELL",
    companyName: "Dell Technologies",
    relationshipTag: "Repeated Public Praise",
    reason: "Michael Dell relationship, repeated public praise",
  },
  {
    ticker: "NVDA",
    companyName: "Nvidia",
    relationshipTag: "National Competitiveness",
    reason: "AI infrastructure, national competitiveness narrative",
  },
  {
    ticker: "AAPL",
    companyName: "Apple",
    relationshipTag: "CEO White House Visit",
    reason: "Tim Cook White House meetings, manufacturing deals",
  },
  {
    ticker: "MSFT",
    companyName: "Microsoft",
    relationshipTag: "Government AI Contracts",
    reason: "Government AI contracts, OpenAI adjacency",
  },
  {
    ticker: "PLTR",
    companyName: "Palantir",
    relationshipTag: "Defense Tech Alignment",
    reason: "Defense tech, Peter Thiel alignment",
  },
  {
    ticker: "AMD",
    companyName: "Advanced Micro Devices",
    relationshipTag: "Semiconductor Independence",
    reason: "Semiconductor independence narrative",
  },
  {
    ticker: "ORCL",
    companyName: "Oracle",
    relationshipTag: "Cloud Infrastructure",
    reason: "Cloud infrastructure, TikTok deal involvement",
  },
  {
    ticker: "IBM",
    companyName: "IBM",
    relationshipTag: "Government Contracts",
    reason: "American manufacturing, government contracts",
  },
];

export const AI_TECH_WATCHLIST_TICKERS = AI_TECH_WATCHLIST.map((e) => e.ticker);
