"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  ShieldX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PortalPageSkeleton } from "@/components/portal/loading";
import { PageHeader } from "@/components/portal/page-header";
import { StatCard } from "@/components/portal/stat-card";
import { ApplicationStatus } from "@/components/portal/status";
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
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  allApplications,
  applicationDetails,
  enrichCertificate,
  ownerApplications,
} from "@/lib/registry/derive";
import { useRegistry } from "@/lib/registry/store";
import type { Application } from "@/lib/types";
import { cn, formatDate, formatDateTime, formatRelative } from "@/lib/utils";

const TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "inspection", label: "Inspection" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

type Mode = "review" | "approve" | "reject" | "schedule";

function defaultSchedule() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

export default function ApplicationsPage() {
  const {
    state,
    session,
    hydrated,
    approveApplication,
    requestInspection,
    rejectApplication,
  } = useRegistry();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [mode, setMode] = useState<Mode>("review");
  const [notes, setNotes] = useState("");
  const [schedule, setSchedule] = useState(defaultSchedule());
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);

  const scoped = useMemo(() => {
    if (!session) return [];
    return session.role === "owner" && session.ownerId
      ? ownerApplications(state, session.ownerId)
      : allApplications(state);
  }, [state, session]);

  const counts = useMemo(
    () => ({
      all: scoped.length,
      pending: scoped.filter((item) => item.status === "pending").length,
      inspection: scoped.filter((item) => item.status === "inspection").length,
      approved: scoped.filter((item) => item.status === "approved").length,
      rejected: scoped.filter((item) => item.status === "rejected").length,
    }),
    [scoped],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scoped
      .filter((application) => (tab === "all" ? true : application.status === tab))
      .map((application) => applicationDetails(state, application))
      .filter(({ application, instrument, owner }) => {
        if (!term) return true;
        return [
          application.number,
          application.reviewedBy,
          instrument?.name,
          instrument?.serial,
          owner?.organization,
          owner?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
  }, [scoped, tab, search, state]);

  if (!hydrated || !session) return <PortalPageSkeleton />;

  const canReview = session.role === "officer" || session.role === "admin";
  const detail = selected ? applicationDetails(state, selected) : null;
  const detailCertificate = detail?.certificate
    ? enrichCertificate(state, detail.certificate)
    : null;

  function open(application: Application) {
    setSelected(application);
    setMode("review");
    setNotes("");
    setSchedule(defaultSchedule());
    setIssued(null);
  }

  function close() {
    setSelected(null);
    setIssued(null);
    setBusy(false);
  }

  async function approve() {
    if (!selected) return;
    setBusy(true);
    try {
      const certificate = await approveApplication(selected.id, notes.trim() || undefined);
      if (certificate) {
        setIssued(certificate.number);
        toast.success("Certificate issued", {
          description: `${certificate.number} sealed with SHA-256.`,
        });
        setMode("review");
      } else {
        toast.error("The certificate could not be issued.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setBusy(false);
    }
  }

  function scheduleInspection() {
    if (!selected) return;
    if (notes.trim().length < 5) {
      toast.error("Add an inspection note before scheduling.");
      return;
    }
    try {
      const iso = new Date(`${schedule}T10:00:00+05:30`).toISOString();
      requestInspection(selected.id, notes.trim(), iso);
      toast.success("Inspection scheduled", {
        description: `${selected.number} · ${formatDate(iso)}`,
      });
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scheduling failed.");
    }
  }

  function reject() {
    if (!selected) return;
    if (notes.trim().length < 8) {
      toast.error("Give a clear rejection reason (at least 8 characters).");
      return;
    }
    try {
      rejectApplication(selected.id, notes.trim());
      toast.success("Application rejected", { description: selected.number });
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rejection failed.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={canReview ? "Inspection desk" : "My applications"}
        title={
          <>
            {canReview ? "Verification" : "Verification"}{" "}
            <span className="italic text-gold">queue.</span>
          </>
        }
        description={
          canReview
            ? "Triage priority applications, schedule field visits and issue tamper-evident certificates."
            : "Follow every instrument submission from filing through inspection to sealed certificate."
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/certificates">
                <BadgeCheck className="h-3.5 w-3.5" /> Certificates
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/instruments/new">
                <Plus className="h-3.5 w-3.5" /> New application
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={counts.all} hint="All time, scoped view" icon={FileText} />
        <StatCard
          label="Awaiting review"
          value={counts.pending}
          hint="Priority applications first"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Inspections"
          value={counts.inspection}
          hint="Field visits scheduled"
          icon={CalendarClock}
          tone="info"
        />
        <StatCard
          label="Approved"
          value={counts.approved}
          hint="Certificates issued"
          icon={BadgeCheck}
          tone="success"
        />
      </div>

      {canReview && counts.pending > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3">
          <p className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <ClipboardCheck className="h-4 w-4 text-gold" />
            <span className="text-foreground">{counts.pending} applications</span> require a
            decision. Priority filings are sorted to the top.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTab("pending");
              setSearch("");
            }}
          >
            Focus queue <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
            <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
              <TabsList className="flex-wrap">
                {TABS.map((item) => (
                  <TabsTrigger key={item.id} value={item.id}>
                    {item.label}
                    <span className="ml-1 rounded-full bg-muted px-1.5 font-mono text-[9px] text-muted-foreground">
                      {counts[item.id]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full xl:w-80">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search application, instrument or holder…"
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
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {filtered.length} records · {canReview ? "officer decision desk" : "read-only view"}
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-3 font-medium sm:px-6">Application</th>
                <th className="px-3 py-3 font-medium">Instrument</th>
                <th className="px-3 py-3 font-medium">Holder</th>
                <th className="px-3 py-3 font-medium">Timeline</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium sm:px-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <ClipboardCheck className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <p className="mt-3 text-sm font-medium">No applications in this view</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Try another tab or clear the search.
                    </p>
                  </td>
                </tr>
              ) : null}
              {filtered.map(({ application, instrument, owner, certificate }) => (
                <tr
                  key={application.id}
                  className="border-t border-border/70 transition-colors hover:bg-muted/25"
                >
                  <td className="px-5 py-3.5 sm:px-6">
                    <button
                      type="button"
                      onClick={() => open(application)}
                      className="font-mono text-[10px] hover:text-gold"
                    >
                      {application.number}
                    </button>
                    <p className="mt-0.5 flex items-center gap-1 text-[9px] capitalize text-muted-foreground">
                      {application.priority === "priority" ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                      ) : null}
                      {application.priority} priority
                    </p>
                  </td>
                  <td className="max-w-[220px] px-3 py-3.5">
                    <p className="truncate text-[11px]">{instrument?.name ?? "—"}</p>
                    <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                      {instrument?.serial}
                    </p>
                  </td>
                  <td className="max-w-[160px] px-3 py-3.5">
                    <p className="truncate text-[11px]">{owner?.organization ?? "—"}</p>
                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                      {owner?.district ?? instrument?.district}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <p className="text-[10px] text-muted-foreground">
                      filed {formatRelative(application.submittedAt)}
                    </p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      {application.scheduledFor
                        ? `visit ${formatDate(application.scheduledFor)}`
                        : application.reviewedAt
                          ? `reviewed ${formatDate(application.reviewedAt)}`
                          : "no visit yet"}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <ApplicationStatus status={application.status} />
                    {certificate ? (
                      <p className="mt-1 font-mono text-[8px] text-muted-foreground">
                        {certificate.number}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-right sm:px-6">
                    <Button
                      size="sm"
                      variant={
                        canReview &&
                        (application.status === "pending" || application.status === "inspection")
                          ? "default"
                          : "outline"
                      }
                      onClick={() => open(application)}
                    >
                      {canReview &&
                      (application.status === "pending" || application.status === "inspection")
                        ? "Review"
                        : "View"}
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
          {selected && detail ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="gold">{selected.number}</Badge>
                  <ApplicationStatus status={selected.status} />
                  {selected.priority === "priority" ? (
                    <Badge variant="warning" dot>
                      priority
                    </Badge>
                  ) : null}
                </div>
                <DialogTitle className="mt-2">
                  {detail.instrument?.name ?? "Instrument application"}
                </DialogTitle>
                <DialogDescription>
                  {detail.owner?.organization} · filed {formatDateTime(selected.submittedAt)} IST
                </DialogDescription>
              </DialogHeader>

              {issued ? (
                <div className="rounded-xl border border-success/25 bg-success-soft p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-semibold text-success">Certificate issued</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{issued}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    The instrument is now active. The SHA-256 seal is bound to the
                    certificate number, serial and issuance timestamp.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/verify?cert=${encodeURIComponent(issued)}`}>
                        <ShieldCheck className="h-3.5 w-3.5" /> Verify certificate
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={close}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Detail label="Instrument serial" value={detail.instrument?.serial ?? "—"} mono />
                <Detail label="District" value={detail.instrument?.district ?? "—"} />
                <Detail label="Manufacturer" value={detail.instrument?.manufacturer ?? "—"} />
                <Detail label="Model" value={detail.instrument?.model ?? "—"} />
                <Detail
                  label="Scheduled inspection"
                  value={selected.scheduledFor ? formatDate(selected.scheduledFor) : "Not scheduled"}
                />
                <Detail label="Reviewed by" value={selected.reviewedBy ?? "Unassigned"} />
                <Detail
                  label="Location"
                  value={detail.instrument?.location ?? "—"}
                  className="col-span-2"
                />
              </div>

              {selected.notes ? (
                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                    Case notes
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {selected.notes}
                  </p>
                </div>
              ) : null}

              {detailCertificate ? (
                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                        Linked certificate
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-gold">
                        {detailCertificate.certificate.number}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/verify?cert=${encodeURIComponent(detailCertificate.certificate.number)}`}
                      >
                        Verify <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}

              {!issued &&
              canReview &&
              selected.status !== "approved" &&
              selected.status !== "rejected" ? (
                <>
                  <Separator />
                  {mode === "review" ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setMode("reject")}
                        className="text-danger hover:border-danger/40 hover:bg-danger-soft hover:text-danger"
                      >
                        <ShieldX className="h-4 w-4" /> Reject
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setMode("schedule")}>
                          <CalendarClock className="h-4 w-4" /> Schedule visit
                        </Button>
                        <Button onClick={() => setMode("approve")}>
                          <BadgeCheck className="h-4 w-4" /> Approve & issue
                        </Button>
                      </div>
                    </div>
                  ) : mode === "approve" ? (
                    <div className="space-y-3 rounded-xl border border-success/25 bg-success-soft/50 p-3">
                      <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-success">
                        <ShieldCheck className="h-3 w-3" /> Issue sealed certificate
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor="approve-notes">Inspection note (optional)</Label>
                        <Textarea
                          id="approve-notes"
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Reference weights within tolerance; eccentricity and repeatability passed."
                          className="min-h-20 text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setMode("review")}>
                          Back
                        </Button>
                        <Button size="sm" onClick={() => void approve()} disabled={busy}>
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <BadgeCheck className="h-3.5 w-3.5" />
                          )}
                          Confirm issuance
                        </Button>
                      </div>
                    </div>
                  ) : mode === "reject" ? (
                    <div className="space-y-3 rounded-xl border border-danger/25 bg-danger-soft/40 p-3">
                      <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-danger">
                        <ShieldX className="h-3 w-3" /> Reject application
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor="reject-notes">Reason (visible to the applicant)</Label>
                        <Textarea
                          id="reject-notes"
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Calibration traceability expired. Resubmit with a current NABL certificate."
                          className="min-h-20 text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setMode("review")}>
                          Back
                        </Button>
                        <Button size="sm" variant="destructive" onClick={reject}>
                          <ShieldX className="h-3.5 w-3.5" /> Confirm rejection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-info/25 bg-info-soft/40 p-3">
                      <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-info">
                        <CalendarClock className="h-3 w-3" /> Schedule field inspection
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="visit-date">Inspection date</Label>
                          <Input
                            id="visit-date"
                            type="date"
                            value={schedule}
                            onChange={(event) => setSchedule(event.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="visit-notes">Instructions</Label>
                          <Input
                            id="visit-notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Mobile unit · carry E2 weights"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setMode("review")}>
                          Back
                        </Button>
                        <Button size="sm" onClick={scheduleInspection}>
                          <CalendarClock className="h-3.5 w-3.5" /> Schedule
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}

              {!canReview ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> {detail.owner?.district}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> {formatRelative(selected.submittedAt)}
                  </span>
                </div>
              ) : null}

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
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 break-words text-[11px]", mono && "font-mono")}>{value}</p>
    </div>
  );
}
