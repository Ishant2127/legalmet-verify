"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Fingerprint,
  ScanLine,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CERTIFICATE_STATUS_META } from "@/lib/constants";
import type { CertificateView } from "@/lib/certificate-view";
import { shortHash } from "@/lib/crypto";
import { cn, formatDate } from "@/lib/utils";

export function CertificateDocument({
  view,
  digest,
  integrity,
  className,
}: {
  view: CertificateView;
  digest: string;
  integrity: boolean | null;
  className?: string;
}) {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const meta = CERTIFICATE_STATUS_META[view.state];
  const verifyUrl = `${origin || "https://verify.legalmet.gov.in"}/verify?cert=${encodeURIComponent(view.number)}`;

  return (
    <article
      className={cn(
        "certificate-paper noise print-full relative mx-auto w-full overflow-hidden rounded-[1.6rem] p-5 sm:p-7",
        className,
      )}
      aria-label={`Certificate ${view.number}`}
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="certificate-watermark pointer-events-none absolute inset-0 opacity-40" />

      {view.state === "revoked" ? (
        <span className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] select-none border-4 border-danger/25 px-6 py-2 font-display text-5xl uppercase tracking-[0.14em] text-danger/20 sm:text-7xl">
          Revoked
        </span>
      ) : view.state === "expired" ? (
        <span className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] select-none border-4 border-border/60 px-6 py-2 font-display text-5xl uppercase tracking-[0.14em] text-muted-foreground/20 sm:text-7xl">
          Expired
        </span>
      ) : null}

      <header className="relative flex items-start justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.26em] text-muted-foreground">
              Government of India
            </p>
            <p className="mt-1 font-display text-[22px] leading-none tracking-tight sm:text-2xl">
              Certificate of Verification
            </p>
            <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-gold">
              Directorate of Legal Metrology · Legal Metrology Act, 2009
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge
            variant={
              view.state === "valid"
                ? "success"
                : view.state === "expiring"
                  ? "warning"
                  : view.state === "revoked"
                    ? "danger"
                    : "default"
            }
            dot
          >
            {meta.label}
          </Badge>
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
            {view.source === "supabase" ? "supabase record" : "demo registry"}
          </span>
        </div>
      </header>

      <div className="relative grid gap-5 py-5 md:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
            Certificate registration no.
          </p>
          <p className="mt-1 break-all font-mono text-lg font-semibold tracking-tight text-gold sm:text-xl">
            {view.number}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
            <Field label="Registered instrument" value={view.instrumentName} className="col-span-2" />
            <Field label="Category" value={view.instrumentType} />
            <Field label="Serial number" mono value={view.serial} />
            <Field label="Make" value={view.manufacturer} />
            <Field label="Model" value={view.model} />
            {(view.capacity || view.measurementUnit) ? (
              <Field
                label="Capacity / measurement unit"
                value={[view.capacity, view.measurementUnit ? `(${view.measurementUnit})` : ""].filter(Boolean).join(" ")}
              />
            ) : null}
            <Field label="Registered holder" value={view.ownerName} />
            <Field label="Establishment" value={view.ownerOrganization} />
            <Field label="District / jurisdiction" value={view.district} />
            <Field label="Inspection score" value={view.inspectionScore ? `${view.inspectionScore}/100` : "—"} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-background/40 p-3 sm:grid-cols-3">
            <Field label="Date of issue" value={formatDate(view.issuedAt)} compact />
            <Field label="Valid until" value={formatDate(view.validUntil)} compact />
            <Field label="Issued by" value={view.issuedBy} compact />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 md:pl-2">
          <div className="rounded-xl border border-border bg-background p-2.5">
            <QRCodeSVG
              value={verifyUrl}
              size={112}
              bgColor="transparent"
              fgColor="currentColor"
              level="M"
              className="text-foreground"
            />
          </div>
          <p className="max-w-[132px] text-center font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-muted-foreground">
            Scan to verify against the national registry
          </p>
          <div
            className={cn(
              "mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]",
              integrity === true
                ? "border-success/25 bg-success-soft text-success"
                : integrity === false
                  ? "border-danger/25 bg-danger-soft text-danger"
                  : "border-border bg-muted text-muted-foreground",
            )}
          >
            {integrity === false ? (
              <TriangleAlert className="h-2.5 w-2.5" />
            ) : (
              <Fingerprint className="h-2.5 w-2.5" />
            )}
            {integrity === true ? "Seal intact" : integrity === false ? "Seal broken" : "Computing"}
          </div>
        </div>
      </div>

      <div className="relative rounded-xl border border-border/80 bg-background/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
            Cryptographic seal · SHA-256
          </p>
          <span
            className={cn(
              "font-mono text-[8px]",
              integrity === false ? "text-danger" : "text-success",
            )}
          >
            {integrity === false ? "MISMATCH" : integrity ? "INTACT" : "…"}
          </span>
        </div>
        <p className="mt-1.5 break-all font-mono text-[9px] leading-relaxed text-gold/90">
          {digest ? shortHash(digest, 34, 26) : "Recomputing digest from canonical payload…"}
        </p>
        <p className="mt-1 font-mono text-[8px] leading-relaxed text-muted-foreground">
          payload = CERT_NO | SERIAL | ISSUED_AT · {view.sealVersion}
        </p>
      </div>

      <footer className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <BadgeCheck className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9px] font-medium">Digitally signed record</p>
            <p className="font-mono text-[8px] text-muted-foreground">
              Central Metrology Root Authority
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> {formatDate(view.validUntil)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3 w-3" /> {view.district}
          </span>
          <ScanLine className="h-3.5 w-3.5 text-gold/60" />
        </div>
      </footer>

      {view.revocationReason ? (
        <p className="relative mt-3 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[10px] leading-relaxed text-danger">
          <span className="font-semibold">Revocation reason:</span> {view.revocationReason}
        </p>
      ) : null}
    </article>
  );
}

function Field({
  label,
  value,
  mono,
  compact,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 break-words leading-snug",
          compact ? "text-[10px]" : "text-[11px] sm:text-xs",
          mono && "font-mono",
        )}
      >
        {value}
      </p>
    </div>
  );
}
