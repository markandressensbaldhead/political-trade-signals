import Link from "next/link";

export function TickerLink({
  ticker,
  className = "",
}: {
  ticker: string;
  className?: string;
}) {
  if (ticker === "UNKNOWN") {
    return (
      <span className={`font-mono text-xs text-slate-500 ${className}`}>
        UNKNOWN
      </span>
    );
  }

  return (
    <Link
      href={`/ticker/${encodeURIComponent(ticker.toUpperCase())}`}
      className={`rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent transition hover:border-accent/40 hover:bg-accent/20 ${className}`}
    >
      {ticker.toUpperCase()}
    </Link>
  );
}
