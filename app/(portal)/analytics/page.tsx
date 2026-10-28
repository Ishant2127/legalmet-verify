"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Download,
  Fingerprint,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  DistrictComplianceChart,
  InstrumentMix,
  IssuanceTrend,
  VerificationTrend,
} from "@/components/portal/charts";
import { PortalPageSkeleton } from "@/components/portal/loading";
import { PageHeader } from "@/components/portal/page-header";
import { RoleGuard } from "@/components/portal/role-guard";
import { StatCard } from "@/components/portal/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/separator";
import { canonicalCertificatePayload, sha256Hex, shortHash } from "@/lib/crypto";
import {
  computeMetrics,
  districtBreakdown,
  monthlyTrend,
  typeBreakdown,
} from "@/lib/registry/derive";
import { useRegistry } from "@/lib/registry/store";
import { cn, downloadBlob, formatDate, formatPercent } from "@/lib/utils";

type IntegrityAudit = {
  checked: number;
  intact: number;
  broken: number;
  lastRun: string;
};

export default function AnalyticsPage() {
  const { state, hydrated, session } = useRegistry();
  const [integrity, setIntegrity] = useState<IntegrityAudit | null>(null);
  const [auditing, setAuditing] = useState(false);

  const metrics = useMemo(() => computeMetrics(state), [state]);
  const trend = useMemo(() => monthlyTrend(state, 6), [state]);
  const districts = useMemo(() => districtBreakdown(state), [state]);
  const mix = useMemo(() => typeBreakdown(state), [state]);

  const verifications = useMemo(
    () => state.audit.filter((event) => event.action === "verification.performed").length,
    [state.audit],
  );
  const averageScore = useMemo(() => {
    if (!state.certificates.length) return 0;
    return Math.round(
      state.certificates.reduce((sum, item) => sum + item.inspectionScore, 0) /
        state.certificates.length,
    );
  }, [state.certificates]);

  const scoreBuckets = useMemo(() => {
    const buckets = [
      { label: "90–94", min: 90, max: 94, count: 0 },
      { label: "95–97", min: 95, max: 97, count: 0 },
      { label: "98–100", min: 98, max: 100, count: 0 },
    ];
    for (const certificate of state.certificates) {
      const bucket = buckets.find(
        (item) =>
          certificate.inspectionScore >= item.min && certificate.inspectionScore <= item.max,
      );
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }, [state.certificates]);

  const runAudit = useCallback(async () => {
    setAuditing(true);
    let intact = 0;
    let broken = 0;
    for (const certificate of state.certificates) {
      const instrument = state.instruments.find(
        (item) => item.id === certificate.instrumentId,
      );
      if (!instrument || !certificate.hash) continue;
      const digest = await sha256Hex(
        canonicalCertificatePayload({
          number: certificate.number,
          serial: instrument.serial,
          issuedAt: certificate.issuedAt,
        }),
      );
      if (digest === certificate.hash) intact += 1;
      else broken += 1;
    }
    setIntegrity({
      checked: intact + broken,
      intact,
      broken,
      lastRun: new Date().toISOString(),
    });
    setAuditing(false);
  }, [state]);

  useEffect(() => {
    if (!hydrated) return;
    void runAudit();
  }, [hydrated, runAudit]);

  if (!hydrated || !session) return <PortalPageSkeleton />;

  const bestDistrict = [...districts].sort((a, b) => b.compliance - a.compliance)[0];
  const worstDistrict = [...districts].sort((a, b) => a.compliance - b.compliance)[0];

  function exportDistricts() {
    const rows = [
      ["district", "instruments", "certificates", "valid", "pending", "compliance"],
      ...districts.map((row) => [
        row.district,
        row.instruments,
        row.certificates,
        row.valid,
        row.pending,
        Math.round(row.compliance),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `legalmet-district-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success("District analytics exported");
  }

  return (
    <RoleGuard roles={["officer", "admin"]}>
      <div className="space-y-5">
        <PageHeader
          eyebrow="National intelligence"
          title={
            <>
              Compliance, <span className="italic text-gold">measured.</span>
            </>
          }
          description="Issuance velocity, district-level compliance, instrument mix and a live cryptographic integrity audit of every seal."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={exportDistricts}>
                <Download className="h-3.5 w-3.5" /> Export districts
              </Button>
              <Button asChild size="sm">
                <Link href="/audit">
                  <ShieldCheck className="h-3.5 w-3.5" /> Audit trail
                </Link>
              </Button>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Compliance rate"
            value={Math.round(metrics.complianceRate)}
            suffix="%"
            hint="Valid or in renewal across all certificates"
            icon={Gauge}
            tone="success"
          />
          <StatCard
            label="Sealed certificates"
            value={metrics.totalCertificates}
            hint={`${metrics.validCertificates} valid · ${metrics.revokedCertificates} revoked`}
            icon={BadgeCheck}
            tone="gold"
          />
          <StatCard
            label="Public verifications"
            value={verifications}
            hint="Recorded in the audit stream"
            icon={TrendingUp}
            tone="info"
          />
          <StatCard
            label="Average score"
            value={averageScore}
            suffix="/100"
            hint="Field inspection quality"
            icon={Sparkles}
            tone="warning"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
              <div>
                <CardTitle>Issuance & demand</CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Six-month certificate and application momentum
                </p>
              </div>
              <Badge variant="outline">6 months</Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <IssuanceTrend data={trend} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Instrument mix</CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Registered categories in scope
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <InstrumentMix data={mix.slice(0, 5)} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Verification pressure</CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Public lookups against certificates reaching expiry
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-56 w-full">
                <VerificationTrend data={trend} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Compliance by district</CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Share of certificates valid or in renewal
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-56 w-full">
                <DistrictComplianceChart data={districts} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_0.5fr]">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
              <CardTitle>District scorecard</CardTitle>
              <Badge variant="success" dot>
                live
              </Badge>
            </CardHeader>
            <CardContent className="px-0 pb-0 sm:px-0 sm:pb-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-xs">
                  <thead className="table-head">
                    <tr>
                      <th className="px-5 py-2.5 font-medium sm:px-6">District</th>
                      <th className="px-3 py-2.5 text-right font-medium">Instruments</th>
                      <th className="px-3 py-2.5 text-right font-medium">Valid</th>
                      <th className="px-3 py-2.5 text-right font-medium">Pending</th>
                      <th className="px-5 py-2.5 font-medium sm:px-6">Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districts.map((row) => (
                      <tr key={row.district} className="border-t border-border/70">
                        <td className="px-5 py-3 text-[11px] sm:px-6">{row.district}</td>
                        <td className="px-3 py-3 text-right font-mono text-[10px]">
                          {row.instruments}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[10px] text-success">
                          {row.valid}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[10px] text-warning">
                          {row.pending}
                        </td>
                        <td className="px-5 py-3 sm:px-6">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={row.compliance}
                              className="h-1.5"
                              indicatorClassName={
                                row.compliance >= 85
                                  ? "bg-success"
                                  : row.compliance >= 65
                                    ? "bg-gold"
                                    : "bg-warning"
                              }
                            />
                            <span className="w-9 text-right font-mono text-[9px] text-muted-foreground">
                              {formatPercent(row.compliance)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Seal integrity audit</CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  SHA-256 recomputed for every certificate
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border",
                        integrity && integrity.broken > 0
                          ? "border-danger/25 bg-danger-soft text-danger"
                          : "border-success/25 bg-success-soft text-success",
                      )}
                    >
                      {integrity && integrity.broken > 0 ? (
                        <TriangleAlert className="h-4 w-4" />
                      ) : (
                        <Fingerprint className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {auditing
                          ? "Auditing…"
                          : integrity
                            ? integrity.broken === 0
                              ? "All seals intact"
                              : `${integrity.broken} mismatches`
                            : "Awaiting audit"}
                      </p>
                      <p className="font-mono text-[9px] text-muted-foreground">
                        {integrity
                          ? `${integrity.intact}/${integrity.checked} verified`
                          : "Recomputing canonical payloads"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void runAudit()}
                    disabled={auditing}
                    aria-label="Re-run integrity audit"
                  >
                    {auditing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                  {integrity ? `Last run ${formatDate(integrity.lastRun)}` : "—"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Inspection quality</CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Score distribution
                </p>
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                {scoreBuckets.map((bucket) => {
                  const total = state.certificates.length || 1;
                  const percent = (bucket.count / total) * 100;
                  return (
                    <div key={bucket.label}>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{bucket.label}</span>
                        <span className="font-mono">{bucket.count}</span>
                      </div>
                      <Progress
                        value={percent}
                        className="mt-1 h-1"
                        indicatorClassName={bucket.label === "98–100" ? "bg-success" : "bg-gold"}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <InsightCard
            label="Strongest district"
            value={bestDistrict?.district ?? "—"}
            detail={bestDistrict ? `${formatPercent(bestDistrict.compliance)} compliance` : "—"}
            tone="success"
          />
          <InsightCard
            label="Needs attention"
            value={worstDistrict?.district ?? "—"}
            detail={
              worstDistrict
                ? `${formatPercent(worstDistrict.compliance)} compliance · ${worstDistrict.pending} pending`
                : "—"
            }
            tone="warning"
          />
          <InsightCard
            label="Renewal load"
            value={`${metrics.expiringCertificates} certificates`}
            detail="Inside the 45-day renewal window"
            tone="gold"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
          <p className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-gold" />
            Every metric is derived live from the registry snapshot — no cached aggregates.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gold hover:underline"
          >
            Open audit trail <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <p className="text-center font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/60">
          Seal digest sample {shortHash(state.certificates[0]?.hash ?? "", 16, 10)}
        </p>
      </div>
    </RoleGuard>
  );
}

function InsightCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "success" | "warning" | "gold";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-gold",
          )}
        />
      </div>
      <p className="mt-2 truncate font-display text-xl tracking-tight">{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}
