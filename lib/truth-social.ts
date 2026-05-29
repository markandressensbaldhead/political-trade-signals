import {
  insertRawStatementIfNew,
  isSupabaseConfigured,
} from "@/lib/supabase";

const TRUTH_SOCIAL_API = "https://truthsocial.com/api/v1";
const DEFAULT_RSS_FEEDS = ["https://trumpstruth.org/feed"];
const DEFAULT_USERNAMES = ["realDonaldTrump"];
const TRUMP_ACCOUNT_ID = "107780257626128497";

export interface TruthSocialScrapeResult {
  source: "truth_social";
  configured: boolean;
  scraped: number;
  inserted: number;
  skipped: number;
  method: "mastodon_api" | "rss" | "scrapecreators" | "none";
  feedsChecked: string[];
  error?: string;
}

interface MastodonStatus {
  id: string;
  content: string;
  created_at: string;
}

interface MastodonAccount {
  id: string;
}

interface ScrapeCreatorsResponse {
  posts?: Array<{
    id?: string;
    text?: string;
    content?: string;
    created_at?: string;
    published_at?: string;
  }>;
}

export interface TruthPostDraft {
  externalId: string;
  content: string;
  publishedAt: string;
}

function stripHtml(html: string): string {
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

export function getTruthSocialRssFeeds(): string[] {
  const raw = process.env.TRUTH_SOCIAL_RSS_URL?.trim();

  const feeds = (raw ? raw.split(",") : DEFAULT_RSS_FEEDS)
    .map((url) => url.trim())
    .filter(Boolean);

  return feeds.length > 0 ? feeds : DEFAULT_RSS_FEEDS;
}

function getTruthSocialUsernames(): string[] {
  const raw = process.env.TRUTH_SOCIAL_USERNAMES?.trim();
  if (!raw) return DEFAULT_USERNAMES;

  return raw
    .split(",")
    .map((value) => value.trim().replace(/^@/, ""))
    .filter(Boolean);
}

function getTruthSocialHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent":
      "PoliticalTradeSignals/1.0 (+https://github.com; Mastodon-compatible client)",
  };

  const token = process.env.TRUTH_SOCIAL_ACCESS_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function truthSocialRequest<T>(path: string): Promise<T | null> {
  const response = await fetch(`${TRUTH_SOCIAL_API}${path}`, {
    headers: getTruthSocialHeaders(),
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function fetchMastodonStatuses(
  accountId: string | null,
  username: string,
  limit = 20
): Promise<TruthPostDraft[]> {
  let resolvedId = accountId;

  if (!resolvedId) {
    const lookup = await truthSocialRequest<MastodonAccount>(
      `/accounts/lookup?acct=${encodeURIComponent(username)}`
    );
    resolvedId = lookup?.id ?? null;
  }

  if (!resolvedId) return [];

  const params = new URLSearchParams({
    exclude_replies: "true",
    limit: String(limit),
    with_muted: "true",
  });

  const statuses = await truthSocialRequest<MastodonStatus[]>(
    `/accounts/${resolvedId}/statuses?${params.toString()}`
  );

  return (statuses ?? [])
    .map((status) => {
      const content = stripHtml(status.content);
      if (!content) return null;

      return {
        externalId: `truthsocial:${status.id}`,
        content,
        publishedAt: status.created_at,
      };
    })
    .filter(Boolean) as TruthPostDraft[];
}

function parseRssItems(xml: string, feedUrl: string): TruthPostDraft[] {
  const items: TruthPostDraft[] = [];
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

    const content = stripHtml(description || title);
    if (!content || content.length < 8) continue;

    const statusId = link.match(/statuses\/(\d+)/i)?.[1];
    const externalId = statusId
      ? `${feedKey}:${statusId}`
      : guid
        ? `${feedKey}:${Buffer.from(guid).toString("base64url").slice(0, 40)}`
        : `${feedKey}:${Buffer.from(content).toString("base64url").slice(0, 32)}`;

    items.push({
      externalId,
      content,
      publishedAt: pubDate
        ? new Date(pubDate).toISOString()
        : new Date().toISOString(),
    });
  }

  return items;
}

async function fetchRssFeed(
  feedUrl: string,
  limit = 40
): Promise<TruthPostDraft[]> {
  const response = await fetch(feedUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "User-Agent": "PoliticalTradeSignals/1.0 (free RSS poller)",
    },
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed for ${feedUrl} (${response.status})`);
  }

  const xml = await response.text();
  return parseRssItems(xml, feedUrl).slice(0, limit);
}

async function scrapeTruthSocialRssFeeds(
  limit = 40
): Promise<{ posts: TruthPostDraft[]; feedsChecked: string[] }> {
  const feeds = getTruthSocialRssFeeds();
  const posts: TruthPostDraft[] = [];
  const seen = new Set<string>();

  for (const feedUrl of feeds) {
    try {
      const items = await fetchRssFeed(feedUrl, limit);
      for (const item of items) {
        if (seen.has(item.externalId)) continue;
        seen.add(item.externalId);
        posts.push(item);
      }
    } catch (error) {
      console.error(`RSS feed error (${feedUrl}):`, error);
    }
  }

  posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return { posts: posts.slice(0, limit), feedsChecked: feeds };
}

async function scrapeScrapeCreatorsPosts(
  userId: string,
  limit = 20
): Promise<TruthPostDraft[]> {
  const apiKey = process.env.SCRAPECREATORS_API_KEY?.trim();
  if (!apiKey) return [];

  const url = new URL("https://api.scrapecreators.com/v1/truthsocial/user/posts");
  url.searchParams.set("user_id", userId);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ScrapeCreators request failed (${response.status})`);
  }

  const payload = (await response.json()) as ScrapeCreatorsResponse;

  return (payload.posts ?? [])
    .map((post) => {
      const content = stripHtml(post.text ?? post.content ?? "").trim();
      if (!content || !post.id) return null;

      return {
        externalId: `truthsocial:${post.id}`,
        content,
        publishedAt: post.created_at ?? post.published_at ?? new Date().toISOString(),
      };
    })
    .filter(Boolean) as TruthPostDraft[];
}

