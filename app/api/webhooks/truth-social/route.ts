import { NextResponse } from "next/server";

import { ingestAndAnalyzeStatement } from "@/lib/ingest-statement";
import {
  fttPayloadToStatement,
  parseFttWebhookPayload,
  verifyFttWebhookSignature,
} from "@/lib/webhook-verify";

export const runtime = "nodejs";
export const maxDuration = 60;

function getWebhookSecret(): string | null {
  return (
    process.env.FTT_WEBHOOK_SECRET?.trim() ||
    process.env.WEBHOOK_SECRET?.trim() ||
    null
  );
}

export async function POST(request: Request) {
  const secret = getWebhookSecret();

  if (!secret) {
    return NextResponse.json(
      { error: "FTT_WEBHOOK_SECRET is not configured" },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-ftt-signature");

  if (!verifyFttWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload;

  try {
    payload = parseFttWebhookPayload(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const statement = fttPayloadToStatement(payload);

  if (!statement) {
    return NextResponse.json(
      { error: "Missing post content in webhook payload" },
      { status: 400 }
    );
  }

  try {
    const result = await ingestAndAnalyzeStatement(statement);

    return NextResponse.json({
      ok: true,
      event: payload.event ?? "post.created",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/webhooks/truth-social",
    method: "POST",
    provider: "Follow Trump's Truth",
    headers: ["X-Ftt-Signature", "X-Ftt-Event"],
    env: ["FTT_WEBHOOK_SECRET"],
    configured: Boolean(getWebhookSecret()),
  });
}
