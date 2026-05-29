import { DecisionRail } from "@/components/dashboard/decision-rail";
import {
  getPrimarySpeakerLabel,
  getPublicSourceStatuses,
} from "@/lib/public-sources";

function SourceChip({
  label,
  active,
  hint,
}: {
  label: string;
  active: boolean;
  hint: string;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        active
          ? "border-accent/30 bg-accent/5"
          : "border-surface-border bg-surface/40"
      }`}
      title={hint}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-slate-600"}`}
        />
        <span className="text-xs font-medium text-slate-200">{label}</span>
      </div>
    </div>
  );
}

export function SourcesOverview() {
  const sources = getPublicSourceStatuses();
  const speaker = getPrimarySpeakerLabel();

  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Ingestion sources
      </p>
      <p className="mt-1 text-sm text-slate-300">
        Verified public statements from <span className="text-accent">{speaker}</span> —
        direct posts plus major news reporting his words.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {sources.map((source) => (
          <SourceChip
            key={source.id}
            label={source.label}
            active={source.active}
            hint={source.hint}
          />
        ))}
      </div>
    </section>
  );
}
