"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { isCryptoRelated } from "@/lib/product-filters";

export function TickerSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const symbol = value.trim().toUpperCase();
    if (!symbol) return;

    if (isCryptoRelated({ ticker: symbol, company_name: "", quote: "" })) {
      setError("Crypto tickers are excluded from this feed.");
      return;
    }

    setError(null);
    router.push(`/ticker/${encodeURIComponent(symbol)}`);
  }

  return (
    <div className="w-full max-w-xs sm:w-auto">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setError(null);
          }}
          type="text"
          placeholder="Search equity ticker…"
          className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm uppercase text-slate-100 placeholder:normal-case placeholder:text-slate-500 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
      </form>
      {error && <p className="mt-1 text-[10px] text-bear">{error}</p>}
    </div>
  );
}
