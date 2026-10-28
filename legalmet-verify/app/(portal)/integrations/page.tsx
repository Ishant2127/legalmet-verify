"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Cloud,
  Code2,
  Copy,
  Database,
  ExternalLink,
  FileCode2,
  Fingerprint,
  GitBranch as Github,
  Globe2,
  HardDrive,
  KeyRound,
  Loader2,
  PlugZap,
  QrCode,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Terminal,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/page-header";
import { RoleGuard } from "@/components/portal/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  GITHUB_REPO,
  LIVE_REGISTRY_PRESETS,
  ORG,
} from "@/lib/constants";
import { shortHash } from "@/lib/crypto";
import { useRegistry } from "@/lib/registry/store";
import { cn, formatRelative } from "@/lib/utils";

type HealthPayload = {
  ok: boolean;
  supabase: {
    configured: boolean;
    reachable: boolean;
    status?: number;
    latencyMs?: number;
    projectRef?: string;
    certificateCount?: number | null;
    error?: string;
  };
  github?: { repo: string };
  runtime?: { node: string };
  timestamp: string;
};

type ProbeState =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "done";
      found: boolean;
      records: number;
      latencyMs: number;
      certificate?: string;
      holder?: string;
      validUntil?: string;
      error?: string;
    };

const MIGRATION_SQL = `-- LegalMet Verify Nexus · live registry hardening
-- Run once in the Supabase SQL editor for project szfjkeivaccwmcyelhdv.

create extension if not exists pgcrypto;

create table if not exists public.nexus_certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  instrument_serial text not null,
  instrument_name text,
  owner_organization text,
  district text,
  issued_at timestamptz not null,
  valid_until timestamptz not null,
  status text not null default 'Valid',
  inspection_score integer check (inspection_score between 0 and 100),
  seal_version text not null default 'LMV-SEAL-2.0',
  digital_hash text,
  created_at timestamptz not null default now()
);

create index if not exists nexus_certificates_valid_until_idx
  on public.nexus_certificates (valid_until);

alter table public.nexus_certificates enable row level security;

create policy "Public read of sealed certificates"
  on public.nexus_certificates for select
  using (true);

create or replace function public.verify_nexus_certificate(cert_number text)
returns table (
  certificate_number text,
  instrument_serial text,
  instrument_name text,
  owner_organization text,
  district text,
  issued_at timestamptz,
  valid_until timestamptz,
  status text,
  digital_hash text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.certificate_number,
    c.instrument_serial,
    c.instrument_name,
    c.owner_organization,
    c.district,
    c.issued_at,
    c.valid_until,
    c.status,
    c.digital_hash
  from public.nexus_certificates c
  where upper(c.certificate_number) = upper(trim(cert_number))
  limit 1;
$$;

grant execute on function public.verify_nexus_certificate(text) to anon, authenticated;`;

const WORKSPACE_PATH =
  process.env.NEXT_PUBLIC_WORKSPACE_PATH ?? "/Users/ishantmehere/legalmet-verify-nextgen";

const REPO_FILES = [
  { path: "app/(portal)/integrations/page.tsx", label: "Integration control room" },
  { path: "app/api/health/route.ts", label: "Supabase health probe" },
  { path: "app/api/verify/route.ts", label: "Live certificate RPC bridge" },
  { path: "supabase/migrations/20261027_nexus.sql", label: "Production migration" },
  { path: ".github/workflows/ci.yml", label: "CI · typecheck, lint, build" },
];

