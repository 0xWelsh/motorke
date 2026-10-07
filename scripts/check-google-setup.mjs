#!/usr/bin/env node
/**
 * One-shot Google Search Console + Indexing API setup check.
 * Usage: npm run seo:check-google   (or add --ping to submit the homepage URL)
 *
 * Verifies, in order:
 *   1. service account JSON present + parses
 *   2. service account can call the Search Console API and lists properties
 *   3. our GSC_SITE_URL (or NEXT_PUBLIC_SITE_URL) is among the accessible properties
 *   4. service account can reach the Google Indexing API
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleAuth } from "google-auth-library";

function applyEnvFile(filename, overridesExisting) {
  const p = resolve(process.cwd(), filename);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!key) continue;
    if (!overridesExisting && process.env[key] !== undefined) continue;
    process.env[key] = val;
  }
}

applyEnvFile(".env", false);
applyEnvFile(".env.local", true);

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const GSC_API = "https://www.googleapis.com/webmasters/v3/sites";
const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const INDEXING_METADATA = "https://indexing.googleapis.com/v3/urlNotifications/metadata";
const INDEXING_PUBLISH = "https://indexing.googleapis.com/v3/urlNotifications:publish";

const out = [];
function pass(msg) {
  out.push(`  \x1b[32m✓\x1b[0m ${msg}`);
}
function fail(msg) {
  out.push(`  \x1b[31m✗\x1b[0m ${msg}`);
}
function info(msg) {
  out.push(`  \x1b[90m·\x1b[0m ${msg}`);
}

function gerr(e) {
  const status = e?.response?.status || e?.status || e?.code || "";
  const detail =
    e?.response?.data?.error?.message ||
    (Array.isArray(e?.errors) ? e.errors[0]?.message : null) ||
    e?.message;
  return detail ? `${status} ${detail}`.trim() : String(e);
}

function parseCreds() {
  const key =
    process.env.GSC_SERVICE_ACCOUNT_JSON?.trim() || process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!key) return null;
  try {
    return JSON.parse(key);
  } catch {
    return "invalid";
  }
}

async function main() {
  console.log("\nGoogle setup check\n");

  const flags = {
    indexing: ["1", "true"].includes(process.env.GOOGLE_INDEXING_ENABLED),
    gsc: ["1", "true"].includes(process.env.GSC_SYNC_ENABLED),
  };
  info(`GOOGLE_INDEXING_ENABLED=${process.env.GOOGLE_INDEXING_ENABLED || "(unset)"}`);
  info(`GSC_SYNC_ENABLED=${process.env.GSC_SYNC_ENABLED || "(unset)"}`);

  let ok = true;

  // 1. Credentials
  console.log("1) Service account");
  const creds = parseCreds();
  if (creds === "invalid") {
    fail("GSC_SERVICE_ACCOUNT_JSON / GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    ok = false;
  } else if (!creds) {
    fail(
      "No service account key set. Create one in Google Cloud Console, download the JSON, and set GOOGLE_SERVICE_ACCOUNT_JSON."
    );
    ok = false;
  } else {
    pass(`Loaded ${creds.client_email || "service account"} (project ${creds.project_id || "?"})`);
  }

  const siteUrl =
    process.env.GSC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  info("Target property: " + (siteUrl || "(none — set GSC_SITE_URL)"));

  if (!siteUrl) {
    ok = false;
  }

  // 2-3. Search Console access
  console.log("2) Search Console");
  let gscAuthOk = false;
  if (creds && typeof creds === "object") {
    const auth = new GoogleAuth({ credentials: creds, scopes: [GSC_SCOPE] });
    const client = await auth.getClient();
    try {
      const sites = await client.request({ url: GSC_API, method: "GET" });
      const props = (sites.data?.siteEntry || []).map((s) => s.siteUrl);
      gscAuthOk = true;
      if (!props.length) {
        pass("Search Console API reachable, but service account has no properties yet");
        info("Add the service account email as Owner in Search Console → Settings → Users and permissions.");
      } else if (siteUrl && props.includes(siteUrl)) {
        pass(`GSC property "${siteUrl}" is accessible`);
      } else if (siteUrl) {
        fail(`"${siteUrl}" not in list — pick one of:`, props);
        ok = false;
      } else {
        info("Properties: " + props.join(", "));
      }
    } catch (e) {
      fail(`Search Console call failed: ${gerr(e)}`);
      info(
        "Enable the Search Console API: https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview"
      );
      ok = false;
    }
  } else {
    fail("Skipped — requires service account credentials.");
  }

  // 4. Indexing API access
  console.log("3) Indexing API");
  if (creds && typeof creds === "object") {
    const auth = new GoogleAuth({ credentials: creds, scopes: [INDEXING_SCOPE] });
    const client = await auth.getClient();
    try {
      const meta = await client.request({
        url: `${INDEXING_METADATA}?url=${encodeURIComponent("https://welshmotorhub.co.ke")}`,
        method: "GET",
      });
      pass(`Indexing API reachable (HTTP ${meta.status})`);
      if ((flags.indexing && process.argv.includes("--ping")) || gscAuthOk === false) {
        const ping = await client.request({
          url: INDEXING_PUBLISH,
          method: "POST",
          data: {
            url: "https://welshmotorhub.co.ke/",
            type: "URL_UPDATED",
          },
        });
        info(`Ping submitted (HTTP ${ping.status}) — URL_UPDATED queued.`);
      }
    } catch (e) {
      const status = e?.response?.status || e?.status || 0;
      if (status === 404) {
        pass(`Indexing API reachable (HTTP 404 = URL has no metadata yet — auth OK)`);
        info("This is expected before anything has been submitted.");
      } else {
        fail(`Indexing API failed: ${gerr(e)}`);
        info(
          "Enable the Indexing API: https://console.developers.google.com/apis/api/indexing.googleapis.com/overview"
        );
        ok = false;
      }
    }
  } else {
    fail("Skipped — requires service account credentials.");
  }

  // Flags summary
  console.log("4) Feature flags");
  pass(`GOOGLE_INDEXING_ENABLED=${flags.indexing ? "ON" : "OFF"}`);
  pass(`GSC_SYNC_ENABLED=${flags.gsc ? "ON" : "OFF"}`);

  console.log("\n" + out.join("\n"));
  console.log(ok ? "\n\x1b[32mAll checks passed.\x1b[0m" : "\n\x1b[33mFix the steps above, then rerun.\x1b[0m");
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});