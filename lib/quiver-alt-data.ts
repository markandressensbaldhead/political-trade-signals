const QUIVER_BASE = "https://api.quiverquant.com/beta";

export interface QuiverInsiderTrade {
  ticker: string;
  name: string;
  tradeDate: string;
  transaction: string;
  amount?: string;
}

export interface QuiverLobbyingRecord {
  ticker: string;
  client: string;
  amount: number;
  year: number;
  issue?: string;
}

export interface QuiverGovContract {
  ticker: string;
  description: string;
  amount: number;
  agency: string;
  date: string;
}

function getQuiverApiKey(): string | null {
  return process.env.QUIVERQUANT_API_KEY?.trim() || null;
}

export function isQuiverAltDataConfigured(): boolean {
  return Boolean(getQuiverApiKey());
}

async function quiverRequest<T>(
  path: string,
  revalidateSeconds = 900
): Promise<T> {
  const apiKey = getQuiverApiKey();
  if (!apiKey) {
    throw new Error("QUIVERQUANT_API_KEY is not configured");
  }

  const response = await fetch(`${QUIVER_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`QuiverQuant API error (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { data?: T[] }).data)
  ) {
    return (value as { data: T[] }).data;
  }
  return [];
}

export async function fetchQuiverInsiderTrades(
  ticker: string,
  limit = 8
): Promise<QuiverInsiderTrade[]> {
  const raw = await quiverRequest<unknown>(
    `/live/insiders/${encodeURIComponent(ticker.toUpperCase())}`
  );
  return asArray<Record<string, unknown>>(raw)
    .slice(0, limit)
    .map((row) => ({
      ticker: String(row.Ticker ?? row.ticker ?? ticker).toUpperCase(),
      name: String(row.Name ?? row.name ?? row.Insider ?? "Unknown"),
      tradeDate: String(row.Date ?? row.date ?? row.TransactionDate ?? ""),
      transaction: String(row.Transaction ?? row.transaction ?? row.Type ?? ""),
      amount: row.Amount != null ? String(row.Amount) : undefined,
    }))
    .filter((row) => row.tradeDate);
}

export async function fetchQuiverLobbying(
  ticker: string,
  limit = 6
): Promise<QuiverLobbyingRecord[]> {
  const raw = await quiverRequest<unknown>(
    `/live/lobbying/${encodeURIComponent(ticker.toUpperCase())}`
  );
  return asArray<Record<string, unknown>>(raw)
    .slice(0, limit)
    .map((row) => ({
      ticker: String(row.Ticker ?? row.ticker ?? ticker).toUpperCase(),
      client: String(row.Client ?? row.client ?? row.Company ?? "Unknown"),
      amount: Number(row.Amount ?? row.amount ?? 0),
      year: Number(row.Year ?? row.year ?? new Date().getFullYear()),
      issue:
        row.Issue != null
          ? String(row.Issue)
          : row.issue != null
            ? String(row.issue)
            : undefined,
    }));
}

export async function fetchQuiverGovContracts(
  ticker: string,
  limit = 6
): Promise<QuiverGovContract[]> {
  const raw = await quiverRequest<unknown>(
    `/live/govcontracts/${encodeURIComponent(ticker.toUpperCase())}`
  );
  return asArray<Record<string, unknown>>(raw)
    .slice(0, limit)
    .map((row) => ({
      ticker: String(row.Ticker ?? row.ticker ?? ticker).toUpperCase(),
      description: String(
        row.Description ?? row.description ?? row.Contract ?? "Contract"
      ),
      amount: Number(row.Amount ?? row.amount ?? 0),
      agency: String(
        row.Agency ?? row.agency ?? row.Department ?? "Federal agency"
      ),
      date: String(row.Date ?? row.date ?? row.AwardDate ?? ""),
    }));
}

export async function fetchQuiverTickerAltData(ticker: string) {
  const symbol = ticker.toUpperCase();

  if (!isQuiverAltDataConfigured()) {
    return {
      insiders: [] as QuiverInsiderTrade[],
      lobbying: [] as QuiverLobbyingRecord[],
      contracts: [] as QuiverGovContract[],
      configured: false,
    };
  }

  const [insiders, lobbying, contracts] = await Promise.all([
    fetchQuiverInsiderTrades(symbol, 8).catch(() => []),
    fetchQuiverLobbying(symbol, 6).catch(() => []),
    fetchQuiverGovContracts(symbol, 6).catch(() => []),
  ]);

  return { insiders, lobbying, contracts, configured: true };
}
