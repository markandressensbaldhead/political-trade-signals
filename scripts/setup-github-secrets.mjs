#!/usr/bin/env node
/**
 * One-time setup: add GitHub Actions secrets for free Truth Social polling.
 * Usage: GITHUB_TOKEN=ghp_... node scripts/setup-github-secrets.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import nacl from "tweetnacl";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = process.env.GITHUB_REPO ?? "markandressensbaldhead/political-trade-signals";
const token = process.env.GITHUB_TOKEN?.trim();

if (!token) {
  console.error("Set GITHUB_TOKEN (repo scope)");
  process.exit(1);
}

function loadEnv(key) {
  const envPath = resolve(root, ".env.local");
  const content = readFileSync(envPath, "utf8");
  const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

const secrets = {
  APP_URL: process.env.APP_URL ?? "https://political-trade-signals.vercel.app",
  CRON_SECRET: process.env.CRON_SECRET ?? loadEnv("CRON_SECRET"),
};

async function getPublicKey() {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/secrets/public-key`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function encryptSecret(publicKey, value) {
  const keyBytes = Buffer.from(publicKey, "base64");
  const messageBytes = Buffer.from(value, "utf8");
  const encryptedBytes = nacl.box.seal(messageBytes, keyBytes);
  return Buffer.from(encryptedBytes).toString("base64");
}

async function setSecret(name, value) {
  if (!value) {
    console.log(`Skip ${name} (empty)`);
    return;
  }
  const { key, key_id } = await getPublicKey();
  const encrypted = encryptSecret(key, value);
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/secrets/${name}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ encrypted_value: encrypted, key_id }),
    }
  );
  if (!res.ok) throw new Error(`${name}: ${await res.text()}`);
  console.log(`Set GitHub secret ${name}`);
}

for (const [name, value] of Object.entries(secrets)) {
  await setSecret(name, value);
}

console.log("\nGitHub Actions will poll Truth Social RSS every 15 minutes.");
