"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TickerSearch } from "@/components/layout/ticker-search";

const NAV = [
  { href: "/dashboard", label: "Command Center" },
  { href: "/signals", label: "Signal Feed" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/settings", label: "Status" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="finance-grid min-h-screen">
      <header className="sticky top-0 z-40 border-b border-surface-border/80 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="group">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
              Bullish equities · no crypto
            </p>
              <h1 className="text-lg font-semibold tracking-tight text-white transition group-hover:text-accent sm:text-xl">
                Political Trade Signals
              </h1>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <TickerSearch />
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-surface-border/60 px-4 py-2 md:hidden">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-slate-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-surface-border/60 py-6 text-center text-xs text-slate-600">
        Mentions from public statements — bullish equity research only, not investment advice.
      </footer>
    </div>
  );
}
