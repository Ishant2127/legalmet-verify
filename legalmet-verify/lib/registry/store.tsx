"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { canonicalCertificatePayload, sha256Hex } from "@/lib/crypto";
import { createSeedState } from "@/lib/registry/seed";
import { downloadBlob, randomDigits, randomId } from "@/lib/utils";
import type {
  Application,
  AuditEvent,
  Certificate,
  Instrument,
  RegisterInstrumentInput,
  RegistryState,
  Session,
} from "@/lib/types";

const STORAGE_KEY = "lmv-nexus-registry-v2";

type RegistryContextValue = {
  state: RegistryState;
  session: Session | null;
  hydrated: boolean;
  registerInstrument: (input: RegisterInstrumentInput) => {
    instrument: Instrument;
    application: Application;
  };
  approveApplication: (
    applicationId: string,
    notes?: string,
  ) => Promise<Certificate | null>;
  requestInspection: (
    applicationId: string,
    notes: string,
    scheduledFor?: string,
  ) => void;
  rejectApplication: (applicationId: string, notes: string) => void;
  revokeCertificate: (certificateId: string, reason: string) => void;
  recordVerification: (certificateNumber: string, context?: string) => void;
  resetRegistry: () => void;
  exportRegistry: () => void;
};

const RegistryContext = createContext<RegistryContextValue | null>(null);

function nextCertificateNumber(state: RegistryState) {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = `LMV-CERT-${year}-${randomDigits(4)}`;
    if (!state.certificates.some((certificate) => certificate.number === candidate)) {
      return candidate;
    }
  }
  return `LMV-CERT-${year}-${Date.now().toString().slice(-4)}`;
}

function nextApplicationNumber(state: RegistryState) {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = `LMV-APP-${year}-${randomDigits(4)}`;
    if (!state.applications.some((application) => application.number === candidate)) {
      return candidate;
    }
  }
  return `LMV-APP-${year}-${Date.now().toString().slice(-4)}`;
}

function auditEvent(
  actor: string,
  role: AuditEvent["role"],
  action: string,
  entity: AuditEvent["entity"],
  entityId: string,
  detail: string,
): AuditEvent {
  return {
    id: randomId("aud"),
    at: new Date().toISOString(),
    actor,
    role,
    action,
    entity,
    entityId,
    detail,
  };
}

