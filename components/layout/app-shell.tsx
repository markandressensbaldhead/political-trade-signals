"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LiveClock } from "@/components/layout/live-clock";
import { TickerSearch } from "@/components/layout/ticker-search";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/signals", label: "Signals" },
  { href: "/watchlist", label: "Watchlist" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#06090c]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight text-white transition hover:text-slate-200 sm:text-base"
          >
            Political Trade Signals
          </Link>
          <LiveClock />
        </div>
        <div className="border-t border-white/[0.04]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1">
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href === "/dashboard" && pathname === "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                      active
                        ? "bg-white/[0.06] text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <TickerSearch />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-white/[0.04] py-8 text-center text-xs text-slate-600">
        For research purposes only. Not investment advice.
      </footer>
    </div>
  );
}
