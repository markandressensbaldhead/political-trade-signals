"use client";

import type { ChartHistoryPoint } from "@/lib/market";

export function PriceSparkline({
  points,
  width = 280,
  height = 64,
  signalDate,
}: {
  points: ChartHistoryPoint[];
  width?: number;
  height?: number;
  signalDate?: string | null;
}) {
  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-surface-border bg-surface text-xs text-slate-500"
        style={{ width, height }}
      >
        No chart data
      </div>
    );
  }

  const closes = points.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const padding = 4;

  const coords = closes.map((close, i) => {
    const x = padding + (i / (closes.length - 1)) * (width - padding * 2);
    const y =
      height - padding - ((close - min) / range) * (height - padding * 2);
    return { x, y, close, date: points[i].date };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const first = closes[0];
  const last = closes[closes.length - 1];
  const up = last >= first;

  let markerX: number | null = null;
  if (signalDate) {
    const target = new Date(signalDate).getTime();
    let bestIdx = 0;
    let bestDelta = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      const delta = Math.abs(new Date(points[i].date).getTime() - target);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIdx = i;
      }
    }
    markerX = coords[bestIdx]?.x ?? null;
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={up ? "#22c55e" : "#ef4444"}
            stopOpacity="0.25"
          />
          <stop
            offset="100%"
            stopColor={up ? "#22c55e" : "#ef4444"}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path
        d={`${path} L${coords[coords.length - 1].x},${height} L${coords[0].x},${height} Z`}
        fill="url(#sparkFill)"
      />
      <path
        d={path}
        fill="none"
        stroke={up ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {markerX != null && (
        <line
          x1={markerX}
          y1={padding}
          x2={markerX}
          y2={height - padding}
          stroke="#10b981"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.8"
        />
      )}
    </svg>
  );
}
