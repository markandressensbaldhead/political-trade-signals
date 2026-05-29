"use client";

import { useEffect, useState } from "react";

function formatEtTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => setTime(formatEtTime(new Date()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4">
      <span className="hidden font-mono text-sm tabular-nums text-slate-300 sm:inline">
        {time} ET
      </span>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-bull" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-bull">
          Live
        </span>
      </div>
    </div>
  );
}
