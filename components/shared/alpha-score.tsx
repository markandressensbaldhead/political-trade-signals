import { computeAlphaScore } from "@/lib/signal-analytics";
import type { CompanySignal } from "@/lib/types";

export function AlphaScore({
  signal,
  size = "sm",
}: {
  signal: CompanySignal;
  size?: "sm" | "lg";
}) {
  const score = computeAlphaScore(signal);
  const tone =
    score >= 80 ? "text-bull" : score >= 60 ? "text-accent" : "text-slate-400";

  return (
    <div className="flex flex-col items-end">
      <span
        className={`font-mono font-semibold ${tone} ${size === "lg" ? "text-2xl" : "text-sm"}`}
      >
        {score}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-slate-500">
        Alpha
      </span>
    </div>
  );
}
