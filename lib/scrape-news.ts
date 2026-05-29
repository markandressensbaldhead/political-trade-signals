import { scrapeNewsApi } from "@/lib/scrape-news-networks";

export interface NewsScrapeResult {
  source: "newsapi";
  configured: boolean;
  scraped: number;
  inserted: number;
  skipped: number;
  error?: string;
}

export async function scrapeNewsArticles(
  query?: string
): Promise<NewsScrapeResult> {
  const result = await scrapeNewsApi(query);
  return {
    source: "newsapi",
    configured: result.configured,
    scraped: result.scraped,
    inserted: result.inserted,
    skipped: result.skipped,
    error: result.error,
  };
}
