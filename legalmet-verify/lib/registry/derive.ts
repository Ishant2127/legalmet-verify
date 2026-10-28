import { canonicalCertificatePayload, sha256Hex } from "@/lib/crypto";
import type {
  Application,
  Certificate,
  CertificateDetails,
  CertificateState,
  RegistryMetrics,
  RegistryState,
} from "@/lib/types";

export const EXPIRING_WINDOW_DAYS = 45;

export function certificateState(
  certificate: Certificate,
  now = Date.now(),
): CertificateState {
  if (certificate.revokedAt) return "revoked";
  const validUntil = new Date(certificate.validUntil).getTime();
  if (Number.isNaN(validUntil) || validUntil < now) return "expired";
  if (validUntil - now <= EXPIRING_WINDOW_DAYS * 86_400_000) return "expiring";
  return "valid";
}

export function daysRemaining(certificate: Certificate, now = Date.now()) {
  const validUntil = new Date(certificate.validUntil).getTime();
  if (Number.isNaN(validUntil)) return 0;
  return Math.ceil((validUntil - now) / 86_400_000);
}

export function enrichCertificate(
  state: RegistryState,
  certificate: Certificate,
  now = Date.now(),
): CertificateDetails {
  return {
    certificate,
    instrument: state.instruments.find((item) => item.id === certificate.instrumentId),
    owner: state.owners.find((item) => item.id === certificate.ownerId),
    application: state.applications.find((item) => item.id === certificate.applicationId),
    state: certificateState(certificate, now),
    daysRemaining: daysRemaining(certificate, now),
    hashValid: null,
  };
}

export async function verifyCertificateHash(details: CertificateDetails) {
  if (!details.certificate.hash || !details.instrument) return null;
  const digest = await sha256Hex(
    canonicalCertificatePayload({
      number: details.certificate.number,
      serial: details.instrument.serial,
      issuedAt: details.certificate.issuedAt,
    }),
  );
  return digest === details.certificate.hash;
}

export function computeMetrics(state: RegistryState): RegistryMetrics {
  const now = Date.now();
  const certificateStates = state.certificates.map((certificate) =>
    certificateState(certificate, now),
  );
  const valid = certificateStates.filter((value) => value === "valid").length;
  const expiring = certificateStates.filter((value) => value === "expiring").length;
  const expired = certificateStates.filter((value) => value === "expired").length;
  const revoked = certificateStates.filter((value) => value === "revoked").length;
  const totalCertificates = state.certificates.length;
  const pending = state.applications.filter((item) => item.status === "pending").length;
  const approved = state.applications.filter((item) => item.status === "approved").length;
  const districts = new Set(state.instruments.map((item) => item.district));

  return {
    totalInstruments: state.instruments.length,
    activeInstruments: state.instruments.filter((item) => item.status === "active").length,
    validCertificates: valid,
    expiringCertificates: expiring,
    expiredCertificates: expired,
    revokedCertificates: revoked,
    pendingApplications: pending,
    approvedApplications: approved,
    totalCertificates,
    districtsCovered: districts.size,
    complianceRate:
      totalCertificates > 0 ? ((valid + expiring) / totalCertificates) * 100 : 0,
  };
}

export function searchRegistry(state: RegistryState, query: string): CertificateDetails[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return state.certificates
    .map((certificate) => enrichCertificate(state, certificate))
    .filter((details) => {
      const haystack = [
        details.certificate.number,
        details.certificate.hash,
        details.instrument?.serial,
        details.instrument?.name,
        details.instrument?.manufacturer,
        details.instrument?.model,
        details.owner?.name,
        details.owner?.organization,
        details.application?.number,
        details.application?.instrumentId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    })
    .sort((a, b) => new Date(b.certificate.issuedAt).getTime() - new Date(a.certificate.issuedAt).getTime());
}

export function ownerCertificates(state: RegistryState, ownerId: string) {
  return state.certificates
    .filter((certificate) => certificate.ownerId === ownerId)
    .map((certificate) => enrichCertificate(state, certificate));
}

export function ownerInstruments(state: RegistryState, ownerId: string) {
  return state.instruments.filter((instrument) => instrument.ownerId === ownerId);
}

export function ownerApplications(state: RegistryState, ownerId: string) {
  return state.applications
    .filter((application) => application.ownerId === ownerId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function allApplications(state: RegistryState) {
  return [...state.applications].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function pendingQueue(state: RegistryState) {
  const priority = { priority: 0, standard: 1 };
  return allApplications(state)
    .filter((application) => application.status === "pending" || application.status === "inspection")
    .sort((a, b) => {
      const byPriority = priority[a.priority] - priority[b.priority];
      if (byPriority !== 0) return byPriority;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });
}

export function expiringCertificates(state: RegistryState, limit?: number) {
  const rows = state.certificates
    .map((certificate) => enrichCertificate(state, certificate))
    .filter((details) => details.state === "expiring")
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export function applicationDetails(state: RegistryState, application: Application) {
  return {
    application,
    instrument: state.instruments.find((item) => item.id === application.instrumentId),
    owner: state.owners.find((item) => item.id === application.ownerId),
    certificate: state.certificates.find(
      (certificate) => certificate.applicationId === application.id,
    ),
  };
}

export function districtBreakdown(state: RegistryState) {
  const districts = Array.from(
    new Set([
      ...state.instruments.map((item) => item.district),
      ...state.owners.map((item) => item.district),
    ]),
  ).sort();

  return districts.map((district) => {
    const instruments = state.instruments.filter((item) => item.district === district);
    const certificates = state.certificates.filter((certificate) =>
      instruments.some((instrument) => instrument.id === certificate.instrumentId),
    );
    const states = certificates.map((certificate) => certificateState(certificate));
    const valid = states.filter((value) => value === "valid" || value === "expiring").length;
    return {
      district,
      instruments: instruments.length,
      certificates: certificates.length,
      valid,
      pending: state.applications.filter(
        (application) =>
          application.status !== "approved" &&
          application.status !== "rejected" &&
          instruments.some((instrument) => instrument.id === application.instrumentId),
      ).length,
      compliance: certificates.length ? (valid / certificates.length) * 100 : 0,
    };
  });
}

export function typeBreakdown(state: RegistryState) {
  const types = Array.from(new Set(state.instruments.map((item) => item.type)));
  return types
    .map((type) => ({
      name: type,
      value: state.instruments.filter((instrument) => instrument.type === type).length,
    }))
    .sort((a, b) => b.value - a.value);
}

function monthKey(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(value);
}

export function monthlyTrend(state: RegistryState, months = 6) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - index), 1));
    return {
      key: monthKey(date),
      month: monthLabel(date),
      issued: 0,
      applications: 0,
      verifications: 0,
      expiring: 0,
    };
  });

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const certificate of state.certificates) {
    const issued = byKey.get(monthKey(certificate.issuedAt));
    if (issued) issued.issued += 1;
    const expiry = byKey.get(monthKey(certificate.validUntil));
    if (expiry) expiry.expiring += 1;
  }

  for (const application of state.applications) {
    const submitted = byKey.get(monthKey(application.submittedAt));
    if (submitted) submitted.applications += 1;
  }

  for (const event of state.audit) {
    if (event.action !== "verification.performed") continue;
    const verification = byKey.get(monthKey(event.at));
    if (verification) verification.verifications += 1;
  }

  return buckets;
}

export function recentAudit(state: RegistryState, limit = 8) {
  return [...state.audit]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

export function findApplicationByInstrument(state: RegistryState, instrumentId: string) {
  return state.applications.find(
    (application) => application.instrumentId === instrumentId,
  );
}
