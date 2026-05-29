"use client";

import { useCallback, useEffect, useState } from "react";

import type { CompanySignal } from "@/lib/types";

export interface SignalQuery {
  search?: string;
  ticker?: string;
  sentiment?: string;
  source?: string;
  minConfidence?: number;
  watchlist?: string[];
}

function buildQueryString(query: SignalQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.ticker) params.set("ticker", query.ticker);
  if (query.sentiment) params.set("sentiment", query.sentiment);
  if (query.source) params.set("source", query.source);
  if (query.minConfidence != null) {
    params.set("minConfidence", String(query.minConfidence));
  }
  if (query.watchlist?.length) {
    params.set("watchlist", query.watchlist.join(","));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useSignals(query: SignalQuery = {}, pollMs = 30_000) {
  const [signals, setSignals] = useState<CompanySignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const queryKey = JSON.stringify(query);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/signals${buildQueryString(JSON.parse(queryKey) as SignalQuery)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        signals?: CompanySignal[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load signals");
      }

      setSignals(payload.signals ?? []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load signals");
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, pollMs);
    return () => clearInterval(interval);
  }, [load, pollMs]);

  return { signals, loading, error, lastUpdated, refresh: load };
}
