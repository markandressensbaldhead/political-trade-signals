"use client";

import { useEffect, useState } from "react";

export function FilteredThresholdCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/signals", { cache: "no-store" })
        .then((r) => r.json())
        .then((payload: { filteredBelowThresholdToday?: number }) => {
          setCount(payload.filteredBelowThresholdToday ?? 0);
        })
        .catch(() => setCount(null));
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (count == null) return null;

  return (
    <span className="hidden font-mono text-[10px] text-slate-500 sm:inline">
      {count} signal{count === 1 ? "" : "s"} filtered below threshold today
    </span>
  );
}
