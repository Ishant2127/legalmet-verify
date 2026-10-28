import type {
  CertificateDetails,
  CertificateState,
  LiveCertificate,
} from "@/lib/types";

export type CertificateView = {
  number: string;
  state: CertificateState;
  issuedAt: string;
  validUntil: string;
  instrumentName: string;
  instrumentType: string;
  capacity?: string;
  measurementUnit?: string;
  manufacturer: string;
  model: string;
  serial: string;
  ownerName: string;
  ownerOrganization: string;
  district: string;
  hash: string;
  issuedBy: string;
  inspectionScore?: number;
  sealVersion: string;
  source: "demo" | "supabase";
  rawStatus: string;
  revocationReason?: string;
};

export function viewFromDemo(details: CertificateDetails): CertificateView {
  return {
    number: details.certificate.number,
    state: details.state,
    issuedAt: details.certificate.issuedAt,
    validUntil: details.certificate.validUntil,
    instrumentName: details.instrument?.name ?? "Registered measuring instrument",
    instrumentType: details.instrument?.type ?? "Measuring Instrument",
    capacity: details.instrument?.capacity,
    measurementUnit: details.instrument?.measurementUnit,
    manufacturer: details.instrument?.manufacturer ?? "—",
    model: details.instrument?.model ?? "—",
    serial: details.instrument?.serial ?? "—",
    ownerName: details.owner?.name ?? "Registered Entity",
    ownerOrganization: details.owner?.organization ?? "Registered Trade Establishment",
    district: details.instrument?.district ?? details.owner?.district ?? "Central District",
    hash: details.certificate.hash,
    issuedBy: details.certificate.issuedBy,
    inspectionScore: details.certificate.inspectionScore,
    sealVersion: details.certificate.sealVersion,
    source: "demo",
    rawStatus: details.state.toUpperCase(),
    revocationReason: details.certificate.revocationReason,
  };
}

export function viewFromLive(record: LiveCertificate): CertificateView {
  const status = record.status.toUpperCase();
  const validUntil = new Date(record.validUntil).getTime();
  const now = Date.now();

  let state: CertificateState = "valid";
  if (status === "REVOKED") state = "revoked";
  else if (status === "EXPIRED" || validUntil < now) state = "expired";
  else if (validUntil - now <= 45 * 86_400_000) state = "expiring";

  return {
    number: record.number,
    state,
    issuedAt: record.issuedAt,
    validUntil: record.validUntil,
    instrumentName: record.instrumentName,
    instrumentType: record.instrumentType,
    manufacturer: record.manufacturer,
    model: record.model,
    serial: record.serial,
    ownerName: record.ownerName,
    ownerOrganization: record.ownerOrganization,
    district: record.district,
    hash: record.hash,
    issuedBy: "Directorate of Legal Metrology",
    sealVersion: "LMV-SEAL-2.0",
    source: "supabase",
    rawStatus: record.rawStatus,
  };
}

export function extractCertificateQuery(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      return url.searchParams.get("cert") ?? trimmed;
    }
  } catch {
    // Treat the value as a raw certificate number.
  }
  if (trimmed.toLowerCase().startsWith("cert:")) return trimmed.slice(5).trim();
  return trimmed;
}
