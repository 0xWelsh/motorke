export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { growthAgentFetch, isGrowthAgentConfigured } from "@/lib/growth-agent-client";

const ALLOWED = new Set([
  "discover/ingest",
  "discover/run",
  "prospects",
  "outreach",
  "monitor/inventory",
  "export/prospects.csv",
  "export/outreach.csv",
]);

function joinPath(segments) {
  return (segments || []).filter(Boolean).join("/");
}

export async function GET(_req, { params }) {
  try {
    await requireAdmin();
    if (!isGrowthAgentConfigured()) {
      return NextResponse.json({ error: "GROWTH_AGENT_URL not configured" }, { status: 503 });
    }

    const path = joinPath((await params)?.path);
    if (!ALLOWED.has(path) && !path.match(/^prospects\/[^/]+$/)) {
      return NextResponse.json({ error: "path not allowed" }, { status: 404 });
    }

    const url = new URL(_req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const agentPath = path.startsWith("export/") ? `/${path}` : `/${path}`;

    const result = await growthAgentFetch(agentPath, { searchParams });
    if (result.csv) {
      return new NextResponse(result.csv, {
        headers: {
          "Content-Type": result.contentType || "text/csv; charset=utf-8",
          "Content-Disposition": path.includes("outreach")
            ? 'attachment; filename="growth-outreach.csv"'
            : 'attachment; filename="growth-prospects.csv"',
        },
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin/growth-agent] GET", error);
    return NextResponse.json(
      { error: error?.message || "Growth agent request failed" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    await requireAdmin();
    if (!isGrowthAgentConfigured()) {
      return NextResponse.json({ error: "GROWTH_AGENT_URL not configured" }, { status: 503 });
    }

    const path = joinPath((await params)?.path);
    const allowed =
      path === "discover/ingest" ||
      path === "discover/run" ||
      path === "monitor/inventory" ||
      /^prospects\/[^/]+\/outreach$/.test(path);

    if (!allowed) {
      return NextResponse.json({ error: "path not allowed" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await growthAgentFetch(`/${path}`, { method: "POST", body });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin/growth-agent] POST", error);
    return NextResponse.json(
      { error: error?.message || "Growth agent request failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    await requireAdmin();
    if (!isGrowthAgentConfigured()) {
      return NextResponse.json({ error: "GROWTH_AGENT_URL not configured" }, { status: 503 });
    }

    const path = joinPath((await params)?.path);
    if (!/^prospects\/[^/]+$/.test(path)) {
      return NextResponse.json({ error: "path not allowed" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await growthAgentFetch(`/${path}`, { method: "PATCH", body });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[admin/growth-agent] PATCH", error);
    return NextResponse.json(
      { error: error?.message || "Growth agent request failed" },
      { status: 500 }
    );
  }
}
