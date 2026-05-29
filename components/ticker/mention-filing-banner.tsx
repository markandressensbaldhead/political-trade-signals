import type { MentionFilingStatus } from "@/lib/disclosure";

const statusStyles = {
  pre_filing: "border-accent/30 bg-accent/10",
  filed_after_mention: "border-bull/30 bg-bull/10",
  no_mention: "border-surface-border bg-surface-raised",
  no_filing_data: "border-surface-border bg-surface-raised",
};

export function MentionFilingBanner({ status }: { status: MentionFilingStatus }) {
  return (
    <div
      className={`rounded-xl border p-5 ${statusStyles[status.status]}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
        Mention vs filing timeline
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{status.headline}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        {status.detail}
      </p>
      {status.daysToFiling != null && status.status === "pre_filing" && (
        <p className="mt-3 font-mono text-sm text-accent">
          ~{status.daysToFiling} days left in typical {45}d disclosure window
        </p>
      )}
      {status.matchingTrade && (
        <p className="mt-2 text-xs text-slate-400">
          {status.matchingTrade.politicianName} · {status.matchingTrade.type} ·{" "}
          {status.matchingTrade.amount}
        </p>
      )}
    </div>
  );
}
