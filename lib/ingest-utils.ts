export interface StatementDraft {
  externalId: string;
  source: string;
  content: string;
  publishedAt: string;
}

export interface PersistResult {
  inserted: number;
  skipped: number;
  stoppedEarly: boolean;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRssItems(
  xml: string,
  feedUrl: string,
  sourceLabel: string
): StatementDraft[] {
  const items: StatementDraft[] = [];
  const feedKey = new URL(feedUrl).hostname.replace(/\W+/g, "");
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  for (const block of itemMatches) {
    const link =
      block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() ??
      "";
    const guid =
      block.match(/<guid(?:[^>]*)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/i)?.[1]?.trim() ??
      "";
    const description =
      block.match(
        /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i
      )?.[1] ?? "";
    const pubDate =
      block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ?? "";
    const title =
      block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] ??
      "";

    const body = stripHtml(description || title);
    if (!body || body.length < 12) continue;

    const content = link ? `${body}\n\nSource: ${link}` : body;
    const statusId = link.match(/statuses\/(\d+)/i)?.[1];
    const externalId = statusId
      ? `${feedKey}:${statusId}`
      : guid
        ? `${feedKey}:${Buffer.from(guid).toString("base64url").slice(0, 40)}`
        : `${feedKey}:${Buffer.from(content).toString("base64url").slice(0, 32)}`;

    items.push({
      externalId,
      source: sourceLabel,
      content,
      publishedAt: pubDate
        ? new Date(pubDate).toISOString()
        : new Date().toISOString(),
    });
  }

  return items;
}

export async function fetchRssFeed(
  feedUrl: string,
  sourceLabel: string,
  limit = 30
): Promise<StatementDraft[]> {
  const response = await fetch(feedUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "User-Agent": "PoliticalTradeSignals/1.0 (public RSS poller)",
    },
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed for ${feedUrl} (${response.status})`);
  }

  const xml = await response.text();
  return parseRssItems(xml, feedUrl, sourceLabel).slice(0, limit);
}

export async function persistStatements(
  drafts: StatementDraft[],
  options?: { stopAfterDuplicateStreak?: number }
): Promise<PersistResult> {
  const { insertRawStatementIfNew } = await import("@/lib/supabase");

  let inserted = 0;
  let skipped = 0;
  let duplicateStreak = 0;
  const streakLimit = options?.stopAfterDuplicateStreak ?? 0;

  for (const draft of drafts) {
    const result = await insertRawStatementIfNew({
      external_id: draft.externalId,
      source: draft.source,
      content: draft.content,
      published_at: draft.publishedAt,
    });

    if (result.inserted) {
      inserted += 1;
      duplicateStreak = 0;
    } else {
      skipped += 1;
      duplicateStreak += 1;
      if (streakLimit > 0 && duplicateStreak >= streakLimit) {
        return { inserted, skipped, stoppedEarly: true };
      }
    }
  }

  return { inserted, skipped, stoppedEarly: false };
}

export interface SourceScrapeResult {
  source: string;
  configured: boolean;
  scraped: number;
  inserted: number;
  skipped: number;
  filtered?: number;
  error?: string;
  feedsChecked?: string[];
}
