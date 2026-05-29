import { SignalFeed } from "@/components/signals/signal-feed";
import { WatchlistManager } from "@/components/watchlist/watchlist-manager";

export default function WatchlistPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-xl font-semibold tracking-[0.15em] text-white">
          WATCHLIST
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Track tickers you care about — matching signals surface here first.
        </p>
      </div>
      <WatchlistManager />
      <SignalFeed watchlistOnly title="Your watchlist" showFilters={false} />
    </div>
  );
}
