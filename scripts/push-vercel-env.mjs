#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const secretsPath = process.argv[2] ?? resolve(root, ".env.local");
const token = process.env.VERCEL_TOKEN?.trim();
const projectId =
  process.env.VERCEL_PROJECT_ID?.trim() ?? "prj_KJTtj5guh9sAmChOlzn0qq2WCJRI";
const teamId = process.env.VERCEL_TEAM_ID?.trim() ?? "team_8hFMwqoneNDtT5z0PiEUsg7T";

if (!token) {
  console.error("Missing VERCEL_TOKEN");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(secretsPath, "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
);

const keys = [
  "ANTHROPIC_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEWSAPI_KEY",
  "CRON_SECRET",
  "FTT_WEBHOOK_SECRET",
  "TRUTH_SOCIAL_RSS_URL",
  "TRUTH_SOCIAL_USERNAMES",
  "TRUTH_SOCIAL_ACCESS_TOKEN",
  "SCRAPECREATORS_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_FROM",
  "TWILIO_PHONE_TO",
];

async function addEnv(key, value) {
  if (!value || value.startsWith("your_") || value.endsWith("_here")) {
    console.log(`Skipping ${key}`);
    return;
  }

  const response = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env?upsert=true&teamId=${teamId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        type: "encrypted",
        target: ["production", "preview", "development"],
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to set ${key}: ${text.slice(0, 200)}`);
  }

  console.log(`Set ${key}`);
}

for (const key of keys) {
  await addEnv(key, env[key]?.trim() ?? "");
}

console.log("\nDone.");
