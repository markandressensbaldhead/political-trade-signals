"use client";

export const WATCHLIST_STORAGE_KEY = "pts-watchlist";

export function readWatchlist(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((t) => t.toUpperCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function writeWatchlist(tickers: string[]): void {
  if (typeof window === "undefined") return;
  const normalized = Array.from(new Set(tickers.map((t) => t.toUpperCase())));
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(normalized));
}

export function toggleWatchlistTicker(ticker: string): string[] {
  const normalized = ticker.toUpperCase();
  const current = readWatchlist();
  const next = current.includes(normalized)
    ? current.filter((t) => t !== normalized)
    : [...current, normalized];
  writeWatchlist(next);
  return next;
}

export function isInWatchlist(ticker: string, list: string[]): boolean {
  return list.includes(ticker.toUpperCase());
}
