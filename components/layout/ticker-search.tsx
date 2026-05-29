"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function TickerSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const symbol = value.trim().toUpperCase();
    if (symbol) router.push(`/ticker/${encodeURIComponent(symbol)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xs gap-2 sm:w-auto">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        type="text"
        placeholder="Search ticker…"
        className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm uppercase text-slate-100 placeholder:normal-case placeholder:text-slate-500 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
      />
    </form>
  );
}
