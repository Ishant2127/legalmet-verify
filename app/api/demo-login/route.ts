import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  personaSession,
  sessionFromSupabase,
  signSession,
} from "@/lib/demo-session";
import type { Role, Session } from "@/lib/types";

const ROLES: Role[] = ["owner", "officer", "admin"];

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  let session: Session | null = null;

  if (typeof body.persona === "string" && ROLES.includes(body.persona as Role)) {
    session = personaSession(body.persona as Role);
  } else if (body.supabase && typeof body.supabase === "object") {
    const profile = body.supabase as Record<string, unknown>;
    session = sessionFromSupabase({
      role: typeof profile.role === "string" ? profile.role : "owner",
      name: typeof profile.name === "string" ? profile.name : null,
      email: typeof profile.email === "string" ? profile.email : null,
      organization:
        typeof profile.organization === "string" ? profile.organization : null,
      district: typeof profile.district === "string" ? profile.district : null,
      ownerId: typeof profile.ownerId === "string" ? profile.ownerId : undefined,
    });
  }

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Provide a valid demo persona or Supabase profile." },
      { status: 400 },
    );
  }

  const token = await signSession(session);
  const response = NextResponse.json({ ok: true, session });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
