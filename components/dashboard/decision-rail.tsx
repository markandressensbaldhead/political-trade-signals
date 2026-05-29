export function DecisionRail() {
  return (
    <div className="rounded-xl border border-accent/20 bg-gradient-to-br from-accent/10 via-surface-raised to-surface-raised p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
        Your edge vs Capitol Trades
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">
        Mentions land here before STOCK Act filings
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
        Congress trade trackers show PTR disclosures after the fact — often weeks
        later. This feed catches when politicians name companies in speeches, Truth
        Social, and news <span className="text-accent">before</span> those formal
        disclosure windows. Use Alpha scores to prioritize what to research first;
        add tickers to your watchlist and drill into full statement context before
        sizing a trade.
      </p>
      <ul className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
        <li className="rounded-lg border border-surface-border/80 bg-surface/50 px-3 py-2">
          <span className="font-medium text-slate-300">1. Scan</span> — hot tickers &amp; high Alpha
        </li>
        <li className="rounded-lg border border-surface-border/80 bg-surface/50 px-3 py-2">
          <span className="font-medium text-slate-300">2. Context</span> — read quote + full statement
        </li>
        <li className="rounded-lg border border-surface-border/80 bg-surface/50 px-3 py-2">
          <span className="font-medium text-slate-300">3. Act</span> — watchlist, chart, your thesis
        </li>
      </ul>
    </div>
  );
}
