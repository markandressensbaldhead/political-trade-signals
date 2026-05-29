import { isCronAuthorized } from "@/lib/cron-auth";

/** Protects manual pipeline triggers (scrape/analyze) in production. */
export function isPipelineAuthorized(request: Request): boolean {
  if (isCronAuthorized(request)) return true;

  const apiKey = process.env.PIPELINE_API_KEY?.trim();
  if (!apiKey) {
    return process.env.NODE_ENV === "development";
  }

  const headerKey = request.headers.get("x-api-key");
  return headerKey === apiKey;
}
