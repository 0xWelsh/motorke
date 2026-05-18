import { sendSystemAlertEmail } from "@/lib/mail";

function alertsEnabled() {
  return (
    process.env.SEO_ALERTS_ENABLED === "1" ||
    process.env.SEO_ALERTS_ENABLED === "true" ||
    process.env.SEO_ALERTS_ENABLED == null
  );
}

async function postSlack(text, details = {}) {
  const url = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!url) return { skipped: true };

  const blocks = [
    { type: "section", text: { type: "mrkdwn", text } },
  ];
  const fields = Object.entries(details)
    .slice(0, 8)
    .map(([k, v]) => ({
      type: "mrkdwn",
      text: `*${k}:*\n${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
    }));
  if (fields.length) {
    blocks.push({ type: "section", fields });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, blocks }),
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/** Notify support when SEO monitoring detects failures. */
export async function sendSeoAlert({ subject, summary, details = {} }) {
  if (!alertsEnabled()) return { skipped: true, reason: "disabled" };

  const [email, slack] = await Promise.all([
    sendSystemAlertEmail({ subject, summary, details }),
    postSlack(`*${subject}*\n${summary}`, details),
  ]);

  return { email, slack };
}

export async function alertCrawlFailure(crawlResult) {
  if (crawlResult?.ok) return { skipped: true };
  const failures = (crawlResult?.results || []).filter(
    (r) => r.status >= 400 || r.status === 0 || r.error,
  );
  return sendSeoAlert({
    subject: "SEO crawl smoke test failed",
    summary: `${failures.length} URL(s) returned errors or non-2xx status.`,
    details: {
      runId: crawlResult?.runId || "n/a",
      failures: failures.slice(0, 8).map((f) => `${f.status} ${f.url}${f.error ? ` — ${f.error}` : ""}`),
    },
  });
}

export async function alertAuditIssues(report) {
  if (!report || report.ok) return { skipped: true };
  return sendSeoAlert({
    subject: "SEO audit reported issues",
    summary: `${report.summary?.issueCount ?? report.issues?.length ?? 0} issue(s) on latest audit.`,
    details: {
      missingPublicSlug: report.summary?.missingPublicSlug,
      missingDescription: report.summary?.missingDescription,
      sample: (report.issues || []).slice(0, 5).map((i) => i.message),
    },
  });
}

export async function alertPageSpeedRegression({ url, strategy, performance, threshold = 50 }) {
  if (performance == null || performance >= threshold) return { skipped: true };
  return sendSeoAlert({
    subject: `PageSpeed below ${threshold} (${strategy})`,
    summary: `${url} scored ${performance}/100 on Lighthouse performance.`,
    details: { url, strategy, performance },
  });
}
