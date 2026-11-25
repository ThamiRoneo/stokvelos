import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * §18 C15 — the service-role key is available only to local scripts via
 * .env.local. Load it here (test setup), never in app code, logs or CI.
 */
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

for (const key of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SEED_TEST_PASSWORD",
]) {
  if (!process.env[key]) {
    throw new Error(
      `Integration tests need ${key} in .env.local (see .env.example). ` +
        "Start the local backend with: supabase start",
    );
  }
}

// These tests create and delete auth users. Refuse any non-local URL so a
// misconfigured .env.local cannot write test accounts to production (§18 C15).
const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
if (!["127.0.0.1", "localhost", "[::1]"].includes(supabaseHost)) {
  throw new Error(
    `Integration tests must target local Supabase, got ${supabaseHost}. ` +
      "No test users are written to remote projects.",
  );
}
