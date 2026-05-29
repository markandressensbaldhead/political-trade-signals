"use client";

import { useCallback, useEffect, useState } from "react";

import {
  readWatchlist,
  toggleWatchlistTicker,
  writeWatchlist,
} from "@/lib/watchlist";

export function useWatchlist() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTickers(readWatchlist());
    setReady(true);
  }, []);

  const toggle = useCallback((ticker: string) => {
    const next = toggleWatchlistTicker(ticker);
    setTickers(next);
    return next;
  }, []);

  const add = useCallback((ticker: string) => {
    const normalized = ticker.toUpperCase();
    setTickers((current) => {
      if (current.includes(normalized)) return current;
      const next = [...current, normalized];
      writeWatchlist(next);
      return next;
    });
  }, []);

  const remove = useCallback((ticker: string) => {
    const normalized = ticker.toUpperCase();
    setTickers((current) => {
      const next = current.filter((t) => t !== normalized);
      writeWatchlist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    writeWatchlist([]);
    setTickers([]);
  }, []);

  return { tickers, ready, toggle, add, remove, clear };
}
