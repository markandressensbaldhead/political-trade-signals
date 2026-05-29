import { runAnalyzePipeline } from "@/lib/analyze-runner";
import { scrapeAllNewsNetworks } from "@/lib/scrape-news-networks";
import { scrapeXFeed } from "@/lib/scrape-x-feed";
import { scrapeTruthSocialPosts } from "@/lib/truth-social";
import type { SourceScrapeResult } from "@/lib/ingest-utils";

export interface ScrapePipelineResult {
  truthSocial: Awaited<ReturnType<typeof scrapeTruthSocialPosts>>;
  xFeed?: SourceScrapeResult;
  newsNetworks?: SourceScrapeResult[];
  news?: SourceScrapeResult;
  analyze?: Awaited<ReturnType<typeof runAnalyzePipeline>>;
}

export async function runScrapePipeline(options?: {
  newsQuery?: string;
  truthLimit?: number;
  xLimit?: number;
  analyzeAfterScrape?: boolean;
  analyzeLimit?: number;
  truthOnly?: boolean;
  rssOnly?: boolean;
  stopAfterDuplicateStreak?: number;
  includeNews?: boolean;
  includeX?: boolean;
}): Promise<ScrapePipelineResult> {
  const truthSocial = await scrapeTruthSocialPosts(options?.truthLimit ?? 20, {
    rssOnly: options?.rssOnly ?? options?.truthOnly ?? false,
    stopAfterDuplicateStreak: options?.stopAfterDuplicateStreak,
  });

  const result: ScrapePipelineResult = { truthSocial };

  if (!options?.truthOnly) {
    const tasks: Promise<void>[] = [];

    if (options?.includeX !== false) {
      tasks.push(
        scrapeXFeed(options?.xLimit ?? 15, {
          stopAfterDuplicateStreak: options?.stopAfterDuplicateStreak,
        }).then((xFeed) => {
          result.xFeed = xFeed;
        })
      );
    }

    if (options?.includeNews !== false) {
      tasks.push(
        scrapeAllNewsNetworks(options?.newsQuery).then((newsNetworks) => {
          result.newsNetworks = newsNetworks;
          result.news = newsNetworks.find((n) => n.source === "newsapi");
        })
      );
    }

    await Promise.all(tasks);
  }

  if (options?.analyzeAfterScrape) {
    result.analyze = await runAnalyzePipeline(options.analyzeLimit ?? 25);
  }

  return result;
}

/** Fast poll: Truth Social + X + major news RSS/API — every 15 min via GitHub Actions. */
export async function runPublicPollPipeline(options?: {
  truthLimit?: number;
  xLimit?: number;
  analyzeLimit?: number;
}): Promise<ScrapePipelineResult> {
  return runScrapePipeline({
    rssOnly: true,
    truthLimit: options?.truthLimit ?? 30,
    xLimit: options?.xLimit ?? 15,
    analyzeAfterScrape: true,
    analyzeLimit: options?.analyzeLimit ?? 20,
    stopAfterDuplicateStreak: 5,
    includeNews: true,
    includeX: true,
  });
}

/** @deprecated alias */
export async function runTruthPollPipeline(options?: {
  truthLimit?: number;
  analyzeLimit?: number;
}): Promise<ScrapePipelineResult> {
  return runPublicPollPipeline(options);
}
