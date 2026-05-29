import { SignalFeed } from "@/components/signals/signal-feed";
import { SignalHero } from "@/components/dashboard/signal-hero";

export default function SignalsPage() {
  return (
    <div className="space-y-6">
      <SignalHero compact />
      <SignalFeed showFilters />
    </div>
  );
}
