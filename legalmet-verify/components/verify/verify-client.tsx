"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Fingerprint,
  History,
  Loader2,
  LockKeyhole,
  Printer,
  RotateCcw,
  ScanLine,
  Search,
  Share2,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Terminal,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CertificateDocument } from "@/components/verify/certificate-document";
import { CERTIFICATE_STATUS_META, LIVE_REGISTRY_PRESETS } from "@/lib/constants";
import { viewFromDemo, viewFromLive, extractCertificateQuery, type CertificateView } from "@/lib/certificate-view";
import { canonicalCertificatePayload, sha256Hex, shortHash } from "@/lib/crypto";
import { downloadCertificatePdf } from "@/lib/pdf";
import { searchRegistry } from "@/lib/registry/derive";
import { verifyLiveCertificate } from "@/lib/registry/live";
import { useRegistry } from "@/lib/registry/store";
import type { CertificateState } from "@/lib/types";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

const RECENT_KEY = "lmv-nexus-recent-checks";
const DEMO_PRESETS: Array<{ number: string; state: CertificateState; label: string }> = [
  { number: "LMV-CERT-2026-0103", state: "valid", label: "Valid seal" },
  { number: "LMV-CERT-2026-0104", state: "expiring", label: "Expiring" },
  { number: "LMV-CERT-2026-0105", state: "expired", label: "Expired" },
  { number: "LMV-CERT-2026-0106", state: "revoked", label: "Revoked" },
];

type Outcome = {
  view: CertificateView;
  digest: string;
  integrity: boolean | null;
  source: "demo" | "supabase";
  latencyMs: number;
  matchNote?: string;
};

type Lookup =
  | { kind: "idle" }
  | { kind: "loading"; query: string }
  | { kind: "found"; outcome: Outcome }
  | { kind: "missing"; query: string; latencyMs: number; liveError?: string };

type RecentCheck = {
  number: string;
  at: string;
  state: CertificateState;
  source: "demo" | "supabase";
};

