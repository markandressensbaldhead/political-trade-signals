import { runAnalyzePipeline } from "@/lib/analyze-runner";
import { scrapeNewsArticles } from "@/lib/scrape-news";
import { scrapeTruthSocialPosts } from "@/lib/truth-social";

export interface ScrapePipelineResult {
  news: Awaited<ReturnType<typeof scrapeNewsArticles>>;
  truthSocial: Awaited<ReturnType<typeof scrapeTruthSocialPosts>>;
  analyze?: Awaited<ReturnType<typeof runAnalyzePipeline>>;
}

export async function runScrapePipeline(options?: {
  newsQuery?: string;
  truthLimit?: number;
  analyzeAfterScrape?: boolean;
  analyzeLimit?: number;
}): Promise<ScrapePipelineResult> {
  const [news, truthSocial] = await Promise.all([
    scrapeNewsArticles(options?.newsQuery),
    scrapeTruthSocialPosts(options?.truthLimit ?? 20),
  ]);

  const result: ScrapePipelineResult = { news, truthSocial };

  if (options?.analyzeAfterScrape) {
    result.analyze = await runAnalyzePipeline(options.analyzeLimit ?? 25);
  }

  return result;
}
