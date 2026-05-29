export function SignalHero({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mb-6" : "mb-8 border-b border-surface-border/60 pb-8"}>
      <h1
        className={`font-mono font-semibold tracking-[0.2em] text-white ${
          compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
        }`}
      >
        SIGNAL FEED
      </h1>
      <p
        className={`mt-3 max-w-2xl leading-relaxed text-slate-400 ${
          compact ? "text-sm" : "text-base sm:text-lg"
        }`}
      >
        Real-time flags when Trump publicly endorses a company — before the
        45-day disclosure window closes.
      </p>
    </div>
  );
}
