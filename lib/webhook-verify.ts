import { createHmac, timingSafeEqual } from "crypto";

export function verifyFttWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader?.trim()) return false;

  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signatureHeader.trim(), "utf8"),
      Buffer.from(expected, "utf8")
    );
  } catch {
    return false;
  }
}

export interface FttWebhookPayload {
  event?: string;
  timestamp?: string;
  data?: {
    id?: string;
    content?: string;
    link?: string;
    published_at?: string;
    categories?: Array<{ name?: string; display_name?: string }>;
    media?: string[];
  };
}

export function parseFttWebhookPayload(rawBody: string): FttWebhookPayload {
  return JSON.parse(rawBody) as FttWebhookPayload;
}

export function fttPayloadToStatement(payload: FttWebhookPayload): {
  external_id: string;
  source: string;
  content: string;
  published_at: string;
} | null {
  const data = payload.data;
  const content = data?.content?.trim();

  if (!content || !data?.id) return null;

  const categories =
    data.categories
      ?.map((category) => category.display_name ?? category.name)
      .filter(Boolean)
      .join(", ") ?? "";

  const enriched = [
    content,
    data.link ? `Link: ${data.link}` : "",
    categories ? `Categories: ${categories}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    external_id: `ftt:${data.id}`,
    source: "Truth Social (Follow Trump's Truth)",
    content: enriched,
    published_at: data.published_at ?? new Date().toISOString(),
  };
}