export function RegistryProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<RegistryState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let next = createSeedState();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RegistryState;
        if (
          parsed &&
          parsed.version === 2 &&
          Array.isArray(parsed.certificates) &&
          Array.isArray(parsed.instruments)
        ) {
          next = parsed;
        }
      }
    } catch {
      // A corrupt local snapshot should never block the workspace.
    }
    setState(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable in private browsing; the in-memory registry still works.
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const missing = state.certificates.filter((certificate) => !certificate.hash);
    if (missing.length === 0) return;

    let cancelled = false;

    (async () => {
      const hashes = new Map<string, string>();
      for (const certificate of missing) {
        const instrument = state.instruments.find(
          (item) => item.id === certificate.instrumentId,
        );
        if (!instrument) continue;
        hashes.set(
          certificate.id,
          await sha256Hex(
            canonicalCertificatePayload({
              number: certificate.number,
              serial: instrument.serial,
              issuedAt: certificate.issuedAt,
            }),
          ),
        );
      }

      if (cancelled) return;
      if (hashes.size > 0) {
        setState((previous) => ({
          ...previous,
          certificates: previous.certificates.map((certificate) =>
            hashes.has(certificate.id)
              ? { ...certificate, hash: hashes.get(certificate.id) ?? "" }
              : certificate,
          ),
          lastUpdated: new Date().toISOString(),
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.certificates, state.instruments, hydrated]);

  const registerInstrument = useCallback(
    (input: RegisterInstrumentInput) => {
      if (!session) throw new Error("A workspace session is required.");

      const duplicate = state.instruments.some(
        (instrument) =>
          instrument.serial.trim().toLowerCase() === input.serial.trim().toLowerCase(),
      );
      if (duplicate) {
        throw new Error("An instrument with this serial number is already registered.");
      }

      const now = new Date().toISOString();
      const ownerId =
        session.role === "owner" && session.ownerId ? session.ownerId : input.ownerId;

      const instrument: Instrument = {
        id: randomId("ins"),
        ownerId,
        name: input.name.trim(),
        type: input.type,
        category: input.category,
        manufacturer: input.manufacturer.trim(),
        model: input.model.trim(),
        serial: input.serial.trim().toUpperCase(),
        capacity: input.capacity.trim(),
        measurementUnit: input.measurementUnit ? input.measurementUnit.trim() : undefined,
        accuracyClass: input.accuracyClass,
        location: input.location.trim(),
        district: input.district,
        status: "under_review",
        registeredAt: now,
      };

      const application: Application = {
        id: randomId("app"),
        number: nextApplicationNumber(state),
        instrumentId: instrument.id,
        ownerId,
        status: "pending",
        priority:
          instrument.type === "Weighbridge" || instrument.type === "Flow Meter"
            ? "priority"
            : "standard",
        submittedAt: now,
        notes: "Submitted through the self-service instrument registration form (LMV-01).",
      };

      setState((previous) => ({
        ...previous,
        instruments: [instrument, ...previous.instruments],
        applications: [application, ...previous.applications],
        audit: [
          auditEvent(
            session.name,
            session.role,
            "instrument.registered",
            "instrument",
            instrument.id,
            `Registered ${instrument.name} (${instrument.serial}) at ${instrument.location}.`,
          ),
          auditEvent(
            session.name,
            session.role,
            "application.submitted",
            "application",
            application.id,
            `Application ${application.number} submitted for ${instrument.name}.`,
          ),
          ...previous.audit,
        ],
        lastUpdated: now,
      }));

      return { instrument, application };
    },
    [session, state],
  );

  const approveApplication = useCallback(
    async (applicationId: string, notes?: string) => {
      if (!session || session.role === "owner") {
        throw new Error("Only an authorised officer can issue certificates.");
      }

      const application = state.applications.find((item) => item.id === applicationId);
      if (!application) throw new Error("Application not found.");
      if (application.status === "approved") {
        return (
          state.certificates.find(
            (certificate) => certificate.applicationId === application.id,
          ) ?? null
        );
      }

      const instrument = state.instruments.find(
        (item) => item.id === application.instrumentId,
      );
      if (!instrument) throw new Error("Linked instrument not found.");

      const now = new Date();
      const issuedAt = now.toISOString();
      const validUntil = new Date(now);
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      const certificate: Certificate = {
        id: randomId("cert"),
        number: nextCertificateNumber(state),
        applicationId: application.id,
        instrumentId: instrument.id,
        ownerId: application.ownerId,
        issuedAt,
        validUntil: validUntil.toISOString(),
        issuedBy: session.name,
        inspectionScore: 95 + (Number(randomDigits(1)) % 5),
        sealVersion: "LMV-SEAL-2.0",
        hash: "",
      };

      certificate.hash = await sha256Hex(
        canonicalCertificatePayload({
          number: certificate.number,
          serial: instrument.serial,
          issuedAt: certificate.issuedAt,
        }),
      );

      const reviewNote =
        notes?.trim() ||
        "Inspection completed against national reference standards. Certificate issued.";

      setState((previous) => {
        const updatedApplication: Application = {
          ...application,
          status: "approved",
          reviewedAt: issuedAt,
          reviewedBy: session.name,
          notes: reviewNote,
        };

        return {
          ...previous,
          applications: previous.applications.map((item) =>
            item.id === application.id ? updatedApplication : item,
          ),
          instruments: previous.instruments.map((item) =>
            item.id === instrument.id
              ? {
                  ...item,
                  status: "active",
                  lastInspectedAt: issuedAt,
                }
              : item,
          ),
          certificates: [certificate, ...previous.certificates],
          audit: [
            auditEvent(
              session.name,
              session.role,
              "application.approved",
              "application",
              application.id,
              `Approved application ${application.number} for ${instrument.name}.`,
            ),
            auditEvent(
              session.name,
              session.role,
              "certificate.issued",
              "certificate",
              certificate.id,
              `Issued certificate ${certificate.number} with seal ${certificate.hash.slice(0, 16)}…`,
            ),
            ...previous.audit,
          ],
          lastUpdated: issuedAt,
        };
      });

      return certificate;
    },
    [session, state],
  );

  const requestInspection = useCallback(
    (applicationId: string, notes: string, scheduledFor?: string) => {
      if (!session || session.role === "owner") {
        throw new Error("Only an authorised officer can schedule inspections.");
      }
      const application = state.applications.find((item) => item.id === applicationId);
      if (!application) return;

      const schedule = scheduledFor || new Date(Date.now() + 3 * 86_400_000).toISOString();
      const now = new Date().toISOString();

      setState((previous) => ({
        ...previous,
        applications: previous.applications.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: "inspection",
                scheduledFor: schedule,
                notes,
                reviewedBy: session.name,
              }
            : item,
        ),
        audit: [
          auditEvent(
            session.name,
            session.role,
            "application.inspection_scheduled",
            "application",
            application.id,
            `Inspection scheduled for ${application.number} on ${schedule}.`,
          ),
          ...previous.audit,
        ],
        lastUpdated: now,
      }));
    },
    [session, state],
  );

  const rejectApplication = useCallback(
    (applicationId: string, notes: string) => {
      if (!session || session.role === "owner") {
        throw new Error("Only an authorised officer can reject applications.");
      }
      const application = state.applications.find((item) => item.id === applicationId);
      if (!application) return;
      const now = new Date().toISOString();

      setState((previous) => ({
        ...previous,
        applications: previous.applications.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: "rejected",
                reviewedAt: now,
                reviewedBy: session.name,
                notes,
              }
            : item,
        ),
        audit: [
          auditEvent(
            session.name,
            session.role,
            "application.rejected",
            "application",
            application.id,
            `Rejected application ${application.number}: ${notes}`,
          ),
          ...previous.audit,
        ],
        lastUpdated: now,
      }));
    },
    [session, state],
  );

  const revokeCertificate = useCallback(
    (certificateId: string, reason: string) => {
      if (!session || session.role === "owner") {
        throw new Error("Only an authorised officer can revoke certificates.");
      }
      const certificate = state.certificates.find((item) => item.id === certificateId);
      if (!certificate) return;
      const now = new Date().toISOString();

      setState((previous) => ({
        ...previous,
        certificates: previous.certificates.map((item) =>
          item.id === certificateId
            ? { ...item, revokedAt: now, revocationReason: reason }
            : item,
        ),
        audit: [
          auditEvent(
            session.name,
            session.role,
            "certificate.revoked",
            "certificate",
            certificate.id,
            `Revoked certificate ${certificate.number}: ${reason}`,
          ),
          ...previous.audit,
        ],
        lastUpdated: now,
      }));
    },
    [session, state],
  );

  const recordVerification = useCallback(
    (certificateNumber: string, context = "Public registry lookup") => {
      const detail = `${context} — ${certificateNumber.toUpperCase()}`;
      setState((previous) => {
        if (
          previous.audit[0]?.action === "verification.performed" &&
          previous.audit[0]?.detail === detail
        ) {
          return previous;
        }
        return {
          ...previous,
          audit: [
            auditEvent(
              session?.name ?? "Public Verifier",
              session?.role ?? "system",
              "verification.performed",
              "certificate",
              certificateNumber,
              detail,
            ),
            ...previous.audit,
          ].slice(0, 120),
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    [session],
  );

  const resetRegistry = useCallback(() => {
    const next = createSeedState();
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const exportRegistry = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    downloadBlob(
      blob,
      `legalmet-nexus-registry-${new Date().toISOString().slice(0, 10)}.json`,
    );
  }, [state]);

  const value = useMemo<RegistryContextValue>(
    () => ({
      state,
      session,
      hydrated,
      registerInstrument,
      approveApplication,
      requestInspection,
      rejectApplication,
      revokeCertificate,
      recordVerification,
      resetRegistry,
      exportRegistry,
    }),
    [
      state,
      session,
      hydrated,
      registerInstrument,
      approveApplication,
      requestInspection,
      rejectApplication,
      revokeCertificate,
      recordVerification,
      resetRegistry,
      exportRegistry,
    ],
  );

  return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>;
}

export function useRegistry() {
  const context = useContext(RegistryContext);
  if (!context) {
    throw new Error("useRegistry must be used within RegistryProvider.");
  }
  return context;
}

