import { SignalFeed } from "@/components/signals/signal-feed";

export default function SignalsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Bullish Signal Feed</h1>
        <p className="mt-1 text-sm text-slate-400">
          Bullish equity mentions only — crypto and negative/neutral tone excluded.
        </p>
      </div>
      <SignalFeed showFilters />
    </div>
  );
}
