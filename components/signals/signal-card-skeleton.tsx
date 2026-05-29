export function SignalCardSkeleton() {
  return (
    <article className="animate-pulse rounded border border-[#1a2332] bg-[#0c1018]">
      <div className="border-b border-[#1a2332] px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="h-5 w-16 rounded bg-white/[0.06]" />
          <div className="h-4 w-28 rounded bg-white/[0.04]" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-6 w-40 rounded bg-white/[0.06]" />
          <div className="h-5 w-14 rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div className="rounded border border-[#151c28] bg-[#080b10] px-4 py-5">
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-white/[0.04]" />
            <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
            <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-24 rounded bg-white/[0.04]" />
          <div className="h-7 w-28 rounded bg-white/[0.04]" />
          <div className="h-7 w-32 rounded bg-white/[0.04]" />
        </div>
        <div className="h-10 w-full rounded bg-white/[0.04]" />
      </div>
    </article>
  );
}

export function SignalFeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SignalCardSkeleton key={i} />
      ))}
    </div>
  );
}
