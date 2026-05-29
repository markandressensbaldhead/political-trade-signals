import {
  fetchRssFeed,
  persistStatements,
  type SourceScrapeResult,
  type StatementDraft,
} from "@/lib/ingest-utils";
import { isLikelyTrumpSpeaking } from "@/lib/speaker-attribution";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Free Google News RSS — major networks reporting Trump speaking. */
export const DEFAULT_NEWS_RSS_FEEDS: Array<{ url: string; label: string }> = [
  {
    url: "https://news.google.com/rss/search?q=Donald+Trump+said+when:2d&hl=en-US&gl=US&ceid=US:en",
    label: "Google News · Trump said",
  },
  {
    url: "https://news.google.com/rss/search?q=Trump+speech+OR+Trump+rally+when:3d&hl=en-US&gl=US&ceid=US:en",
    label: "Google News · speeches",
  },
  {
    url: "https://news.google.com/rss/search?q=site:reuters.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "Reuters",
  },
  {
    url: "https://news.google.com/rss/search?q=site:apnews.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "AP News",
  },
  {
    url: "https://news.google.com/rss/search?q=site:cnn.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "CNN",
  },
  {
    url: "https://news.google.com/rss/search?q=site:foxnews.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "Fox News",
  },
  {
    url: "https://news.google.com/rss/search?q=site:cnbc.com+Trump&hl=en-US&gl=US&ceid=US:en",
    label: "CNBC",
  },
  {
    url: "https://news.google.com/rss/search?q=site:wsj.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "Wall Street Journal",
  },
  {
    url: "https://news.google.com/rss/search?q=site:nytimes.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "New York Times",
  },
  {
    url: "https://news.google.com/rss/search?q=site:politico.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "Politico",
  },
  {
    url: "https://news.google.com/rss/search?q=site:bloomberg.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "Bloomberg",
  },
  {
    url: "https://news.google.com/rss/search?q=site:nbcnews.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "NBC News",
  },
  {
    url: "https://news.google.com/rss/search?q=site:abcnews.go.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "ABC News",
  },
  {
    url: "https://news.google.com/rss/search?q=site:cbsnews.com+Trump+said&hl=en-US&gl=US&ceid=US:en",
    label: "CBS News",
  },
  {
    url: "https://news.google.com/rss/search?q=site:whitehouse.gov+Trump&hl=en-US&gl=US&ceid=US:en",
    label: "White House",
  },
];

export const MAJOR_NEWS_DOMAINS = [
  "reuters.com",
  "apnews.com",
  "cnn.com",
  "foxnews.com",
  "cnbc.com",
  "wsj.com",
  "nytimes.com",
  "washingtonpost.com",
  "politico.com",
  "bloomberg.com",
  "nbcnews.com",
  "abcnews.go.com",
  "cbsnews.com",
  "bbc.com",
  "bbc.co.uk",
  "npr.org",
  "thehill.com",
  "axios.com",
  "marketwatch.com",
  "businessinsider.com",
  "whitehouse.gov",
];

function getNewsRssFeeds(): Array<{ url: string; label: string }> {
  const raw = process.env.NEWS_RSS_FEEDS?.trim();
  if (!raw) return DEFAULT_NEWS_RSS_FEEDS;

  return raw.split("|").map((entry) => {
    const [url, label] = entry.split("::");
    return {
      url: url.trim(),
      label: label?.trim() || new URL(url.trim()).hostname,
    };
  });
}

export function isNewsRssConfigured(): boolean {
  return process.env.NEWS_RSS_ENABLED !== "false";
}

export async function scrapeNewsRssFeeds(
  limitPerFeed = 12
): Promise<SourceScrapeResult & { feedsChecked: string[] }> {
  if (!isNewsRssConfigured()) {
    return {
      source: "news_rss",
      configured: false,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      filtered: 0,
      feedsChecked: [],
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      source: "news_rss",
      configured: false,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      feedsChecked: [],
      error: "Supabase is not configured",
    };
  }

  const feeds = getNewsRssFeeds();
  const drafts: StatementDraft[] = [];
  const seen = new Set<string>();
  let filtered = 0;

  for (const feed of feeds) {
    try {
      const items = await fetchRssFeed(feed.url, feed.label, limitPerFeed);
      for (const item of items) {
        if (seen.has(item.externalId)) continue;
        seen.add(item.externalId);

        if (!isLikelyTrumpSpeaking(item.content, item.source)) {
          filtered += 1;
          continue;
        }

        drafts.push(item);
      }
    } catch (error) {
      console.error(`News RSS error (${feed.label}):`, error);
    }
  }

  drafts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const { inserted, skipped } = await persistStatements(drafts.slice(0, 80));

  return {
    source: "news_rss",
    configured: true,
    scraped: drafts.length + filtered,
    inserted,
    skipped,
    filtered,
    feedsChecked: feeds.map((f) => f.label),
  };
}

interface NewsArticle {
  title?: string;
  description?: string;
  content?: string;
  publishedAt?: string;
  source?: { name?: string };
  url?: string;
}

interface NewsApiResponse {
  articles?: NewsArticle[];
}

const NEWSAPI_QUERIES = [
  '"Donald Trump" AND (said OR says OR told OR announced OR declared OR speech OR rally OR remarks)',
  '"President Trump" AND (said OR says OR told OR announced OR remarks OR interview)',
  'Trump AND ("executive order" OR tariff OR company OR CEO OR stock) AND (said OR announced)',
];