async function persistTruthPosts(
  posts: TruthPostDraft[],
  sourceLabel: string,
  options?: { stopAfterDuplicateStreak?: number }
): Promise<{ inserted: number; skipped: number; stoppedEarly: boolean }> {
  let inserted = 0;
  let skipped = 0;
  let duplicateStreak = 0;
  const streakLimit = options?.stopAfterDuplicateStreak ?? 0;

  for (const post of posts) {
    const result = await insertRawStatementIfNew({
      external_id: post.externalId,
      source: sourceLabel,
      content: post.content,
      published_at: post.publishedAt,
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

export function isTruthSocialConfigured(): boolean {
  return Boolean(
    process.env.TRUTH_SOCIAL_RSS_URL?.trim() ||
      process.env.TRUTH_SOCIAL_ACCESS_TOKEN?.trim() ||
      process.env.TRUTH_SOCIAL_USERNAMES?.trim() ||
      true
  );
}

export async function scrapeTruthSocialPosts(
  limit = 20,
  options?: { rssOnly?: boolean; stopAfterDuplicateStreak?: number }
): Promise<TruthSocialScrapeResult> {
  if (!isSupabaseConfigured()) {
    return {
      source: "truth_social",
      configured: false,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      method: "none",
      feedsChecked: [],
      error: "Supabase is not configured",
    };
  }

  let method: TruthSocialScrapeResult["method"] = "rss";
  let error: string | undefined;
  let collected: TruthPostDraft[] = [];
  let feedsChecked: string[] = [];

  try {
    const rss = await scrapeTruthSocialRssFeeds(limit);
    collected = rss.posts;
    feedsChecked = rss.feedsChecked;
  } catch (err) {
    error = err instanceof Error ? err.message : "RSS fetch failed";
  }

  if (
    !options?.rssOnly &&
    collected.length === 0 &&
    process.env.TRUTH_SOCIAL_ACCESS_TOKEN?.trim()
  ) {
    method = "mastodon_api";
    const usernames = getTruthSocialUsernames();
    for (const username of usernames) {
      const statuses = await fetchMastodonStatuses(
        username.toLowerCase() === "realdonaldtrump" ? TRUMP_ACCOUNT_ID : null,
        username,
        limit
      );
      collected.push(...statuses);
    }
    if (collected.length === 0) {
      error = "Mastodon API returned no posts";
    }
  }

  if (
    !options?.rssOnly &&
    collected.length === 0 &&
    process.env.SCRAPECREATORS_API_KEY?.trim()
  ) {
    try {
      collected = await scrapeScrapeCreatorsPosts(TRUMP_ACCOUNT_ID, limit);
      if (collected.length > 0) {
        method = "scrapecreators";
        error = undefined;
      }
    } catch (err) {
      error =
        err instanceof Error ? err.message : "ScrapeCreators fetch failed";
    }
  }

  if (collected.length === 0) {
    return {
      source: "truth_social",
      configured: true,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      method: "none",
      feedsChecked,
      error: error ?? "No Truth Social posts found",
    };
  }

  const { inserted, skipped } = await persistTruthPosts(
    collected,
    "Truth Social (RSS)",
    { stopAfterDuplicateStreak: options?.stopAfterDuplicateStreak }
  );

  return {
    source: "truth_social",
    configured: true,
    scraped: collected.length,
    inserted,
    skipped,
    method,
    feedsChecked,
    error,
  };
}
