"use client";

import type { SignalQuery } from "@/lib/hooks/use-signals";

export function SignalFilters({
  query,
  onChange,
  sources,
}: {
  query: SignalQuery;
  onChange: (next: SignalQuery) => void;
  sources: string[];
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">
            Search
          </span>
          <input
            type="search"
            value={query.search ?? ""}
            onChange={(e) => onChange({ ...query, search: e.target.value || undefined })}
            placeholder="Company, quote, speaker…"
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent/50 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">
            Ticker
          </span>
          <input
            type="text"
            value={query.ticker ?? ""}
            onChange={(e) =>
              onChange({
                ...query,
                ticker: e.target.value.toUpperCase() || undefined,
              })
            }
            placeholder="AAPL"
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 font-mono text-sm uppercase text-slate-100 placeholder:normal-case placeholder:text-slate-500 focus:border-accent/50 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">
            Sentiment
          </span>
          <select
            value={query.sentiment ?? ""}
            onChange={(e) =>
              onChange({ ...query, sentiment: e.target.value || undefined })
            }
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-100 focus:border-accent/50 focus:outline-none"
          >
            <option value="">All</option>
            <option value="bullish">Bullish</option>
            <option value="bearish">Bearish</option>
            <option value="neutral">Neutral</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">
            Source
          </span>
          <select
            value={query.source ?? ""}
            onChange={(e) =>
              onChange({ ...query, source: e.target.value || undefined })
            }
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-100 focus:border-accent/50 focus:outline-none"
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-500">
            Min confidence
          </span>
          <select
            value={query.minConfidence ?? ""}
            onChange={(e) =>
              onChange({
                ...query,
                minConfidence: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-100 focus:border-accent/50 focus:outline-none"
          >
            <option value="">Any</option>
            <option value="0.5">50%+</option>
            <option value="0.65">65%+</option>
            <option value="0.75">75%+</option>
            <option value="0.85">85%+</option>
          </select>
        </label>
      </div>
    </div>
  );
}
