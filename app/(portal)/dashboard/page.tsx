"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  ClipboardCheck,
  Clock,
  Gauge,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PortalPageSkeleton } from "@/components/portal/loading";
import { StatCard } from "@/components/portal/stat-card";
import { ApplicationStatus, CertificateStatus } from "@/components/portal/status";
import {
  DistrictComplianceChart,
  InstrumentMix,
  IssuanceTrend,
} from "@/components/portal/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/separator";
import { ROLE_LABEL, ROLE_SHORT } from "@/lib/constants";
import {
  applicationDetails,
  computeMetrics,
  districtBreakdown,
  enrichCertificate,
  expiringCertificates,
  monthlyTrend,
  ownerApplications,
  ownerCertificates,
  ownerInstruments,
  pendingQueue,
  recentAudit,
  typeBreakdown,
} from "@/lib/registry/derive";
import { useRegistry } from "@/lib/registry/store";
import type { Role } from "@/lib/types";
import { cn, formatDate, formatRelative } from "@/lib/utils";

function greetingName(name: string) {
  const cleaned = name.replace(/^(Insp\.|Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, "");
  return cleaned.split(" ")[0] ?? name;
}

export default function DashboardPage() {
  const { state, session, hydrated } = useRegistry();
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date()),
    );
  }, []);

  const metrics = useMemo(() => computeMetrics(state), [state]);
  const trend = useMemo(() => monthlyTrend(state, 6), [state]);
  const districts = useMemo(() => districtBreakdown(state), [state]);
  const mix = useMemo(() => typeBreakdown(state), [state]);
  const queue = useMemo(() => pendingQueue(state), [state]);
  const expiring = useMemo(() => expiringCertificates(state, 4), [state]);
  const audit = useMemo(() => recentAudit(state, 6), [state]);
  const certificates = useMemo(
    () =>
      state.certificates
        .map((certificate) => enrichCertificate(state, certificate))
        .sort(
          (a, b) =>
            new Date(b.certificate.issuedAt).getTime() -
            new Date(a.certificate.issuedAt).getTime(),
        ),
    [state],
  );

  if (!hydrated || !session) return <PortalPageSkeleton />;

  const role = session.role;
  const myInstruments =
    role === "owner" && session.ownerId
      ? ownerInstruments(state, session.ownerId)
      : state.instruments;
  const myCertificates =
    role === "owner" && session.ownerId
      ? ownerCertificates(state, session.ownerId)
      : certificates;
  const myQueue =
    role === "owner" && session.ownerId
      ? ownerApplications(state, session.ownerId).map((application) =>
          applicationDetails(state, application),
        )
      : queue.slice(0, 5).map((application) => applicationDetails(state, application));

  const monthKey = new Date().toISOString().slice(0, 7);
  const issuedThisMonth = certificates.filter(
    (details) => details.certificate.issuedAt.slice(0, 7) === monthKey,
  ).length;
  const inspections = state.applications.filter((item) => item.status === "inspection").length;
  const pendingMine = myQueue.filter(
    (item) => item.application.status === "pending" || item.application.status === "inspection",
  ).length;
  const nearest = [...myCertificates]
    .filter((details) => details.state === "valid" || details.state === "expiring")
    .sort((a, b) => a.daysRemaining - b.daysRemaining)[0];

  const kpis = buildKpis(role, {
    metrics,
    instruments: myInstruments.length,
    activeInstruments: myInstruments.filter((item) => item.status === "active").length,
    totalCertificates: myCertificates.length,
    valid: myCertificates.filter(
      (item) => item.state === "valid" || item.state === "expiring",
    ).length,
    expiring: myCertificates.filter((item) => item.state === "expiring").length,
    pending: role === "owner" ? pendingMine : queue.length,
    inspections,
    issuedThisMonth,
    nearestDays: nearest?.daysRemaining ?? 0,
    nearestNumber: nearest?.certificate.number,
  });

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-radial blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="gold">{ROLE_LABEL[role]}</Badge>
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                {session.district} jurisdiction
              </span>
              {today ? <span className="text-[10px] text-muted-foreground">· {today}</span> : null}
            </div>
            <h1 className="mt-4 font-display text-[clamp(2rem,3.4vw,2.9rem)] leading-[1.05] tracking-tight">
              {role === "owner" ? "Welcome back" : role === "officer" ? "Inspection desk" : "National command"}
              , <span className="italic text-gold">{greetingName(session.name)}.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {role === "owner"
                ? "Your instruments, inspections and sealed certificates — with the next expiry already surfaced."
                : role === "officer"
                  ? "Review the district queue, schedule inspections and issue tamper-evident certificates."
                  : "Every district, every instrument, every seal. Monitor compliance and registry integrity."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {role === "owner" ? (
                <>
                  <Button asChild size="sm">
                    <Link href="/instruments/new">
                      <Plus className="h-3.5 w-3.5" /> Register instrument
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/verify">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verify a seal
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="sm">
                    <Link href="/applications">
                      <ClipboardCheck className="h-3.5 w-3.5" /> Review queue
                      <span className="rounded-full bg-gold-foreground/15 px-1.5 font-mono text-[9px]">
                        {queue.length}
                      </span>
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/analytics">
                      <TrendingUp className="h-3.5 w-3.5" /> Open analytics
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: "Certificates", value: metrics.totalCertificates },
              { label: "Instruments", value: metrics.totalInstruments },
              { label: "Pending", value: metrics.pendingApplications },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-background/50 px-3 py-2.5 backdrop-blur"
              >
                <p className="font-display text-2xl leading-none">{stat.value}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle>Issuance & demand</CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Certificates issued against applications received, last 6 months
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 font-mono text-[9px] uppercase tracking-[0.1em]">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" /> issued
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-info" /> apps
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-60 w-full">
              <IssuanceTrend data={trend} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Compliance by district</CardTitle>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Share of certificates currently valid or in renewal
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-60 w-full">
              <DistrictComplianceChart data={districts} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle>{role === "owner" ? "My applications" : "Verification queue"}</CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {role === "owner"
                  ? "Live status of every submission"
                  : `${queue.length} applications awaiting action · priority first`}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/applications">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0 sm:px-0 sm:pb-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="table-head">
                  <tr>
                    <th className="px-5 py-2.5 font-medium sm:px-6">Application</th>
                    <th className="px-3 py-2.5 font-medium">Instrument</th>
                    <th className="px-3 py-2.5 font-medium">Submitted</th>
                    <th className="px-5 py-2.5 text-right font-medium sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myQueue.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground sm:px-6">
                        Nothing in the queue. {role === "owner" ? "Register an instrument to begin." : "The district is clear."}
                      </td>
                    </tr>
                  ) : null}
                  {myQueue.map(({ application, instrument, owner }) => (
                    <tr key={application.id} className="border-t border-border/70 transition-colors hover:bg-muted/25">
                      <td className="px-5 py-3 sm:px-6">
                        <p className="font-mono text-[10px] text-foreground">{application.number}</p>
                        <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">
                          {application.priority} priority
                        </p>
                      </td>
                      <td className="max-w-[220px] px-3 py-3">
                        <p className="truncate text-[11px]">{instrument?.name ?? "—"}</p>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          {role === "owner" ? instrument?.serial : owner?.organization}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[10px] text-muted-foreground">
                        {formatRelative(application.submittedAt)}
                      </td>
                      <td className="px-5 py-3 text-right sm:px-6">
                        <ApplicationStatus status={application.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle>Renewal radar</CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground">Within 45 days</p>
            </div>
            <Badge variant="warning" dot>
              {expiring.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {expiring.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
                No certificates are inside the renewal window.
              </div>
            ) : null}
            {expiring.map((details) => {
              const percent = Math.max(0, Math.min(100, ((45 - details.daysRemaining) / 45) * 100));
              return (
                <Link
                  key={details.certificate.id}
                  href={`/verify?cert=${encodeURIComponent(details.certificate.number)}`}
                  className="block rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-warning/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px]">{details.certificate.number}</p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                        {details.instrument?.name}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-warning">
                      {details.daysRemaining}d
                    </span>
                  </div>
                  <Progress value={percent} className="mt-2 h-1" indicatorClassName="bg-warning" />
                  <p className="mt-1.5 text-[9px] text-muted-foreground">
                    Expires {formatDate(details.certificate.validUntil)}
                  </p>
                </Link>
              );
            })}
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/certificates">
                Certificate register <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
            <CardTitle>Recent certificates</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/certificates">
                Register <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0 sm:px-0 sm:pb-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead className="table-head">
                  <tr>
                    <th className="px-5 py-2.5 font-medium sm:px-6">Certificate</th>
                    <th className="px-3 py-2.5 font-medium">Holder</th>
                    <th className="px-3 py-2.5 font-medium">Valid until</th>
                    <th className="px-5 py-2.5 text-right font-medium sm:px-6">State</th>
                  </tr>
                </thead>
                <tbody>
                  {myCertificates.slice(0, 5).map((details) => (
                    <tr key={details.certificate.id} className="border-t border-border/70 transition-colors hover:bg-muted/25">
                      <td className="px-5 py-3 sm:px-6">
                        <Link
                          href={`/verify?cert=${encodeURIComponent(details.certificate.number)}`}
                          className="font-mono text-[10px] hover:text-gold"
                        >
                          {details.certificate.number}
                        </Link>
                        <p className="mt-0.5 max-w-[200px] truncate text-[10px] text-muted-foreground">
                          {details.instrument?.name}
                        </p>
                      </td>
                      <td className="max-w-[180px] px-3 py-3">
                        <p className="truncate text-[11px]">{details.owner?.organization ?? "—"}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {details.instrument?.district}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[10px] text-muted-foreground">
                        {formatDate(details.certificate.validUntil)}
                      </td>
                      <td className="px-5 py-3 text-right sm:px-6">
                        <CertificateStatus state={details.state} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
            <CardTitle>Audit stream</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/audit">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-0 pt-0">
            {audit.map((event) => (
              <div key={event.id} className="flex gap-3 border-b border-border/60 py-2.5 last:border-0">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      event.action.startsWith("certificate.issued")
                        ? "bg-success"
                        : event.action.startsWith("certificate.revoked") ||
                            event.action.startsWith("application.rejected")
                          ? "bg-danger"
                          : event.action.startsWith("verification")
                            ? "bg-gold"
                            : "bg-info",
                    )}
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium capitalize">
                    {event.action.replace(/\./g, " · ")}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                    {event.detail}
                  </p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground/70">
                    {event.actor} · {formatRelative(event.at)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.55fr_1.45fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Instrument mix</CardTitle>
            <p className="mt-1 text-[11px] text-muted-foreground">Registered categories</p>
          </CardHeader>
          <CardContent className="pt-2">
            <InstrumentMix data={mix.slice(0, 5)} />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[size:48px_48px] opacity-[0.12]" />
          <CardHeader className="relative pb-2">
            <CardTitle>Chain of custody</CardTitle>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {ROLE_SHORT[role]} view · signed by the national root authority
            </p>
          </CardHeader>
          <CardContent className="relative grid gap-3 pt-2 sm:grid-cols-3">
            {[
              {
                icon: Scale,
                label: "Instruments on file",
                value: metrics.totalInstruments,
                hint: `${metrics.activeInstruments} active`,
              },
              {
                icon: BadgeCheck,
                label: "Sealed certificates",
                value: metrics.totalCertificates,
                hint: `${metrics.validCertificates} currently valid`,
              },
              {
                icon: Gauge,
                label: "Compliance rate",
                value: `${Math.round(metrics.complianceRate)}%`,
                hint: `${metrics.districtsCovered} districts covered`,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-background/50 p-3">
                <item.icon className="h-4 w-4 text-gold" />
                <p className="mt-2 font-display text-2xl leading-none">{item.value}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-[9px] text-muted-foreground">{item.hint}</p>
              </div>
            ))}
            <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/20 bg-gold/5 px-3 py-2.5">
              <p className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-gold">
                <Sparkles className="h-3 w-3" /> Seal algorithm LMV-SEAL-2.0 · SHA-256
              </p>
              <Link href="/audit" className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-gold">
                Inspect integrity <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type MetricBundle = {
  metrics: ReturnType<typeof computeMetrics>;
  instruments: number;
  activeInstruments: number;
  totalCertificates: number;
  valid: number;
  expiring: number;
  pending: number;
  inspections: number;
  issuedThisMonth: number;
  nearestDays: number;
  nearestNumber?: string;
};

function buildKpis(role: Role, bundle: MetricBundle) {
  if (role === "owner") {
    return [
      {
        label: "My instruments",
        value: bundle.instruments,
        hint: `${bundle.activeInstruments} active and trade-ready`,
        icon: Scale,
        tone: "gold" as const,
        href: "/instruments",
      },
      {
        label: "Valid certificates",
        value: bundle.valid,
        hint: `${bundle.expiring} inside the renewal window`,
        icon: BadgeCheck,
        tone: "success" as const,
        href: "/certificates",
      },
      {
        label: "Open applications",
        value: bundle.pending,
        hint: "Pending review or inspection",
        icon: ClipboardCheck,
        tone: "info" as const,
        href: "/applications",
      },
      {
        label: "Next expiry",
        value: bundle.nearestNumber ? bundle.nearestDays : "—",
        suffix: bundle.nearestNumber ? "d" : "",
        hint: bundle.nearestNumber ?? "No active certificate",
        icon: Clock,
        tone: "warning" as const,
        href: "/certificates",
      },
    ];
  }

  if (role === "officer") {
    return [
      {
        label: "Queue depth",
        value: bundle.pending,
        hint: "Priority applications sorted first",
        icon: ClipboardCheck,
        tone: "gold" as const,
        href: "/applications",
      },
      {
        label: "Inspections",
        value: bundle.inspections,
        hint: "Scheduled field visits",
        icon: CalendarClock,
        tone: "info" as const,
        href: "/applications",
      },
      {
        label: "Issued this month",
        value: bundle.issuedThisMonth,
        hint: "Sealed against national standards",
        icon: BadgeCheck,
        tone: "success" as const,
        href: "/certificates",
      },
      {
        label: "Compliance",
        value: Math.round(bundle.metrics.complianceRate),
        suffix: "%",
        hint: `${bundle.metrics.expiringCertificates} renewals approaching`,
        icon: Gauge,
        tone: "warning" as const,
        href: "/analytics",
      },
    ];
  }

  return [
    {
      label: "Instruments",
      value: bundle.metrics.totalInstruments,
      hint: `${bundle.metrics.activeInstruments} active · ${bundle.metrics.districtsCovered} districts`,
      icon: Scale,
      tone: "gold" as const,
      href: "/instruments",
    },
    {
      label: "Valid certificates",
      value: bundle.metrics.validCertificates,
      hint: `${bundle.metrics.totalCertificates} sealed on record`,
      icon: BadgeCheck,
      tone: "success" as const,
      href: "/certificates",
    },
    {
      label: "Pending applications",
      value: bundle.metrics.pendingApplications,
      hint: "Across every district queue",
      icon: ClipboardCheck,
      tone: "warning" as const,
      href: "/applications",
    },
    {
      label: "Compliance rate",
      value: Math.round(bundle.metrics.complianceRate),
      suffix: "%",
      hint: `${bundle.metrics.revokedCertificates} revoked · ${bundle.metrics.expiredCertificates} expired`,
      icon: Gauge,
      tone: "info" as const,
      href: "/analytics",
    },
  ];
}
