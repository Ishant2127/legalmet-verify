import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/demo-session";

const PUBLIC_PREFIXES = [
  "/verify",
  "/login",
  "/api",
  "/_next",
  "/auth",
  "/favicon.ico",
  "/icon.svg",
  "/og.png",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionValue(request.cookies.get(SESSION_COOKIE)?.value);

  // A persona deep link (`/login?persona=officer`) must be able to replace an
  // existing workspace session, so only auto-redirect plain /login visits.
  const switchingPersona =
    pathname === "/login" && request.nextUrl.searchParams.has("persona");

  if (pathname === "/login" && session && !switchingPersona) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isPublic =
    pathname === "/" ||
    PUBLIC_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  if (isPublic) return NextResponse.next();

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
