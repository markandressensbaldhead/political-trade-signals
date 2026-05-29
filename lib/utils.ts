export function formatSignalTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
}

export function formatSignalTimeEt(iso: string): string {
  return `${formatSignalTime(iso)} ET`;
}

export function isWithinLastHour(iso: string): boolean {
  const created = new Date(iso).getTime();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return created >= oneHourAgo;
}

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatSignalDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

export function formatHistoryDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

export function sentimentClass(sentiment: string): string {
  switch (sentiment) {
    case "bullish":
      return "text-bull bg-bull/10 border-bull/20";
    case "bearish":
      return "text-bear bg-bear/10 border-bear/20";
    default:
      return "text-slate-300 bg-slate-500/10 border-slate-500/20";
  }
}