export function VerifyClient({ initialCert }: { initialCert?: string }) {
  const { state, hydrated, recordVerification } = useRegistry();
  const [query, setQuery] = useState(initialCert ?? "");
  const [lookup, setLookup] = useState<Lookup>({ kind: "idle" });
  const [recent, setRecent] = useState<RecentCheck[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const lastAuto = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RecentCheck[];
      if (Array.isArray(parsed)) setRecent(parsed.slice(0, 6));
    } catch {
      // Ignore malformed recent-check history.
    }
  }, []);

  const remember = useCallback((entry: RecentCheck) => {
    setRecent((previous) => {
      const next = [entry, ...previous.filter((item) => item.number !== entry.number)].slice(0, 6);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // Recent checks are a convenience; failure must not block verification.
      }
      return next;
    });
  }, []);

  const runLookup = useCallback(
    async (raw: string) => {
      const value = extractCertificateQuery(raw);
      if (!value) {
        toast.error("Enter a certificate number, serial number or QR payload.");
        return;
      }

      setQuery(value);
      setLookup({ kind: "loading", query: value });

      const started = performance.now();
      const demoMatches = searchRegistry(state, value);
      const exact = demoMatches.find(
        (details) => details.certificate.number.toLowerCase() === value.toLowerCase(),
      );
      const demo = exact ?? demoMatches[0];

      if (demo) {
        const digest = await sha256Hex(
          canonicalCertificatePayload({
            number: demo.certificate.number,
            serial: demo.instrument?.serial ?? "UNKNOWN",
            issuedAt: demo.certificate.issuedAt,
          }),
        );
        const stored = demo.certificate.hash;
        const outcome: Outcome = {
          view: viewFromDemo(demo),
          digest,
          integrity: stored ? digest === stored : null,
          source: "demo",
          latencyMs: Math.round(performance.now() - started),
          matchNote:
            !exact && demoMatches.length > 1
              ? `${demoMatches.length} partial matches — showing the most recent.`
              : !exact
                ? `Matched on instrument or seal metadata.`
                : undefined,
        };
        setLookup({ kind: "found", outcome });
        recordVerification(demo.certificate.number, "Public verification desk");
        remember({
          number: demo.certificate.number,
          at: new Date().toISOString(),
          state: demo.state,
          source: "demo",
        });
        window.history.replaceState(
          null,
          "",
          `/verify?cert=${encodeURIComponent(demo.certificate.number)}`,
        );
        return;
      }

      const live = await verifyLiveCertificate(value);
      if (live.kind === "found") {
        const view = viewFromLive(live.record);
        const digest = await sha256Hex(
          canonicalCertificatePayload({
            number: view.number,
            serial: view.serial,
            issuedAt: view.issuedAt,
          }),
        );
        setLookup({
          kind: "found",
          outcome: {
            view,
            digest,
            integrity: view.hash ? digest === view.hash : null,
            source: "supabase",
            latencyMs: live.latencyMs,
          },
        });
        recordVerification(view.number, "Public verification desk · Supabase");
        remember({
          number: view.number,
          at: new Date().toISOString(),
          state: view.state,
          source: "supabase",
        });
        window.history.replaceState(
          null,
          "",
          `/verify?cert=${encodeURIComponent(view.number)}`,
        );
        return;
      }

      setLookup({
        kind: "missing",
        query: value,
        latencyMs: live.latencyMs,
        liveError: live.kind === "error" ? live.message : undefined,
      });
    },
    [remember, recordVerification, state],
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!initialCert) return;
    if (lastAuto.current === initialCert) return;
    lastAuto.current = initialCert;
    void runLookup(initialCert);
  }, [hydrated, initialCert, runLookup]);

  const outcome = lookup.kind === "found" ? lookup.outcome : null;
  const stateMeta = outcome ? CERTIFICATE_STATUS_META[outcome.view.state] : null;

  const verifyLink =
    typeof window !== "undefined" && outcome
      ? `${window.location.origin}/verify?cert=${encodeURIComponent(outcome.view.number)}`
      : "";

  async function handleDownload() {
    if (!outcome) return;
    setDownloading(true);
    try {
      await downloadCertificatePdf(outcome.view);
      toast.success("Certificate PDF generated", {
        description: `${outcome.view.number} · sealed ${shortHash(outcome.digest, 10, 6)}`,
      });
    } catch {
      toast.error("Could not generate the PDF in this browser.");
    } finally {
      setDownloading(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard access was blocked by the browser.");
    }
  }

  async function share() {
    if (!outcome) return;
    const url = verifyLink;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${outcome.view.number} — LegalMet Verify`,
          text: `${outcome.view.instrumentName} · ${stateMeta?.label}`,
          url,
        });
        return;
      } catch {
        // Fall through to clipboard when the share sheet is dismissed.
      }
    }
    await copy(url, "Verification link");
  }

  return (
    <div className="container pb-20 pt-28 lg:pt-32">
      <div className="print-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Public verification desk</p>
            <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Verify a <span className="italic text-gold">certificate.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every lookup resolves against the registry, recomputes the SHA-256 seal and
              reports the certificate&apos;s live legal status. No account required.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-soft px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-success">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              Registry online
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/#registry">
                Live ledger <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void runLookup(query);
          }}
          className="mt-8 max-w-3xl"
        >
          <div className="glass gold-border flex flex-col gap-2 rounded-2xl p-2 sm:flex-row">
            <div className="relative flex-1">
              {lookup.kind === "loading" ? (
                <Loader2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold" />
              ) : (
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="LMV-CERT-2026-0103 · serial · seal digest · QR URL"
                aria-label="Certificate number or seal"
                className="h-11 w-full rounded-xl border-0 bg-transparent pl-10 pr-3 font-mono text-[13px] uppercase tracking-wide text-foreground outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/60"
              />
            </div>
            <Button type="submit" className="h-11 shrink-0 px-5" disabled={lookup.kind === "loading"}>
              {lookup.kind === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Resolving
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Verify seal
                </>
              )}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Live
            </span>
            {LIVE_REGISTRY_PRESETS.map((preset) => (
              <PresetChip key={preset} value={preset} onPick={runLookup} />
            ))}
            <span className="ml-2 mr-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Demo
            </span>
            {DEMO_PRESETS.map((preset) => (
              <PresetChip
                key={preset.number}
                value={preset.number}
                label={preset.label}
                onPick={runLookup}
              />
            ))}
          </div>
        </form>

        {recent.length ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              <History className="h-3 w-3" /> Recent
            </span>
            {recent.map((item) => (
              <button
                key={`${item.number}-${item.at}`}
                type="button"
                onClick={() => void runLookup(item.number)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    CERTIFICATE_STATUS_META[item.state].dot,
                  )}
                />
                {item.number}
                <span className="text-muted-foreground/50">{formatRelative(item.at)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-10">
        {lookup.kind === "idle" ? <IdleState onPick={runLookup} /> : null}

        {lookup.kind === "loading" ? (
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="h-[560px] animate-pulse rounded-[1.6rem] border border-border bg-card/50" />
            <div className="space-y-3">
              <div className="h-40 animate-pulse rounded-2xl border border-border bg-card/50" />
              <div className="h-56 animate-pulse rounded-2xl border border-border bg-card/50" />
            </div>
          </div>
        ) : null}

        {lookup.kind === "missing" ? (
          <MissingState
            query={lookup.query}
            liveError={lookup.liveError}
            latencyMs={lookup.latencyMs}
            onPick={runLookup}
          />
        ) : null}

        {outcome && stateMeta ? (
          <div className="grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
            <div>
              <CertificateDocument
                view={outcome.view}
                digest={outcome.digest}
                integrity={outcome.integrity}
              />
              <p className="print-hidden mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <LockKeyhole className="h-3 w-3 text-gold" /> Seal recomputed client-side
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-gold" /> Source:{" "}
                  {outcome.source === "supabase" ? "Supabase RPC" : "Demo registry"}
                </span>
                <span>{outcome.latencyMs} ms</span>
                {outcome.matchNote ? <span>{outcome.matchNote}</span> : null}
              </p>
            </div>

            <aside className="print-hidden space-y-4">
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-5",
                  outcome.integrity === false
                    ? "border-danger/30 bg-danger-soft"
                    : outcome.view.state === "valid"
                      ? "border-success/30 bg-success-soft"
                      : outcome.view.state === "revoked"
                        ? "border-danger/30 bg-danger-soft"
                        : outcome.view.state === "expiring"
                          ? "border-warning/30 bg-warning-soft"
                          : "border-border bg-muted/60",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl border bg-background/50",
                      outcome.integrity === false || outcome.view.state === "revoked"
                        ? "border-danger/25 text-danger"
                        : outcome.view.state === "valid"
                          ? "border-success/25 text-success"
                          : outcome.view.state === "expiring"
                            ? "border-warning/25 text-warning"
                            : "border-border text-muted-foreground",
                    )}
                  >
                    {outcome.integrity === false || outcome.view.state === "revoked" ? (
                      <ShieldX className="h-5 w-5" />
                    ) : outcome.view.state === "valid" ? (
                      <BadgeCheck className="h-5 w-5" />
                    ) : (
                      <TriangleAlert className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                      Verification result
                    </p>
                    <p className="font-display text-2xl leading-tight tracking-tight">
                      {outcome.integrity === false
                        ? "Seal mismatch"
                        : outcome.view.state === "valid"
                          ? "Certificate valid"
                          : outcome.view.state === "expiring"
                            ? "Expiring soon"
                            : outcome.view.state === "revoked"
                              ? "Certificate revoked"
                              : "Certificate expired"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {outcome.integrity === false
                    ? "The recomputed digest does not match the registered seal. Do not rely on this document; report it to the Directorate."
                    : outcome.view.state === "revoked"
                      ? "This certificate has been withdrawn by an authorised officer and must not be relied upon."
                      : outcome.view.state === "expired"
                        ? "The validity window has lapsed. The instrument requires re-verification before trade use."
                        : outcome.view.state === "expiring"
                          ? "The certificate is within the renewal window. Schedule a fresh inspection before expiry."
                          : "The seal is intact and the certificate is within its validity window."}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  Registry facts
                </p>
                <dl className="mt-3 space-y-2.5 text-xs">
                  <Fact label="Certificate" mono value={outcome.view.number} />
                  <Fact label="Status" value={stateMeta.label} />
                  <Fact
                    label="Valid until"
                    value={`${formatDateTime(outcome.view.validUntil)} IST`}
                  />
                  <Fact label="Seal" mono value={shortHash(outcome.digest, 12, 8)} />
                  <Fact
                    label="Seal check"
                    value={
                      outcome.integrity === false
                        ? "Failed"
                        : outcome.integrity === true
                          ? "Passed"
                          : "Recomputed"
                    }
                  />
                  <Fact
                    label="Source"
                    value={
                      outcome.source === "supabase"
                        ? "Supabase verify_certificate"
                        : "Local Nexus registry"
                    }
                  />
                  <Fact label="Latency" value={`${outcome.latencyMs} ms`} />
                </dl>
                <button
                  type="button"
                  onClick={() => setShowProof((value) => !value)}
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-gold hover:underline"
                >
                  <Terminal className="h-3 w-3" />
                  {showProof ? "Hide" : "Show"} technical proof
                </button>
                {showProof ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-border bg-background/60 p-3">
                    <p className="break-all font-mono text-[9px] leading-relaxed text-muted-foreground">
                      <span className="text-gold">payload</span>{" "}
                      {canonicalCertificatePayload({
                        number: outcome.view.number,
                        serial: outcome.view.serial,
                        issuedAt: outcome.view.issuedAt,
                      })}
                    </p>
                    <p className="break-all font-mono text-[9px] leading-relaxed text-success">
                      sha256={outcome.digest}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleDownload} disabled={downloading} className="col-span-2">
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download sealed PDF
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button variant="outline" onClick={share}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Button variant="outline" onClick={() => void copy(verifyLink, "Verification link")}>
                  <ExternalLink className="h-4 w-4" /> Copy link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void copy(outcome.digest, "Seal digest")}
                >
                  <Copy className="h-4 w-4" /> Copy seal
                </Button>
                <Button asChild variant="ghost" className="col-span-2">
                  <Link href="/dashboard">
                    Open workspace <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {outcome.source === "supabase" ? (
                <div className="rounded-2xl border border-info/20 bg-info-soft p-4">
                  <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-info">
                    <Zap className="h-3 w-3" /> Live government record
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    Resolved in {outcome.latencyMs} ms from the connected Supabase project
                    through the public <code className="font-mono">verify_certificate</code>{" "}
                    RPC. Read-only, anonymous access.
                  </p>
                </div>
              ) : null}
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PresetChip({
  value,
  label,
  onPick,
}: {
  value: string;
  label?: string;
  onPick: (value: string) => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      onClick={() => void onPick(value)}
      className="rounded-full border border-border bg-card/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
      title={value}
    >
      {label ?? value.replace("LMV-CERT-2026-", "#").replace("CERT-2026-", "LIVE-")}
    </button>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "font-mono text-[11px]")}>{value}</dd>
    </div>
  );
}

function IdleState({ onPick }: { onPick: (value: string) => void | Promise<void> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/5 blur-3xl" />
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-gold" />
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            What a verification proves
          </p>
        </div>
        <h2 className="mt-4 font-display text-3xl tracking-tight">
          Three checks, one <span className="italic text-gold">answer.</span>
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Fingerprint,
              title: "Existence",
              body: "The certificate number resolves to a registered instrument and holder.",
            },
            {
              icon: LockKeyhole,
              title: "Integrity",
              body: "The SHA-256 seal is recomputed from the canonical payload and compared.",
            },
            {
              icon: Clock,
              title: "Validity",
              body: "Revocation flags and the validity window are evaluated at this instant.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-background/40 p-4">
              <item.icon className="h-4 w-4 text-gold" />
              <p className="mt-3 text-xs font-semibold">{item.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              Try a demo certificate
            </p>
            <Badge variant="gold">seeded registry</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.number}
                type="button"
                onClick={() => void onPick(preset.number)}
                className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-gold/40"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    CERTIFICATE_STATUS_META[preset.state].dot,
                  )}
                />
                <span>
                  <span className="block font-mono text-[10px] text-foreground">
                    {preset.number}
                  </span>
                  <span className="block text-[9px] text-muted-foreground">{preset.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          Try the revoked record to see how a withdrawn seal is surfaced.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Public API
          </p>
          <p className="mt-2 text-sm font-medium">Integrate verification anywhere</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            The same lookup that powers this desk is exposed as a read-only JSON endpoint.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-background/70 p-3">
            <pre className="font-mono text-[9px] leading-relaxed text-muted-foreground">
{`GET /api/verify?cert=
  LMV-CERT-2026-0482

→ { ok, records, latencyMs }`}
            </pre>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/api/health" target="_blank" rel="noreferrer">
                Health probe <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button asChild size="sm">
              <a
                href="/api/verify?cert=LMV-CERT-2026-0482"
                target="_blank"
                rel="noreferrer"
              >
                Sample JSON <ArrowRight className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Sealed demo records
          </p>
          <ul className="mt-2 divide-y divide-border">
            {DEMO_PRESETS.map((preset) => (
              <li key={preset.number}>
                <button
                  type="button"
                  onClick={() => void onPick(preset.number)}
                  className="flex w-full items-center justify-between gap-2 py-2.5 text-left text-[11px] transition-colors hover:text-gold"
                >
                  <span className="font-mono">{preset.number}</span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        CERTIFICATE_STATUS_META[preset.state].dot,
                      )}
                    />
                    {preset.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MissingState({
  query,
  liveError,
  latencyMs,
  onPick,
}: {
  query: string;
  liveError?: string;
  latencyMs: number;
  onPick: (value: string) => void | Promise<void>;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-warning/25 bg-warning-soft text-warning">
        <TriangleAlert className="h-6 w-6" />
      </span>
      <h2 className="mt-5 font-display text-3xl tracking-tight">
        {liveError ? "Registry unreachable" : "No matching certificate"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {liveError
          ? "The public registry could not be reached. This is not proof that the certificate is invalid — retry shortly or contact the issuing office."
          : `We could not resolve “${query}” in the Nexus registry or the live Supabase ledger. Check the number, or scan the QR printed on the certificate.`}
      </p>
      {liveError ? (
        <p className="mx-auto mt-3 max-w-md break-all rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 font-mono text-[10px] text-danger">
          {liveError}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <span className="font-mono uppercase tracking-[0.14em]">
          Checked in {latencyMs} ms
        </span>
        <span>·</span>
        <span>Demo registry + Supabase</span>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => void onPick("LMV-CERT-2026-0103")}>
          <RotateCcw className="h-4 w-4" /> Try a demo record
        </Button>
        <Button asChild variant="outline">
          <a href="/api/health" target="_blank" rel="noreferrer">
            Check registry health <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
        {LIVE_REGISTRY_PRESETS.map((preset) => (
          <PresetChip key={preset} value={preset} onPick={onPick} />
        ))}
      </div>
      <p className="mt-4 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-success" /> A missing record may simply belong
        to another jurisdiction.
      </p>
    </div>
  );
}
