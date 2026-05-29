import { SignalFeed } from "@/components/signals/signal-feed";

export default function SignalsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Signal Feed</h1>
        <p className="mt-1 text-sm text-slate-400">
          Filter, sort, and drill into every political company mention.
        </p>
      </div>
      <SignalFeed showFilters />
    </div>
  );
}
