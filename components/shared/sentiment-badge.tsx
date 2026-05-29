import { sentimentClass } from "@/lib/utils";

export function SentimentBadge({
  sentiment,
  size = "sm",
}: {
  sentiment: string;
  size?: "sm" | "md";
}) {
  const sizeClass =
    size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex rounded-full border font-medium capitalize ${sizeClass} ${sentimentClass(sentiment)}`}
    >
      {sentiment}
    </span>
  );
}
