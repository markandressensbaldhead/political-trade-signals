import { SignalDetailView } from "@/components/signals/signal-detail-view";

export default function SignalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <SignalDetailView id={params.id} />;
}