export function isNewsApiConfigured(): boolean {
  return Boolean(process.env.NEWSAPI_KEY?.trim());
}

export async function scrapeNewsApi(
  customQuery?: string
): Promise<SourceScrapeResult> {
  const newsApiKey = process.env.NEWSAPI_KEY?.trim();

  if (!newsApiKey) {
    return {
      source: "newsapi",
      configured: false,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      error: "NEWSAPI_KEY is not configured",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      source: "newsapi",
      configured: false,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      error: "Supabase is not configured",
    };
  }

  const queries = customQuery ? [customQuery] : NEWSAPI_QUERIES;
  const drafts: StatementDraft[] = [];
  const seen = new Set<string>();
  let filtered = 0;

  for (const query of queries) {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "15");
    url.searchParams.set("domains", MAJOR_NEWS_DOMAINS.join(","));

    try {
      const response = await fetch(url.toString(), {
        headers: { "X-Api-Key": newsApiKey },
        cache: "no-store",
      });

      if (!response.ok) continue;

      const payload = (await response.json()) as NewsApiResponse;

      for (const article of payload.articles ?? []) {
        const content = [article.title, article.description, article.content]
          .filter(Boolean)
          .join("\n\n")
          .trim();

        if (!content || content.length < 40) continue;

        const sourceName =
          article.source?.name ??
          (article.url ? new URL(article.url).hostname.replace(/^www\./, "") : "NewsAPI");

        const externalId = article.url
          ? `newsapi:${article.url}`
          : `newsapi:${Buffer.from(content).toString("base64url").slice(0, 48)}`;

        if (seen.has(externalId)) continue;
        seen.add(externalId);

        const fullContent = article.url
          ? `${content}\n\nArticle: ${article.url}`
          : content;

        if (!isLikelyTrumpSpeaking(fullContent, sourceName)) {
          filtered += 1;
          continue;
        }

        drafts.push({
          externalId,
          source: sourceName,
          content: fullContent,
          publishedAt: article.publishedAt ?? new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("NewsAPI query error:", error);
    }
  }

  const { inserted, skipped } = await persistStatements(drafts.slice(0, 45));

  return {
    source: "newsapi",
    configured: true,
    scraped: drafts.length + filtered,
    inserted,
    skipped,
    filtered,
  };
}

interface GNewsArticle {
  title?: string;
  description?: string;
  content?: string;
  publishedAt?: string;
  source?: { name?: string; url?: string };
  url?: string;
}

export function isGNewsConfigured(): boolean {
  return Boolean(process.env.GNEWS_API_KEY?.trim());
}

export async function scrapeGNews(): Promise<SourceScrapeResult> {
  const apiKey = process.env.GNEWS_API_KEY?.trim();
  if (!apiKey) {
    return {
      source: "gnews",
      configured: false,
      scraped: 0,
      inserted: 0,
      skipped: 0,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      source: "gnews",
      configured: false,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      error: "Supabase is not configured",
    };
  }

  const url = new URL("https://gnews.io/api/v4/search");
  url.searchParams.set("q", '"Donald Trump" said OR speech OR announced');
  url.searchParams.set("lang", "en");
  url.searchParams.set("country", "us");
  url.searchParams.set("max", "20");
  url.searchParams.set("apikey", apiKey);

  let filtered = 0;
  const drafts: StatementDraft[] = [];

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      return {
        source: "gnews",
        configured: true,
        scraped: 0,
        inserted: 0,
        skipped: 0,
        error: `GNews failed (${response.status})`,
      };
    }

    const payload = (await response.json()) as { articles?: GNewsArticle[] };

    for (const article of payload.articles ?? []) {
      const content = [article.title, article.description, article.content]
        .filter(Boolean)
        .join("\n\n")
        .trim();

      if (!content || content.length < 40) continue;

      const sourceName = article.source?.name ?? "GNews";
      const fullContent = article.url
        ? `${content}\n\nArticle: ${article.url}`
        : content;

      if (!isLikelyTrumpSpeaking(fullContent, sourceName)) {
        filtered += 1;
        continue;
      }

      drafts.push({
        externalId: article.url
          ? `gnews:${article.url}`
          : `gnews:${Buffer.from(content).toString("base64url").slice(0, 48)}`,
        source: sourceName,
        content: fullContent,
        publishedAt: article.publishedAt ?? new Date().toISOString(),
      });
    }
  } catch (error) {
    return {
      source: "gnews",
      configured: true,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "GNews fetch failed",
    };
  }

  const { inserted, skipped } = await persistStatements(drafts);

  return {
    source: "gnews",
    configured: true,
    scraped: drafts.length + filtered,
    inserted,
    skipped,
    filtered,
  };
}

export async function scrapeAllNewsNetworks(
  newsQuery?: string
): Promise<SourceScrapeResult[]> {
  const [rss, newsapi, gnews] = await Promise.all([
    scrapeNewsRssFeeds(),
    scrapeNewsApi(newsQuery),
    scrapeGNews(),
  ]);

  return [rss, newsapi, gnews];
}

export function isAnyNewsNetworkConfigured(): boolean {
  return isNewsRssConfigured() || isNewsApiConfigured() || isGNewsConfigured();
}
