import {
  isAnyNewsNetworkConfigured,
  isGNewsConfigured,
  isNewsApiConfigured,
  isNewsRssConfigured,
} from "@/lib/scrape-news-networks";
import { isXFeedConfigured } from "@/lib/scrape-x-feed";
import { getPrimarySpeakerName, getPrimaryXHandle } from "@/lib/speaker-attribution";
import { isTruthSocialConfigured } from "@/lib/truth-social";

export interface PublicSourceStatus {
  id: string;
  label: string;
  active: boolean;
  hint: string;
}

export function getPublicSourceStatuses(): PublicSourceStatus[] {
  return [
    {
      id: "truth_social",
      label: "Truth Social",
      active: isTruthSocialConfigured(),
      hint: "Direct posts (RSS / API)",
    },
    {
      id: "x_feed",
      label: "X (Twitter)",
      active: isXFeedConfigured(),
      hint: `@${getPrimaryXHandle()} — API or RSS bridge`,
    },
    {
      id: "news_rss",
      label: "Major news RSS",
      active: isNewsRssConfigured(),
      hint: "Reuters, CNN, Fox, CNBC, WSJ, AP, etc. (Google News RSS)",
    },
    {
      id: "newsapi",
      label: "NewsAPI",
      active: isNewsApiConfigured(),
      hint: "Major network domains · Trump speaking filter",
    },
    {
      id: "gnews",
      label: "GNews",
      active: isGNewsConfigured(),
      hint: "Optional GNews API",
    },
  ];
}

export function isAnyPublicSourceConfigured(): boolean {
  return (
    isTruthSocialConfigured() ||
    isXFeedConfigured() ||
    isAnyNewsNetworkConfigured()
  );
}

export function getPrimarySpeakerLabel(): string {
  return getPrimarySpeakerName();
}
