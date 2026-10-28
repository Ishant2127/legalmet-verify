import { canonicalCertificatePayload, sha256Hex } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/client";
import type { LiveCertificate, LiveLookup } from "@/lib/types";

type RpcRow = {
  certificate_number: string;
  issued_at: string;
  valid_until: string;
  status?: string | null;
  instrument_name?: string | null;
  instrument_type?: string | null;
  manufacturer?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  owner_name?: string | null;
  owner_organization?: string | null;
  district?: string | null;
  digital_hash?: string | null;
};

export type LiveRegistrySnapshot = {
  records: LiveCertificate[];
  latencyMs: number;
  error: string | null;
  projectRef: string | null;
};

function projectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function mapRow(row: RpcRow, hash: string): LiveCertificate {
  return {
    number: row.certificate_number,
    issuedAt: new Date(row.issued_at).toISOString(),
    validUntil: new Date(row.valid_until).toISOString(),
    status: String(row.status ?? "VALID").toUpperCase(),
    instrumentName: row.instrument_name || "Registered measuring instrument",
    instrumentType: row.instrument_type || "Measuring Instrument",
    manufacturer: row.manufacturer || "—",
    model: row.model_number || "—",
    serial: row.serial_number || "—",
    ownerName: row.owner_name || "Registered Entity",
    ownerOrganization: row.owner_organization || "Registered Trade Establishment",
    district: row.district || "Central District",
    hash: row.digital_hash || hash,
    source: "supabase",
    rawStatus: row.status || "VALID",
  };
}

export async function verifyLiveCertificate(certNumber: string): Promise<LiveLookup> {
  const started = performance.now();
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("verify_certificate", {
      cert_number: certNumber.trim(),
    });
    const latencyMs = Math.round(performance.now() - started);

    if (error) {
      return { kind: "error", message: error.message, latencyMs };
    }

    const rows = (data ?? []) as RpcRow[];
    if (!rows.length) return { kind: "not_found", latencyMs };

    const row = rows[0];
    const serial = row.serial_number || "UNKNOWN";
    const issuedAt = new Date(row.issued_at).toISOString();
    const computed = await sha256Hex(
      canonicalCertificatePayload({
        number: row.certificate_number,
        serial,
        issuedAt,
      }),
    );

    return {
      kind: "found",
      record: mapRow(row, computed),
      latencyMs,
    };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Registry unavailable",
      latencyMs: Math.round(performance.now() - started),
    };
  }
}

export async function getLiveRegistrySnapshot(limit = 6): Promise<LiveRegistrySnapshot> {
  const started = performance.now();
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("certificates")
      .select("certificate_number")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        records: [],
        latencyMs: Math.round(performance.now() - started),
        error: error.message,
        projectRef: projectRef(),
      };
    }

    const numbers = (data ?? [])
      .map((row) => row.certificate_number as string)
      .filter(Boolean);

    const lookups = await Promise.all(numbers.map((number) => verifyLiveCertificate(number)));
    const records = lookups
      .filter(
        (lookup): lookup is Extract<LiveLookup, { kind: "found" }> =>
          lookup.kind === "found",
      )
      .map((lookup) => lookup.record);

    return {
      records,
      latencyMs: Math.round(performance.now() - started),
      error: null,
      projectRef: projectRef(),
    };
  } catch (error) {
    return {
      records: [],
      latencyMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "Registry unavailable",
      projectRef: projectRef(),
    };
  }
}

export { projectRef };
