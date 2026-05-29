import { SignalFeed } from "@/components/signals/signal-feed";
import { WatchlistManager } from "@/components/watchlist/watchlist-manager";

export default function WatchlistPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Watchlist</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track tickers you care about — signals matching your list surface here first.
        </p>
      </div>
      <WatchlistManager />
      <SignalFeed watchlistOnly title="Watchlist signals" showFilters={false} />
    </div>
  );
}
