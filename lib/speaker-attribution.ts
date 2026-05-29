/** Verified direct-post sources — no quote attribution check needed. */
const DIRECT_SOURCES =
  /truth social|^x \(twitter\)|^x feed|mastodon|scrapecreators twitter/i;

const SPEAKING_PATTERNS = [
  /\btrump (said|says|told|declared|announced|posted|wrote|added|continued|emphasized|claimed|argued|stressed|noted|explained|warned|promised|vowed|called|described|insisted)\b/i,
  /\bpresident trump (said|says|told|declared|announced|posted|wrote|added|continued|emphasized|claimed|argued|warned|promised|vowed|called|insisted)\b/i,
  /\bformer president trump (said|says|told|declared|announced|posted|wrote)\b/i,
  /\bdonald trump (said|says|told|declared|announced|posted|wrote|added|continued|emphasized|claimed|argued|warned|promised|vowed|called|insisted)\b/i,
  /\btrump['’]s (remarks|speech|comments|statement|post|message|words|address|rally)\b/i,
  /\b(speaking|addressing|telling) reporters,.{0,80}trump\b/i,
  /\btrump.{0,40}(speaking|addressed|told reporters|rally|speech|briefing|interview|press conference)\b/i,
  /\b"[^"]{15,}"/, // direct quote — validate Trump nearby below
];

function hasDirectQuoteWithTrump(content: string): boolean {
  const lower = content.toLowerCase();
  if (!lower.includes("trump") && !lower.includes("president")) return false;

  const quoteMatch = content.match(/"([^"]{15,})"/);
  if (!quoteMatch) return false;

  const idx = content.indexOf(quoteMatch[0]);
  const window = content.slice(Math.max(0, idx - 120), idx + quoteMatch[0].length + 40);
  return /\btrump\b/i.test(window) || /\bpresident\b/i.test(window);
}

export function isLikelyTrumpSpeaking(
  content: string,
  source: string
): boolean {
  if (DIRECT_SOURCES.test(source)) return true;

  const text = content.trim();
  if (text.length < 20) return false;

  for (const pattern of SPEAKING_PATTERNS) {
    if (pattern.source.startsWith("\\b\"")) {
      if (hasDirectQuoteWithTrump(text)) return true;
    } else if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

export function getPrimarySpeakerName(): string {
  return process.env.PRIMARY_SPEAKER_NAME?.trim() || "Donald Trump";
}

export function getPrimaryXHandle(): string {
  return (
    process.env.X_USERNAME?.trim() ||
    process.env.TRUTH_SOCIAL_USERNAMES?.split(",")[0]?.trim() ||
    "realDonaldTrump"
  ).replace(/^@/, "");
}
