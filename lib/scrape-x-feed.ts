import {
  persistStatements,
  stripHtml,
  type SourceScrapeResult,
  type StatementDraft,
} from "@/lib/ingest-utils";
import { getPrimaryXHandle } from "@/lib/speaker-attribution";
import { isSupabaseConfigured } from "@/lib/supabase";

const X_API = "https://api.twitter.com/2";

interface XTweet {
  id: string;
  text: string;
  created_at?: string;
}

interface XUserResponse {
  data?: { id: string };
}

interface XTweetsResponse {
  data?: XTweet[];
}

function getXBearerToken(): string | null {
  return (
    process.env.X_BEARER_TOKEN?.trim() ||
    process.env.TWITTER_BEARER_TOKEN?.trim() ||
    null
  );
}

export function isXFeedConfigured(): boolean {
  return Boolean(
    getXBearerToken() ||
      process.env.X_RSS_URL?.trim() ||
      process.env.SCRAPECREATORS_API_KEY?.trim()
  );
}

async function fetchXApiTweets(
  username: string,
  limit = 20
): Promise<StatementDraft[]> {
  const token = getXBearerToken();
  if (!token) return [];

  const userRes = await fetch(
    `${X_API}/users/by/username/${encodeURIComponent(username)}?user.fields=username`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!userRes.ok) {
    throw new Error(`X user lookup failed (${userRes.status})`);
  }

  const userPayload = (await userRes.json()) as XUserResponse;
  const userId = userPayload.data?.id;
  if (!userId) return [];

  const tweetsRes = await fetch(
    `${X_API}/users/${userId}/tweets?max_results=${Math.min(limit, 10)}&tweet.fields=created_at,text&exclude=retweets,replies`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!tweetsRes.ok) {
    throw new Error(`X tweets fetch failed (${tweetsRes.status})`);
  }

  const tweetsPayload = (await tweetsRes.json()) as XTweetsResponse;

  return (tweetsPayload.data ?? []).map((tweet) => ({
    externalId: `x:${tweet.id}`,
    source: "X (Twitter)",
    content: tweet.text.trim(),
    publishedAt: tweet.created_at ?? new Date().toISOString(),
  }));
}

async function fetchXRssBridge(username: string): Promise<StatementDraft[]> {
  const customUrl = process.env.X_RSS_URL?.trim();
  const feedUrl =
    customUrl ||
    `https://rsshub.app/twitter/user/${encodeURIComponent(username)}`;

  const response = await fetch(feedUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "PoliticalTradeSignals/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`X RSS bridge failed (${response.status})`);
  }

  const xml = await response.text();
  const { parseRssItems } = await import("@/lib/ingest-utils");
  return parseRssItems(xml, feedUrl, "X (Twitter)").map((item) => ({
    ...item,
    externalId: item.externalId.startsWith("x:")
      ? item.externalId
      : `x-rss:${item.externalId}`,
  }));
}

async function fetchScrapeCreatorsXTweets(
  username: string,
  limit = 20
): Promise<StatementDraft[]> {
  const apiKey = process.env.SCRAPECREATORS_API_KEY?.trim();
  if (!apiKey) return [];

  const url = new URL("https://api.scrapecreators.com/v1/twitter/user/tweets");
  url.searchParams.set("handle", username);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as {
    tweets?: Array<{
      id?: string;
      text?: string;
      full_text?: string;
      created_at?: string;
    }>;
    data?: Array<{
      id?: string;
      text?: string;
      created_at?: string;
    }>;
  };

  const rows: Array<{
    id?: string;
    text?: string;
    full_text?: string;
    created_at?: string;
  }> = payload.tweets ?? payload.data ?? [];

  return rows
    .map((tweet) => {
      const text = stripHtml(tweet.text ?? tweet.full_text ?? "").trim();
      if (!text || !tweet.id) return null;
      return {
        externalId: `x:${tweet.id}`,
        source: "X (Twitter)",
        content: text,
        publishedAt: tweet.created_at ?? new Date().toISOString(),
      };
    })
    .filter(Boolean) as StatementDraft[];
}

export async function scrapeXFeed(
  limit = 20,
  options?: { stopAfterDuplicateStreak?: number }
): Promise<SourceScrapeResult> {
  if (!isSupabaseConfigured()) {
    return {
      source: "x_feed",
      configured: false,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      error: "Supabase is not configured",
    };
  }

  const username = getPrimaryXHandle();
  let drafts: StatementDraft[] = [];
  let error: string | undefined;

  if (getXBearerToken()) {
    try {
      drafts = await fetchXApiTweets(username, limit);
    } catch (err) {
      error = err instanceof Error ? err.message : "X API failed";
    }
  }

  if (drafts.length === 0 && process.env.SCRAPECREATORS_API_KEY?.trim()) {
    try {
      drafts = await fetchScrapeCreatorsXTweets(username, limit);
    } catch (err) {
      error = err instanceof Error ? err.message : "ScrapeCreators X failed";
    }
  }

  if (drafts.length === 0) {
    try {
      drafts = await fetchXRssBridge(username);
    } catch (err) {
      error = err instanceof Error ? err.message : "X RSS bridge failed";
    }
  }

  if (drafts.length === 0) {
    return {
      source: "x_feed",
      configured: isXFeedConfigured(),
      scraped: 0,
      inserted: 0,
      skipped: 0,
      error:
        error ??
        (isXFeedConfigured()
          ? "No X posts found"
          : "Set X_BEARER_TOKEN, X_RSS_URL, or SCRAPECREATORS_API_KEY"),
    };
  }

  const { inserted, skipped } = await persistStatements(
    drafts.slice(0, limit),
    { stopAfterDuplicateStreak: options?.stopAfterDuplicateStreak }
  );

  return {
    source: "x_feed",
    configured: true,
    scraped: drafts.length,
    inserted,
    skipped,
  };
}
