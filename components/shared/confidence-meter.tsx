import { formatConfidence } from "@/lib/utils";

export function ConfidenceMeter({
  value,
  showLabel = true,
  width = "w-20",
}: {
  value: number;
  showLabel?: boolean;
  width?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-1.5 ${width} overflow-hidden rounded-full bg-slate-800`}>
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-xs text-slate-300">
          {formatConfidence(value)}
        </span>
      )}
    </div>
  );
}
