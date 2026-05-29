import type { CompanySignal } from "@/lib/types";

export function signalsToCsv(signals: CompanySignal[]): string {
  const headers = [
    "created_at",
    "ticker",
    "company_name",
    "sentiment",
    "confidence",
    "source",
    "speaker",
    "quote",
    "action_note",
  ];

  const rows = signals.map((s) =>
    [
      s.created_at,
      s.ticker,
      s.company_name,
      s.sentiment,
      String(s.confidence),
      s.source,
      s.speaker ?? "",
      s.quote,
      s.action_note ?? "",
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
