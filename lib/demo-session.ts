import { DEMO_PERSONAS } from "@/lib/constants";
import type { Role, Session } from "@/lib/types";

export const SESSION_COOKIE = "lmv_nexus_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const FALLBACK_SECRET = "legalmet-nexus-demo-session-secret-v2";
const encoder = new TextEncoder();

function secret() {
  return process.env.DEMO_SESSION_SECRET || FALLBACK_SECRET;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(session: Session) {
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    encoder.encode(payload),
  );
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionValue(
  value: string | undefined | null,
): Promise<Session | null> {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;

    const parsed = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as Session;

    if (
      !parsed ||
      typeof parsed.issuedAt !== "number" ||
      !["owner", "officer", "admin"].includes(parsed.role)
    ) {
      return null;
    }

    if (Date.now() - parsed.issuedAt > SESSION_MAX_AGE * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function personaSession(role: Role): Session {
  const persona = DEMO_PERSONAS.find((item) => item.role === role);
  if (!persona) throw new Error(`Unknown persona: ${role}`);
  return {
    role: persona.role,
    name: persona.name,
    email: persona.email,
    organization: persona.organization,
    district: persona.district,
    badgeId: persona.badgeId,
    ownerId: persona.ownerId,
    issuedAt: Date.now(),
  };
}

export function sessionFromSupabase(input: {
  role?: string | null;
  name?: string | null;
  email?: string | null;
  organization?: string | null;
  district?: string | null;
  ownerId?: string;
}): Session {
  const role: Role =
    input.role === "official" ? "officer" : input.role === "admin" ? "admin" : "owner";
  return {
    role,
    name: input.name || "Registered User",
    email: input.email || "user@metrology.gov.in",
    organization: input.organization || "Registered Trade Establishment",
    district: input.district || "Central District",
    ownerId: role === "owner" ? input.ownerId ?? "own_001" : undefined,
    issuedAt: Date.now(),
  };
}
