import {
  insertRawStatementIfNew,
  isSupabaseConfigured,
} from "@/lib/supabase";

const TRUTH_SOCIAL_API = "https://truthsocial.com/api/v1";
const DEFAULT_RSS_URL = "https://trumpstruth.org/feed";
const DEFAULT_USERNAMES = ["realDonaldTrump"];
const TRUMP_ACCOUNT_ID = "107780257626128497";

export interface TruthSocialScrapeResult {
  source: "truth_social";
  configured: boolean;
  scraped: number;
  inserted: number;
  skipped: number;
  method: "mastodon_api" | "rss" | "scrapecreators" | "none";
  error?: string;
}

interface MastodonStatus {
  id: string;
  content: string;
  created_at: string;
  url?: string;
  account?: { acct?: string; display_name?: string };
}

interface MastodonAccount {
  id: string;
  acct: string;
  display_name?: string;
}

interface ScrapeCreatorsResponse {
  posts?: Array<{
    id?: string;
    text?: string;
    content?: string;
    created_at?: string;
    published_at?: string;
    url?: string;
  }>;
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

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function fetchMastodonStatuses(
  accountId: string | null,
  username: string,
  limit = 20
): Promise<MastodonStatus[]> {
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

  return statuses ?? [];
}

function parseRssItems(xml: string): Array<{
  externalId: string;
  content: string;
  publishedAt: string;
  link: string;
}> {
  const items: Array<{
    externalId: string;
    content: string;
    publishedAt: string;
    link: string;
  }> = [];

  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  for (const block of itemMatches) {
    const link =
      block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() ??
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
      ? `trumpstruth:${statusId}`
      : `trumpstruth:${Buffer.from(link || content).toString("base64url").slice(0, 32)}`;

    items.push({
      externalId,
      content,
      publishedAt: pubDate
        ? new Date(pubDate).toISOString()
        : new Date().toISOString(),
      link,
    });
  }

  return items;
}

async function scrapeTruthSocialRss(
  feedUrl: string,
  limit = 20
): Promise<Array<{ externalId: string; content: string; publishedAt: string }>> {
  const response = await fetch(feedUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Truth Social RSS fetch failed (${response.status})`);
  }

  const xml = await response.text();
  return parseRssItems(xml).slice(0, limit);
}

async function scrapeScrapeCreatorsPosts(
  userId: string,
  limit = 20
): Promise<Array<{ externalId: string; content: string; publishedAt: string }>> {
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
  const posts = payload.posts ?? [];

  return posts
    .map((post) => {
      const content = stripHtml(post.text ?? post.content ?? "").trim();
      if (!content) return null;

      return {
        externalId: post.id ? `truthsocial:${post.id}` : `truthsocial:${content.slice(0, 32)}`,
        content,
        publishedAt: post.created_at ?? post.published_at ?? new Date().toISOString(),
      };
    })
    .filter(Boolean) as Array<{
    externalId: string;
    content: string;
    publishedAt: string;
  }>;
}

async function persistTruthPosts(
  posts: Array<{ externalId: string; content: string; publishedAt: string }>,
  sourceLabel: string
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const post of posts) {
    const result = await insertRawStatementIfNew({
      external_id: post.externalId,
      source: sourceLabel,
      content: post.content,
      published_at: post.publishedAt,
    });

    if (result.inserted) inserted += 1;
    else skipped += 1;
  }

  return { inserted, skipped };
}

export function isTruthSocialConfigured(): boolean {
  return Boolean(
    process.env.TRUTH_SOCIAL_ACCESS_TOKEN?.trim() ||
      process.env.SCRAPECREATORS_API_KEY?.trim() ||
      process.env.TRUTH_SOCIAL_RSS_URL?.trim() ||
      process.env.TRUTH_SOCIAL_USERNAMES?.trim()
  );
}

export async function scrapeTruthSocialPosts(
  limit = 20
): Promise<TruthSocialScrapeResult> {
  if (!isSupabaseConfigured()) {
    return {
      source: "truth_social",
      configured: false,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      method: "none",
      error: "Supabase is not configured",
    };
  }

  const usernames = getTruthSocialUsernames();
  const rssUrl = process.env.TRUTH_SOCIAL_RSS_URL?.trim() || DEFAULT_RSS_URL;
  const collected: Array<{
    externalId: string;
    content: string;
    publishedAt: string;
  }> = [];

  let method: TruthSocialScrapeResult["method"] = "rss";
  let error: string | undefined;

  if (process.env.TRUTH_SOCIAL_ACCESS_TOKEN?.trim()) {
    method = "mastodon_api";

    for (const username of usernames) {
      const statuses = await fetchMastodonStatuses(
        username.toLowerCase() === "realdonaldtrump" ? TRUMP_ACCOUNT_ID : null,
        username,
        limit
      );

      for (const status of statuses) {
        const content = stripHtml(status.content);
        if (!content) continue;

        collected.push({
          externalId: `truthsocial:${status.id}`,
          content,
          publishedAt: status.created_at,
        });
      }
    }

    if (collected.length === 0) {
      error = "Mastodon API returned no posts; falling back to RSS";
      method = "rss";
    }
  }

  if (collected.length === 0 && process.env.SCRAPECREATORS_API_KEY?.trim()) {
    try {
      const posts = await scrapeScrapeCreatorsPosts(TRUMP_ACCOUNT_ID, limit);
      if (posts.length > 0) {
        collected.push(...posts);
        method = "scrapecreators";
        error = undefined;
      }
    } catch (err) {
      error =
        err instanceof Error ? err.message : "ScrapeCreators fetch failed";
    }
  }

  if (collected.length === 0) {
    try {
      const rssPosts = await scrapeTruthSocialRss(rssUrl, limit);
      collected.push(...rssPosts);
      method = "rss";
      error = undefined;
    } catch (err) {
      return {
        source: "truth_social",
        configured: true,
        scraped: 0,
        inserted: 0,
        skipped: 0,
        method: "none",
        error:
          err instanceof Error
            ? err.message
            : "Truth Social RSS fetch failed",
      };
    }
  }

  const { inserted, skipped } = await persistTruthPosts(
    collected,
    "Truth Social"
  );

  return {
    source: "truth_social",
    configured: true,
    scraped: collected.length,
    inserted,
    skipped,
    method,
    error,
  };
}
