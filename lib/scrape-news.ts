import {
  insertRawStatementIfNew,
  isSupabaseConfigured,
} from "@/lib/supabase";

interface NewsArticle {
  title?: string;
  description?: string;
  content?: string;
  publishedAt?: string;
  source?: { name?: string };
  url?: string;
}

interface NewsApiResponse {
  status?: string;
  articles?: NewsArticle[];
}

const DEFAULT_QUERY =
  "Trump OR tariff OR executive order OR stock market OR CEO";

export interface NewsScrapeResult {
  source: "newsapi";
  configured: boolean;
  scraped: number;
  inserted: number;
  skipped: number;
  error?: string;
}

export async function scrapeNewsArticles(
  query = DEFAULT_QUERY
): Promise<NewsScrapeResult> {
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

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "20");

  const response = await fetch(url.toString(), {
    headers: { "X-Api-Key": newsApiKey },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    return {
      source: "newsapi",
      configured: true,
      scraped: 0,
      inserted: 0,
      skipped: 0,
      error: `NewsAPI request failed: ${message.slice(0, 200)}`,
    };
  }

  const payload = (await response.json()) as NewsApiResponse;
  const articles = payload.articles ?? [];
  let inserted = 0;
  let skipped = 0;

  for (const article of articles) {
    const content = [article.title, article.description, article.content]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!content || content.length < 40) continue;

    const source =
      article.source?.name ??
      (article.url ? new URL(article.url).hostname : "news");

    const externalId = article.url
      ? `newsapi:${article.url}`
      : `newsapi:${Buffer.from(content).toString("base64url").slice(0, 48)}`;

    const result = await insertRawStatementIfNew({
      external_id: externalId,
      source,
      content,
      published_at: article.publishedAt ?? new Date().toISOString(),
    });

    if (result.inserted) inserted += 1;
    else skipped += 1;
  }

  return {
    source: "newsapi",
    configured: true,
    scraped: articles.length,
    inserted,
    skipped,
  };
}
