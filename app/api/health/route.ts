import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const started = Date.now();

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        supabase: { configured: false, reachable: false },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/certificates?select=certificate_number&limit=500`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      },
    );

    const rows = response.ok ? ((await response.json()) as unknown[]) : null;

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        supabase: {
          configured: true,
          reachable: false,
          latencyMs: Date.now() - started,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
