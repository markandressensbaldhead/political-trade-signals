import { AiTechWatchlist, type WatchlistRow } from "@/components/dashboard/ai-tech-watchlist";
import { SignalFeed } from "@/components/signals/signal-feed";
import { SignalHero } from "@/components/dashboard/signal-hero";
import { AI_TECH_WATCHLIST } from "@/lib/ai-tech-watchlist";
import { applyScopeFilters } from "@/lib/product-filters";
import { fetchRecentSignals, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MS_30D = 30 * 24 * 60 * 60 * 1000;

export default async function SignalsPage() {
  let watchlist: WatchlistRow[] = AI_TECH_WATCHLIST.map((entry) => ({
    ...entry,
    status: "monitoring",
  }));

  if (isSupabaseConfigured()) {
    try {
      const signals = applyScopeFilters(await fetchRecentSignals({ limit: 500 }));
      const activeTickers = new Set(
        signals
          .filter((s) => {
            const ageMs = Date.now() - new Date(s.created_at).getTime();
            return ageMs >= 0 && ageMs < MS_30D;
          })
          .map((s) => s.ticker.toUpperCase())
      );

      watchlist = AI_TECH_WATCHLIST.map((entry) => ({
        ...entry,
        status: activeTickers.has(entry.ticker) ? ("active" as const) : ("monitoring" as const),
      }));
    } catch {
      // use default monitoring status
    }
  }

  return (
    <div className="space-y-8">
      <SignalHero compact />
      <SignalFeed showFilters />
      <AiTechWatchlist entries={watchlist} />
    </div>
  );
}