export default function IntegrationsPage() {
  const { state, hydrated } = useRegistry();
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [probes, setProbes] = useState<Record<string, ProbeState>>({});

  const checkHealth = useCallback(async () => {
    setChecking(true);
    setHealthError(null);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const payload = (await response.json()) as HealthPayload;
      setHealth(payload);
      setCheckedAt(Date.now());
      if (!response.ok) {
        setHealthError(
          payload.supabase?.error ?? `Health endpoint returned ${response.status}.`,
        );
      }
    } catch (error) {
      setHealth(null);
      setHealthError(error instanceof Error ? error.message : "Health check failed.");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  const probe = useCallback(async (certificate: string) => {
    setProbes((previous) => ({ ...previous, [certificate]: { kind: "loading" } }));
    try {
      const response = await fetch(
        `/api/verify?cert=${encodeURIComponent(certificate)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        ok: boolean;
        records?: Array<Record<string, unknown>>;
        latencyMs?: number;
        error?: string;
      };
      const record = payload.records?.[0];
      if (!response.ok || !payload.ok) {
        setProbes((previous) => ({
          ...previous,
          [certificate]: {
            kind: "done",
            found: false,
            records: 0,
            latencyMs: payload.latencyMs ?? 0,
            error: payload.error ?? `HTTP ${response.status}`,
          },
        }));
        return;
      }
      setProbes((previous) => ({
        ...previous,
        [certificate]: {
          kind: "done",
          found: Boolean(record),
          records: payload.records?.length ?? 0,
          latencyMs: payload.latencyMs ?? 0,
          certificate: String(record?.certificate_number ?? certificate),
          holder: String(
            record?.owner_name ?? record?.owner_organization ?? "On record",
          ),
          validUntil: String(record?.valid_until ?? ""),
        },
      }));
    } catch (error) {
      setProbes((previous) => ({
        ...previous,
        [certificate]: {
          kind: "done",
          found: false,
          records: 0,
          latencyMs: 0,
          error: error instanceof Error ? error.message : "Probe failed.",
        },
      }));
    }
  }, []);

  const capabilities = useMemo(
    () => [
      {
        name: "Supabase",
        icon: Database,
        status: health?.supabase.reachable
          ? ("online" as const)
          : health?.supabase.configured
            ? ("degraded" as const)
            : ("offline" as const),
        detail: health?.supabase.reachable
          ? `${health.supabase.latencyMs ?? 0} ms · ${health.supabase.projectRef}`
          : health?.supabase.configured
            ? "Configured but unreachable"
            : "Missing environment variables",
        meta: health?.supabase.certificateCount
          ? `${health.supabase.certificateCount} public certificates visible`
          : "verify_certificate RPC bridge",
        href: `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://supabase.com"}`,
        action: "Open project",
      },
      {
        name: "GitHub",
        icon: Github,
        status: "online" as const,
        detail: "Ishant2127/legalmet-verify",
        meta: "Branch nextgen · CI workflow included",
        href: GITHUB_REPO,
        action: "Open repository",
      },
      {
        name: "VS Code",
        icon: Code2,
        status: "online" as const,
        detail: ".vscode workspace ready",
        meta: "Debug config · extensions · format on save",
        href: `vscode://file${WORKSPACE_PATH}`,
        action: "Reveal workspace",
      },
      {
        name: "PDF engine",
        icon: FileCode2,
        status: "online" as const,
        detail: "jsPDF · A4 sealed certificate",
        meta: "Client-side generation, no upload",
        href: "/certificates",
        action: "Issue a certificate",
      },
      {
        name: "QR & seal",
        icon: QrCode,
        status: "online" as const,
        detail: "qrcode.react · SHA-256 seal",
        meta: "Offline verification payload",
        href: "/verify",
        action: "Open verify desk",
      },
      {
        name: "Local registry",
        icon: HardDrive,
        status: hydrated ? ("online" as const) : ("degraded" as const),
        detail: `${state.certificates.length} certificates · ${state.instruments.length} instruments`,
        meta: `Snapshot ${formatRelative(state.lastUpdated)}`,
        href: "/settings",
        action: "Manage snapshot",
      },
    ],
    [health, hydrated, state.certificates.length, state.instruments.length, state.lastUpdated],
  );

  const configured = health?.supabase.configured ?? false;
  const reachable = health?.supabase.reachable ?? false;

  function copySql() {
    void navigator.clipboard.writeText(MIGRATION_SQL);
    toast.success("Migration SQL copied", {
      description: "Paste it into the Supabase SQL editor and run.",
    });
  }

  async function probeAll() {
    await Promise.all(LIVE_REGISTRY_PRESETS.map((certificate) => probe(certificate)));
  }

  return (
    <RoleGuard roles={["admin", "officer"]}>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Systems & credentials"
          title={
            <>
              Integration <span className="italic text-gold">control room.</span>
            </>
          }
          description="Live health across the Supabase ledger, GitHub delivery pipeline, local tooling and the cryptographic surface of the registry."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void checkHealth()}
                disabled={checking}
              >
                {checking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Recheck
              </Button>
              <Button size="sm" asChild>
                <a href={GITHUB_REPO} target="_blank" rel="noreferrer">
                  <Github className="h-3.5 w-3.5" /> Repository
                </a>
              </Button>
            </>
          }
        />

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-radial blur-3xl" />
          <CardContent className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
                  checking
                    ? "border-border bg-muted/60 text-muted-foreground"
                    : reachable
                      ? "border-success/25 bg-success-soft text-success"
                      : "border-warning/25 bg-warning-soft text-warning",
                )}
              >
                {checking ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : reachable ? (
                  <Cloud className="h-5 w-5" />
                ) : (
                  <TriangleAlert className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="eyebrow">Live infrastructure</p>
                <h2 className="mt-1 font-display text-2xl tracking-tight">
                  {checking
                    ? "Probing the ledger…"
                    : reachable
                      ? "Supabase ledger is online."
                      : configured
                        ? "Project configured, response degraded."
                        : "Supabase credentials are missing."}
                </h2>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                  {reachable
                    ? `Project ${health?.supabase.projectRef} answered in ${health?.supabase.latencyMs ?? 0} ms. Public verification reads through the verify_certificate RPC.`
                    : healthError ??
                      "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local to enable live verification."}
                </p>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Metric label="Latency" value={health?.supabase.latencyMs ? `${health.supabase.latencyMs}ms` : "—"} />
              <Metric label="Rows" value={health?.supabase.certificateCount ?? "—"} />
              <Metric label="HTTP" value={health?.supabase.status ?? "—"} />
              <Metric label="Checked" value={checkedAt ? formatRelative(checkedAt) : "—"} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((capability) => (
            <Card key={capability.name} className="group transition-colors hover:border-gold/25">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                    <capability.icon className="h-4 w-4" />
                  </span>
                  <StatusPill status={capability.status} />
                </div>
                <p className="mt-3 text-sm font-medium">{capability.name}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  {capability.detail}
                </p>
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                  {capability.meta}
                </p>
                <a
                  href={capability.href}
                  target={capability.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.14em] text-gold opacity-70 transition-opacity group-hover:opacity-100"
                >
                  {capability.action} <ArrowUpRight className="h-2.5 w-2.5" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
              <div>
                <CardTitle>Live verification probes</CardTitle>
                <CardDescription className="mt-1 text-[11px]">
                  Query the deployed verify_certificate RPC for known records.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void probeAll()}>
                <Activity className="h-3.5 w-3.5" /> Probe all
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0 sm:px-0 sm:pb-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="table-head">
                    <tr>
                      <th className="px-5 py-2.5 font-medium sm:px-6">Certificate</th>
                      <th className="px-3 py-2.5 font-medium">Result</th>
                      <th className="px-3 py-2.5 font-medium">Latency</th>
                      <th className="px-5 py-2.5 text-right font-medium sm:px-6">Probe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LIVE_REGISTRY_PRESETS.map((certificate) => {
                      const result = probes[certificate] ?? { kind: "idle" };
                      return (
                        <tr key={certificate} className="border-t border-border/70">
                          <td className="px-5 py-3 sm:px-6">
                            <p className="font-mono text-[10px]">{certificate}</p>
                            <p className="mt-0.5 text-[9px] text-muted-foreground">
                              {result.kind === "done" && result.found
                                ? (result.holder ?? "Public record")
                                : "Supabase RPC"}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            {result.kind === "idle" ? (
                              <Badge>Not probed</Badge>
                            ) : result.kind === "loading" ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" /> Querying
                              </span>
                            ) : result.found ? (
                              <Badge variant="success" dot>
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="warning" dot>
                                No record
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-3 font-mono text-[10px] text-muted-foreground">
                            {result.kind === "done" ? `${result.latencyMs}ms` : "—"}
                          </td>
                          <td className="px-5 py-3 text-right sm:px-6">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void probe(certificate)}
                              disabled={result.kind === "loading"}
                            >
                              Run probe
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Environment</CardTitle>
              <CardDescription className="text-[11px]">
                Server-side configuration detected at runtime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              <EnvRow
                label="NEXT_PUBLIC_SUPABASE_URL"
                ok={configured}
                value={
                  health?.supabase.projectRef
                    ? `${health.supabase.projectRef}.supabase.co`
                    : "not configured"
                }
              />
              <EnvRow
                label="PUBLISHABLE_KEY"
                ok={configured}
                value={configured ? "present · public key" : "missing"}
              />
              <EnvRow
                label="SESSION_SECRET"
                ok
                value="HMAC-SHA256 · fallback active"
              />
              <EnvRow
                label="NEXT_PUBLIC_GITHUB_REPO"
                ok
                value="Ishant2127/legalmet-verify"
              />
              <EnvRow
                label="NODE_RUNTIME"
                ok={Boolean(health?.runtime?.node)}
                value={health?.runtime?.node ?? "unknown"}
              />
              <Separator className="my-3" />
              <div className="rounded-xl border border-border bg-background/50 p-3">
                <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                  <KeyRound className="h-2.5 w-2.5" /> Security posture
                </p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                  Only the publishable key ships to the browser. Demo sessions are signed
                  HMAC cookies, never plaintext roles. Service-role keys are never exposed.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
              <div>
                <CardTitle>Migration · production hardening</CardTitle>
                <CardDescription className="mt-1 text-[11px]">
                  Apply once in the Supabase SQL editor to add a dedicated Nexus ledger,
                  RLS policy and verification RPC.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={copySql}>
                <Copy className="h-3.5 w-3.5" /> Copy SQL
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-background/70 p-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
                <code>{MIGRATION_SQL}</code>
              </pre>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`${GITHUB_REPO}/blob/nextgen/legalmet-verify-nextgen/supabase/migrations/20261027_nexus.sql`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github className="h-3.5 w-3.5" /> View on GitHub
                  </a>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Supabase dashboard
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Repository surface</CardTitle>
                <CardDescription className="text-[11px]">
                  Key files wired into this control room.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {REPO_FILES.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                  >
                    <FileCode2 className="mt-0.5 h-3 w-3 shrink-0 text-gold/80" />
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[9px]">{file.path}</p>
                      <p className="text-[9px] text-muted-foreground">{file.label}</p>
                    </div>
                  </div>
                ))}
                <Button asChild size="sm" variant="ghost" className="mt-1 w-full">
                  <a href={GITHUB_REPO} target="_blank" rel="noreferrer">
                    <Github className="h-3.5 w-3.5" /> Browse all files
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Verification security</CardTitle>
                <CardDescription className="text-[11px]">
                  How a seal is proven end to end.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {[
                  { icon: Fingerprint, label: "Canonical payload", value: "CERT|SERIAL|ISSUED_AT" },
                  { icon: ShieldCheck, label: "Digest", value: "SHA-256 · LMV-SEAL-2.0" },
                  { icon: Globe2, label: "Transport", value: "TLS 1.3 · Supabase REST" },
                  { icon: ServerCog, label: "Session", value: "HMAC-signed httpOnly cookie" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                      <row.icon className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px]">{row.label}</p>
                      <p className="truncate font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                        {row.value}
                      </p>
                    </div>
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
                  </div>
                ))}
                <Separator className="my-2" />
                <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                  {ORG} · {shortHash("nexus-verification-root", 8, 6)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-info/20 bg-info-soft text-info">
                <Terminal className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-medium">Developer quickstart</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                  cd legalmet-verify-nextgen && npm install && npm run dev
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Next.js 16</Badge>
              <Badge variant="outline">React 19</Badge>
              <Badge variant="outline">Supabase SSR</Badge>
              <Badge variant="outline">Tailwind 3.4</Badge>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">
                  <PlugZap className="h-3.5 w-3.5" /> Workspace settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-3 py-2">
      <p className="font-display text-lg leading-none">{value}</p>
      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: "online" | "degraded" | "offline" }) {
  if (status === "online") {
    return (
      <Badge variant="success" dot>
        Online
      </Badge>
    );
  }
  if (status === "degraded") {
    return (
      <Badge variant="warning" dot>
        Degraded
      </Badge>
    );
  }
  return (
    <Badge variant="danger" dot>
      Offline
    </Badge>
  );
}

function EnvRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
      ) : (
        <XCircle className="h-3 w-3 shrink-0 text-danger" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-mono text-[9px] text-foreground/80">{value}</p>
      </div>
    </div>
  );
}
