import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type HealthPayload = {
  ok: boolean;
  supabase: {
    configured: boolean;
    reachable: boolean;
    status?: number;
    latencyMs?: number;
    projectRef?: string;
    certificateCount?: number | null;
    error?: string;
  };
  github?: { repo: string };
  runtime?: { node: string };
  timestamp: string;
};

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderStatusPage(payload: HealthPayload) {
  const { ok, supabase, timestamp, github, runtime } = payload;
  const tone = ok ? "#c8a45c" : "#e05555";
  const label = ok ? "Operational" : "Degraded";
  const rows: Array<[string, string]> = [
    ["Supabase project", supabase.projectRef ?? "not configured"],
    ["Certificates visible", String(supabase.certificateCount ?? 0)],
    ["Round trip", `${supabase.latencyMs ?? 0} ms`],
    ["HTTP status", String(supabase.status ?? "—")],
    ["Node runtime", runtime?.node ?? "—"],
    ["Checked at", timestamp],
  ];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Registry health · LegalMet Verify Nexus</title>
<meta name="robots" content="noindex" />
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #0b0b0c; color: #ece7dc;
    font: 15px/1.6 ui-sans-serif, -apple-system, "Segoe UI", sans-serif;
    padding: 32px;
  }
  main { width: min(620px, 100%); }
  .eyebrow { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #8b8578; }
  h1 { font-size: 40px; line-height: 1; margin: 14px 0 10px; font-weight: 600; letter-spacing: -.02em; }
  h1 em { color: #c8a45c; }
  .badge {
    display: inline-flex; align-items: center; gap: 8px; margin-top: 6px;
    border: 1px solid ${tone}55; background: ${tone}14; color: ${tone};
    border-radius: 999px; padding: 5px 12px; font-size: 12px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: ${tone}; box-shadow: 0 0 0 4px ${tone}22; }
  dl {
    margin: 28px 0 0; border: 1px solid #26241f; border-radius: 16px;
    overflow: hidden; background: #121211;
  }
  .row { display: flex; justify-content: space-between; gap: 24px; padding: 13px 18px; border-bottom: 1px solid #1f1e1a; }
  .row:last-child { border-bottom: 0; }
  dt { color: #8b8578; font-size: 13px; }
  dd { margin: 0; font-family: ui-monospace, "SF Mono", monospace; font-size: 13px; text-align: right; word-break: break-all; }
  footer { margin-top: 22px; display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between; color: #8b8578; font-size: 12px; }
  a { color: #c8a45c; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .json { margin-top: 18px; color: #6c675d; font-size: 12px; }
</style>
</head>
<body>
<main>
  <p class="eyebrow">LegalMet Verify Nexus</p>
  <h1>Registry <em>health.</em></h1>
  <span class="badge"><span class="dot"></span>${escapeHtml(label)}</span>
  <dl>
    ${rows
      .map(
        ([term, value]) =>
          `<div class="row"><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`,
      )
      .join("\n    ")}
  </dl>
  <footer>
    <span>Machine-readable JSON: <a href="/api/health?format=json">/api/health?format=json</a></span>
    <span><a href="/">Open workspace</a> · <a href="/verify">Verify a certificate</a></span>
  </footer>
  <p class="json">${escapeHtml(github?.repo ?? "")}</p>
</main>
</body>
</html>`;
}

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const started = Date.now();
  const wantsHtml =
    request.headers.get("accept")?.includes("text/html") &&
    !new URL(request.url).searchParams.has("format");

  let payload: HealthPayload;
  let status = 200;

  if (!url || !key) {
    payload = {
      ok: false,
      supabase: { configured: false, reachable: false },
      timestamp: new Date().toISOString(),
    };
    status = 503;
  } else {
    try {
      const response = await fetch(
        `${url}/rest/v1/certificates?select=certificate_number&limit=500`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        },
      );

      const rows = response.ok ? ((await response.json()) as unknown[]) : null;

      payload = {
        ok: response.ok,
        supabase: {
          configured: true,
          reachable: response.ok,
          status: response.status,
          latencyMs: Date.now() - started,
          projectRef: new URL(url).hostname.split(".")[0],
          certificateCount: Array.isArray(rows) ? rows.length : null,
        },
        github: {
          repo:
            process.env.NEXT_PUBLIC_GITHUB_REPO ??
            "https://github.com/Ishant2127/legalmet-verify",
        },
        runtime: { node: process.version },
        timestamp: new Date().toISOString(),
      };
      if (!response.ok) status = 503;
    } catch (error) {
      payload = {
        ok: false,
        supabase: {
          configured: true,
          reachable: false,
          latencyMs: Date.now() - started,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: new Date().toISOString(),
      };
      status = 503;
    }
  }

  if (wantsHtml) {
    return new NextResponse(renderStatusPage(payload), {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }

  return NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
