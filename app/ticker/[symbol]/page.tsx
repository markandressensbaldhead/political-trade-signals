import { TickerView } from "@/components/ticker/ticker-view";

export default function TickerPage({
  params,
}: {
  params: { symbol: string };
}) {
  return <TickerView symbol={params.symbol.toUpperCase()} />;
}
