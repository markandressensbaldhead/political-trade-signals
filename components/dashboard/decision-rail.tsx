export function DecisionRail() {
  return (
    <div className="rounded-xl border border-accent/20 bg-gradient-to-br from-accent/10 via-surface-raised to-surface-raised p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
        Bullish equity signals · no crypto
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">
        Positive political mentions before PTR filings
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
        We ingest verified public statements from Truth Social, X, and major
        news networks (Reuters, CNN, Fox, CNBC, WSJ, AP, Politico, Bloomberg,
        and more) — only when {` `}
        <span className="text-accent">Trump is actually speaking</span>, not
        third-party commentary. Bullish equity mentions only; crypto excluded.
        Mentions land here before Capitol Trades PTR filings.
      </p>
      <ul className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
        <li className="rounded-lg border border-surface-border/80 bg-surface/50 px-3 py-2">
          <span className="font-medium text-slate-300">1. Scan</span> — hot bullish tickers
        </li>
        <li className="rounded-lg border border-surface-border/80 bg-surface/50 px-3 py-2">
          <span className="font-medium text-slate-300">2. Context</span> — quote + full statement
        </li>
        <li className="rounded-lg border border-surface-border/80 bg-surface/50 px-3 py-2">
          <span className="font-medium text-slate-300">3. Act</span> — watchlist + chart
        </li>
      </ul>
    </div>
  );
}
