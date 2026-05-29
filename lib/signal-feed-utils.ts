import type { CompanySignal } from "@/lib/types";

const MS_24H = 24 * 60 * 60 * 1000;

export function isWithinLast24Hours(iso: string): boolean {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return false;
  return Date.now() - created < MS_24H;
}

export function sortSignalsByRecent(
  signals: CompanySignal[]
): CompanySignal[] {
  return [...signals].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function truncateQuote(quote: string, max = 160): string {
  const trimmed = quote.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}
