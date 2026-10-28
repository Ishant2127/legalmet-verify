import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cert = new URL(request.url).searchParams.get("cert")?.trim();

  if (!cert) {
    return NextResponse.json(
      { ok: false, error: "Provide a certificate number with ?cert=" },
      { status: 400 },
    );
  }

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const started = Date.now();

  try {
    const response = await fetch(`${url}/rest/v1/rpc/verify_certificate`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cert_number: cert }),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json({
      ok: response.ok,
      cert,
      records: Array.isArray(data) ? data : [],
      latencyMs: Date.now() - started,
      source: "supabase:verify_certificate",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 502 },
    );
  }
}
