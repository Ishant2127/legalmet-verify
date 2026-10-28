"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Fingerprint,
  Loader2,
  Search,
  ShieldCheck,
  ShieldX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PortalPageSkeleton } from "@/components/portal/loading";
import { PageHeader } from "@/components/portal/page-header";
import { StatCard } from "@/components/portal/stat-card";
import { CertificateStatus } from "@/components/portal/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { viewFromDemo } from "@/lib/certificate-view";
import { shortHash } from "@/lib/crypto";
import { downloadCertificatePdf } from "@/lib/pdf";
import { enrichCertificate, ownerCertificates } from "@/lib/registry/derive";
import { useRegistry } from "@/lib/registry/store";
import type { CertificateDetails } from "@/lib/types";
import { cn, downloadBlob, formatDate, formatDateTime } from "@/lib/utils";

type Mode = "view" | "revoke";

export default function CertificatesPage() {
  const { state, session, hydrated, revokeCertificate } = useRegistry();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [selected, setSelected] = useState<CertificateDetails | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const scoped = useMemo(() => {
    if (!session) return [];
    return session.role === "owner" && session.ownerId
      ? ownerCertificates(state, session.ownerId)
      : state.certificates.map((certificate) => enrichCertificate(state, certificate));
  }, [state, session]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scoped
      .filter((details) => (stateFilter === "all" ? true : details.state === stateFilter))
      .filter((details) => {
        if (!term) return true;
        return [
          details.certificate.number,
          details.certificate.hash,
          details.instrument?.name,
          details.instrument?.serial,
          details.owner?.organization,
          details.owner?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort(
        (a, b) =>
          new Date(b.certificate.issuedAt).getTime() -
          new Date(a.certificate.issuedAt).getTime(),
      );
  }, [scoped, search, stateFilter]);

  if (!hydrated || !session) return <PortalPageSkeleton />;

  const canRevoke = session.role === "officer" || session.role === "admin";
  const counts = {
    total: scoped.length,
    valid: scoped.filter((item) => item.state === "valid").length,
    expiring: scoped.filter((item) => item.state === "expiring").length,
    revoked: scoped.filter((item) => item.state === "revoked").length,
  };

  function open(details: CertificateDetails) {
    setSelected(details);
    setMode("view");
    setReason("");
  }

  function close() {
    setSelected(null);
    setMode("view");
    setBusy(false);
  }

  function revoke() {
    if (!selected) return;
    if (reason.trim().length < 8) {
      toast.error("Provide a revocation reason (at least 8 characters).");
      return;
    }
    try {
      revokeCertificate(selected.certificate.id, reason.trim());
      toast.success("Certificate revoked", {
        description: `${selected.certificate.number} is no longer valid.`,
      });
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Revocation failed.");
    }
  }

  async function download(details: CertificateDetails) {
    setBusy(true);
    try {
      await downloadCertificatePdf(viewFromDemo(details));
      toast.success("Sealed PDF generated", {
        description: details.certificate.number,
      });
    } catch {
      toast.error("Could not generate the PDF.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const header = [
      "certificate",
      "instrument",
      "serial",
      "holder",
      "district",
      "issued_at",
      "valid_until",
      "state",
      "seal",
    ];
    const rows = filtered.map((details) => [
      details.certificate.number,
      details.instrument?.name ?? "",
      details.instrument?.serial ?? "",
      details.owner?.organization ?? "",
      details.instrument?.district ?? "",
      details.certificate.issuedAt,
      details.certificate.validUntil,
      details.state,
      details.certificate.hash,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `legalmet-certificates-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("Certificate register exported", {
      description: `${filtered.length} rows · CSV`,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sealed records"
        title={
          <>
            Certificate <span className="italic text-gold">register.</span>
          </>
        }
        description="Every certificate issued in your scope, with its seal, validity window and revocation history."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button asChild size="sm">
              <Link href="/applications">
                <ShieldCheck className="h-3.5 w-3.5" /> Issue from queue
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Certificates" value={counts.total} hint="Scoped to your workspace" icon={FileText} />
        <StatCard
          label="Valid"
          value={counts.valid}
          hint="Within the validity window"
          icon={BadgeCheck}
          tone="success"
        />
        <StatCard
          label="Renewal window"
          value={counts.expiring}
          hint="Expiring within 45 days"
          icon={CalendarClock}
          tone="warning"
        />
        <StatCard
          label="Revoked"
          value={counts.revoked}
          hint="Withdrawn by an officer"
          icon={ShieldX}
          tone="danger"
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search certificate, seal, instrument or holder…"
              className="pl-9"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <Select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="sm:w-44"
          >
            <option value="all">All states</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </Select>
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground sm:ml-2">
            {filtered.length} shown
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-3 font-medium sm:px-6">Certificate</th>
                <th className="px-3 py-3 font-medium">Instrument</th>
                <th className="px-3 py-3 font-medium">Holder</th>
                <th className="px-3 py-3 font-medium">Validity</th>
                <th className="px-3 py-3 font-medium">Seal</th>
                <th className="px-3 py-3 font-medium">State</th>
                <th className="px-5 py-3 text-right font-medium sm:px-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <BadgeCheck className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <p className="mt-3 text-sm font-medium">No certificates match this view</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Adjust the state filter or search term.
                    </p>
                  </td>
                </tr>
              ) : null}
              {filtered.map((details) => (
                <tr
                  key={details.certificate.id}
                  className="cursor-pointer border-t border-border/70 transition-colors hover:bg-muted/25"
                  onClick={() => open(details)}
                >
                  <td className="px-5 py-3.5 sm:px-6">
                    <p className="font-mono text-[10px]">{details.certificate.number}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      score {details.certificate.inspectionScore}/100
                    </p>
                  </td>
                  <td className="max-w-[210px] px-3 py-3.5">
                    <p className="truncate text-[11px]">{details.instrument?.name ?? "—"}</p>
                    <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                      {details.instrument?.serial}
                    </p>
                  </td>
                  <td className="max-w-[160px] px-3 py-3.5">
                    <p className="truncate text-[11px]">{details.owner?.organization ?? "—"}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      {details.instrument?.district}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(details.certificate.issuedAt)}
                    </p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      → {formatDate(details.certificate.validUntil)}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="font-mono text-[9px] text-gold">
                      {shortHash(details.certificate.hash, 8, 6)}
                    </p>
                    <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                      sha-256
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <CertificateStatus state={details.state} />
                  </td>
                  <td className="px-5 py-3.5 text-right sm:px-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        open(details);
                      }}
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="gold">Certificate</Badge>
                  <CertificateStatus state={selected.state} />
                </div>
                <DialogTitle className="mt-2 font-mono text-xl">
                  {selected.certificate.number}
                </DialogTitle>
                <DialogDescription>
                  {selected.instrument?.name} · {selected.owner?.organization}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Detail label="Serial number" value={selected.instrument?.serial ?? "—"} mono />
                <Detail label="District" value={selected.instrument?.district ?? "—"} />
                <Detail label="Issued" value={formatDateTime(selected.certificate.issuedAt)} />
                <Detail label="Valid until" value={formatDateTime(selected.certificate.validUntil)} />
                <Detail label="Issued by" value={selected.certificate.issuedBy} />
                <Detail
                  label="Inspection score"
                  value={`${selected.certificate.inspectionScore}/100`}
                />
              </div>

              <div className="rounded-xl border border-border bg-background/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                    Cryptographic seal
                  </p>
                  <span className="inline-flex items-center gap-1 font-mono text-[8px] text-success">
                    <Fingerprint className="h-2.5 w-2.5" /> SHA-256
                  </span>
                </div>
                <p className="mt-1.5 break-all font-mono text-[9px] leading-relaxed text-gold/90">
                  {selected.certificate.hash || "Seal pending"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(selected.certificate.hash);
                    toast.success("Seal digest copied");
                  }}
                  className="mt-2 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
                >
                  <Copy className="h-2.5 w-2.5" /> Copy digest
                </button>
              </div>

              {selected.certificate.revocationReason ? (
                <div className="rounded-xl border border-danger/25 bg-danger-soft p-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-danger">
                    Revocation reason
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {selected.certificate.revocationReason}
                  </p>
                  {selected.certificate.revokedAt ? (
                    <p className="mt-1 font-mono text-[8px] text-muted-foreground">
                      {formatDateTime(selected.certificate.revokedAt)} IST
                    </p>
                  ) : null}
                </div>
              ) : null}

              {mode === "revoke" ? (
                <div className="space-y-3 rounded-xl border border-danger/25 bg-danger-soft/40 p-3">
                  <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-danger">
                    <ShieldX className="h-3 w-3" /> Revoke certificate
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="revoke-reason">Reason (permanently recorded)</Label>
                    <Textarea
                      id="revoke-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Tamper-evident seal mismatch found during a field audit."
                      className="min-h-20 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setMode("view")}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="destructive" onClick={revoke}>
                      <ShieldX className="h-3.5 w-3.5" /> Confirm revocation
                    </Button>
                  </div>
                </div>
              ) : null}

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={`/verify?cert=${encodeURIComponent(selected.certificate.number)}`}>
                    <ShieldCheck className="h-3.5 w-3.5" /> Public verification
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void download(selected)}
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Download PDF
                </Button>
                {canRevoke && !selected.certificate.revokedAt && mode === "view" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-danger hover:border-danger/40 hover:bg-danger-soft hover:text-danger"
                    onClick={() => setMode("revoke")}
                  >
                    <ShieldX className="h-3.5 w-3.5" /> Revoke
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/verify?cert=${encodeURIComponent(selected.certificate.number)}`}>
                    Open desk <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={close}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 break-words text-[11px]", mono && "font-mono")}>{value}</p>
    </div>
  );
}
