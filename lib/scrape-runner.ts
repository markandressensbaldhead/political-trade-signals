import { runAnalyzePipeline } from "@/lib/analyze-runner";
import { scrapeNewsArticles } from "@/lib/scrape-news";
import { scrapeTruthSocialPosts } from "@/lib/truth-social";

export interface ScrapePipelineResult {
  news?: Awaited<ReturnType<typeof scrapeNewsArticles>>;
  truthSocial: Awaited<ReturnType<typeof scrapeTruthSocialPosts>>;
  analyze?: Awaited<ReturnType<typeof runAnalyzePipeline>>;
}

export async function runScrapePipeline(options?: {
  newsQuery?: string;
  truthLimit?: number;
  analyzeAfterScrape?: boolean;
  analyzeLimit?: number;
  truthOnly?: boolean;
  rssOnly?: boolean;
  stopAfterDuplicateStreak?: number;
}): Promise<ScrapePipelineResult> {
  const truthSocial = await scrapeTruthSocialPosts(options?.truthLimit ?? 20, {
    rssOnly: options?.rssOnly ?? options?.truthOnly ?? false,
    stopAfterDuplicateStreak: options?.stopAfterDuplicateStreak,
  });

  let news: ScrapePipelineResult["news"];
  if (!options?.truthOnly) {
    news = await scrapeNewsArticles(options?.newsQuery);
  }

  const result: ScrapePipelineResult = { truthSocial };
  if (news) result.news = news;

  if (options?.analyzeAfterScrape) {
    result.analyze = await runAnalyzePipeline(options.analyzeLimit ?? 25);
  }

  return result;
}

export async function runTruthPollPipeline(options?: {
  truthLimit?: number;
  analyzeLimit?: number;
}): Promise<ScrapePipelineResult> {
  return runScrapePipeline({
    truthOnly: true,
    rssOnly: true,
    truthLimit: options?.truthLimit ?? 40,
    analyzeAfterScrape: true,
    analyzeLimit: options?.analyzeLimit ?? 15,
    stopAfterDuplicateStreak: 5,
  });
}
