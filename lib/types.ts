export type Role = "owner" | "officer" | "admin";

export type CertificateState = "valid" | "expiring" | "expired" | "revoked";
export type ApplicationStatus = "pending" | "inspection" | "approved" | "rejected";
export type InstrumentStatus = "active" | "under_review" | "inactive";

export interface Owner {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  district: string;
  address: string;
  gstin: string;
}

export interface Instrument {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  category: string;
  manufacturer: string;
  model: string;
  serial: string;
  capacity: string;
  accuracyClass: string;
  location: string;
  district: string;
  status: InstrumentStatus;
  registeredAt: string;
  lastInspectedAt?: string;
}

export interface Application {
  id: string;
  number: string;
  instrumentId: string;
  ownerId: string;
  status: ApplicationStatus;
  priority: "standard" | "priority";
  submittedAt: string;
  scheduledFor?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export interface Certificate {
  id: string;
  number: string;
  applicationId: string;
  instrumentId: string;
  ownerId: string;
  issuedAt: string;
  validUntil: string;
  issuedBy: string;
  inspectionScore: number;
  sealVersion: string;
  hash: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  role: Role | "system";
  action: string;
  entity: "instrument" | "application" | "certificate" | "registry" | "session";
  entityId: string;
  detail: string;
  hash?: string;
}

export interface RegistryState {
  version: number;
  owners: Owner[];
  instruments: Instrument[];
  applications: Application[];
  certificates: Certificate[];
  audit: AuditEvent[];
  lastUpdated: string;
}

export interface CertificateDetails {
  certificate: Certificate;
  instrument: Instrument | undefined;
  owner: Owner | undefined;
  application: Application | undefined;
  state: CertificateState;
  daysRemaining: number;
  hashValid: boolean | null;
}

export interface LiveCertificate {
  number: string;
  issuedAt: string;
  validUntil: string;
  status: string;
  instrumentName: string;
  instrumentType: string;
  manufacturer: string;
  model: string;
  serial: string;
  ownerName: string;
  ownerOrganization: string;
  district: string;
  hash: string;
  source: "supabase";
  rawStatus: string;
}

export type LiveLookup =
  | { kind: "found"; record: LiveCertificate; latencyMs: number }
  | { kind: "not_found"; latencyMs: number }
  | { kind: "error"; message: string; latencyMs: number };

export interface Session {
  role: Role;
  name: string;
  email: string;
  organization: string;
  district: string;
  badgeId?: string;
  ownerId?: string;
  issuedAt: number;
}

export interface RegisterInstrumentInput {
  ownerId: string;
  name: string;
  type: string;
  category: string;
  manufacturer: string;
  model: string;
  serial: string;
  capacity: string;
  accuracyClass: string;
  location: string;
  district: string;
}

export interface RegistryMetrics {
  totalInstruments: number;
  activeInstruments: number;
  validCertificates: number;
  expiringCertificates: number;
  expiredCertificates: number;
  revokedCertificates: number;
  pendingApplications: number;
  approvedApplications: number;
  totalCertificates: number;
  districtsCovered: number;
  complianceRate: number;
}
