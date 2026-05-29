"use client";

import { useCallback, useEffect, useState } from "react";

import type { HotTicker, SignalStats } from "@/lib/signal-analytics";
import type { CompanySignal } from "@/lib/types";

interface StatsPayload {
  stats: SignalStats;
  hotTickers: HotTicker[];
  topActionable: CompanySignal[];
}

export function useDashboardStats(pollMs = 60_000) {
  const [data, setData] = useState<StatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/signals/stats", { cache: "no-store" });
      const payload = (await response.json()) as StatsPayload & {
        error?: string;
      };
      if (payload.error) throw new Error(payload.error);
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, pollMs);
    return () => clearInterval(interval);
  }, [load, pollMs]);

  return { data, error, loading, refresh: load };
}
