"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  Building2,
  Check,
  ClipboardCheck,
  Copy,
  Database,
  Download,
  Fingerprint,
  KeyRound,
  Laptop,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  RotateCcw,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/page-header";
import { PortalPageSkeleton } from "@/components/portal/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator, Progress } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DEMO_PERSONAS, ROLE_LABEL, ROLE_SHORT } from "@/lib/constants";
import { shortHash } from "@/lib/crypto";
import { useRegistry } from "@/lib/registry/store";
import { cn, formatDateTime, formatRelative, initials } from "@/lib/utils";

const PREFS_KEY = "lmv-nexus-preferences-v1";
const SESSION_TTL = 7 * 86_400_000;

type Preferences = {
  renewalAlerts: boolean;
  queueDigest: boolean;
  sealWarnings: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  renewalAlerts: true,
  queueDigest: true,
  sealWarnings: false,
};

const ENDPOINTS = [
  { path: "/api/health", label: "Infrastructure health" },
  { path: "/api/verify?cert=LMV-CERT-2026-0482", label: "Live certificate lookup" },
  { path: "/api/demo-login?persona=officer", label: "Signed demo session" },
  { path: "/api/demo-logout", label: "End session" },
];

export default function SettingsPage() {
  const { state, session, hydrated, exportRegistry, resetRegistry } = useRegistry();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [device, setDevice] = useState("—");
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setMounted(true);
    setNowMs(Date.now());
    setDevice(describeDevice());
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Preferences>;
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch {
      // Preferences are cosmetic; ignore corrupt storage.
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage failures.
    }
  }, [preferences, mounted]);

  const counts = useMemo(
    () => ({
      instruments: state.instruments.length,
      applications: state.applications.length,
      certificates: state.certificates.length,
      audit: state.audit.length,
      active: state.instruments.filter((item) => item.status === "active").length,
      valid: state.certificates.filter((item) => !item.revokedAt).length,
    }),
    [state],
  );

  if (!hydrated || !session) return <PortalPageSkeleton />;

  const expiresAt = session.issuedAt + SESSION_TTL;
  const elapsed = Math.min(
    100,
    Math.max(0, (((nowMs ?? session.issuedAt) - session.issuedAt) / SESSION_TTL) * 100),
  );
  const isDark = resolvedTheme !== "light";

  async function signOut() {
    await fetch("/api/demo-logout", { method: "POST" });
    window.location.href = "/";
  }

  async function switchPersona(role: "owner" | "officer" | "admin") {
    await fetch("/api/demo-logout", { method: "POST" });
    window.location.href = `/login?persona=${role}&next=/dashboard`;
  }

  function copy(value: string, label: string) {
    void navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  function togglePreference(key: keyof Preferences) {
    setPreferences((previous) => ({ ...previous, [key]: !previous[key] }));
  }

  function handleReset() {
    resetRegistry();
    setConfirmOpen(false);
    toast.success("Registry restored to the seed snapshot", {
      description: "All locally created records and revocations were cleared.",
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Your workspace"
        title={
          <>
            Account & <span className="italic text-gold">preferences.</span>
          </>
        }
        description="Manage the signed session, workspace identity, display preferences and the local registry snapshot."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportRegistry}>
              <Download className="h-3.5 w-3.5" /> Export snapshot
            </Button>
            <Button size="sm" onClick={() => setConfirmOpen(true)}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset demo data
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold-radial blur-3xl" />
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 font-display text-xl text-gold">
                {initials(session.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="gold">{ROLE_LABEL[session.role]}</Badge>
                  <Badge variant="success" dot>
                    Session active
                  </Badge>
                </div>
                <h2 className="mt-2 font-display text-2xl tracking-tight">{session.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{session.organization}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(session.email, "Email")}>
                    <Mail className="h-3.5 w-3.5" /> {session.email}
                  </Button>
                  {session.badgeId ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copy(session.badgeId ?? "", "Badge ID")}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> {session.badgeId}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail icon={Building2} label="Organisation" value={session.organization} />
              <Detail icon={MapPin} label="Jurisdiction" value={`${session.district} · India`} />
              <Detail icon={KeyRound} label="Session type" value="HMAC-signed demo cookie" />
              <Detail
                icon={Fingerprint}
                label="Session fingerprint"
                value={shortHash(`${session.email}:${session.issuedAt}`, 10, 8)}
                mono
              />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background/50 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                  Session lifetime
                </p>
                <p className="font-mono text-[9px] text-muted-foreground">
                  {formatRelative(expiresAt)} · 7 day TTL
                </p>
              </div>
              <Progress value={elapsed} className="mt-2.5 h-1" />
              <p className="mt-2 text-[9px] text-muted-foreground">
                Issued {formatDateTime(session.issuedAt)} IST. Re-authentication rotates the
                signing payload.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void switchPersona(session.role === "owner" ? "officer" : "owner")}>
                <Sparkles className="h-3.5 w-3.5" /> Switch persona
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/verify">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verification desk
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-danger hover:bg-danger-soft hover:text-danger"
                onClick={() => void signOut()}
              >
                <LogOut className="h-3.5 w-3.5" /> End session
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Appearance</CardTitle>
              <CardDescription className="text-[11px]">
                Applied instantly across the workspace and public desk.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "dark", label: "Obsidian", icon: Moon },
                  { key: "light", label: "Ivory", icon: Sun },
                ].map((option) => {
                  const active = mounted
                    ? option.key === "dark"
                      ? isDark
                      : !isDark
                    : option.key === "dark";
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setTheme(option.key)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors",
                        active
                          ? "border-gold/40 bg-gold/5 text-foreground"
                          : "border-border bg-background/40 text-muted-foreground hover:border-gold/25",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg border",
                          active
                            ? "border-gold/30 bg-gold/10 text-gold"
                            : "border-border bg-muted/40",
                        )}
                      >
                        <option.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-medium">{option.label}</span>
                        <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                          {option.key} theme
                        </span>
                      </span>
                      {active ? <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-gold" /> : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[11px]">Colour-scheme lock</p>
                    <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                      dark-first, no OS override
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Enabled</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Notifications</CardTitle>
              <CardDescription className="text-[11px]">
                Local preferences for this browser profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0.5 pt-0">
              <PreferenceRow
                icon={BellRing}
                label="Renewal alerts"
                hint="Surface certificates inside the 45-day window"
                checked={preferences.renewalAlerts}
                onChange={() => togglePreference("renewalAlerts")}
              />
              <PreferenceRow
                icon={ClipboardCheck}
                label="Queue digest"
                hint="Highlight newly submitted applications"
                checked={preferences.queueDigest}
                onChange={() => togglePreference("queueDigest")}
              />
              <PreferenceRow
                icon={AlertTriangle}
                label="Seal mismatch warnings"
                hint="Escalate any recomputed digest divergence"
                checked={preferences.sealWarnings}
                onChange={() => togglePreference("sealWarnings")}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
            <div>
              <CardTitle>Registry snapshot</CardTitle>
              <CardDescription className="mt-1 text-[11px]">
                Demo records persist in this browser only. Live certificates are read from
                Supabase.
              </CardDescription>
            </div>
            <Badge variant="info" dot>
              Local
            </Badge>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Instruments", value: counts.instruments, icon: Scale },
                { label: "Applications", value: counts.applications, icon: ClipboardCheck },
                { label: "Certificates", value: counts.certificates, icon: BadgeCheck },
                { label: "Audit events", value: counts.audit, icon: ScrollText },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-background/40 p-3">
                  <stat.icon className="h-3.5 w-3.5 text-gold" />
                  <p className="mt-2 font-display text-xl leading-none">{stat.value}</p>
                  <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/40 px-3 py-2.5">
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                Snapshot {formatRelative(state.lastUpdated)} · {counts.active} active ·{" "}
                {counts.valid} unrevoked
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportRegistry}>
                  <Download className="h-3.5 w-3.5" /> JSON
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmOpen(true)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>This device</CardTitle>
            <CardDescription className="text-[11px]">
              Runtime signals available to the client.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background/40 p-3">
              <Laptop className="h-4 w-4 shrink-0 text-gold" />
              <div className="min-w-0">
                <p className="truncate text-[11px]">{device}</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                  {mounted ? `${window.innerWidth} × ${window.innerHeight} viewport` : "detecting"}
                </p>
              </div>
            </div>
            <Detail icon={Users} label="Workspace role" value={ROLE_SHORT[session.role]} />
            <Detail icon={UserCog} label="Authentication" value="Demo persona · local signature" />
            <Detail icon={Database} label="Persistence" value="localStorage · lmv-nexus-registry-v2" />
            <Detail icon={KeyRound} label="Preferences" value="localStorage · browser profile" />
            <div className="rounded-xl border border-info/20 bg-info-soft/60 p-3">
              <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-info">
                <Fingerprint className="h-2.5 w-2.5" /> Privacy
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                No demo record leaves this browser. Public verification sends only the
                certificate number to the Supabase RPC.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Persona directory</CardTitle>
            <CardDescription className="text-[11px]">
              One-click role handoff for reviewing the full lifecycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {DEMO_PERSONAS.map((persona) => {
              const current = persona.role === session.role;
              return (
                <div
                  key={persona.role}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2.5",
                    current
                      ? "border-gold/30 bg-gold/5"
                      : "border-border bg-background/40",
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-[9px] font-semibold text-gold">
                    {initials(persona.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium">{persona.name}</p>
                    <p className="truncate font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                      {persona.role} · {persona.district}
                    </p>
                  </div>
                  {current ? (
                    <Badge variant="gold">You</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void switchPersona(persona.role)}
                    >
                      Switch
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>API surface</CardTitle>
            <CardDescription className="text-[11px]">
              Route handlers used by the workspace and public desk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {ENDPOINTS.map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2.5"
              >
                <code className="min-w-0 flex-1 truncate font-mono text-[9px]">
                  {endpoint.path}
                </code>
                <span className="hidden font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground sm:block">
                  {endpoint.label}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Copy ${endpoint.label}`}
                  onClick={() => copy(endpoint.path, "Endpoint")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2.5">
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                Registry root {shortHash(state.lastUpdated, 6, 6)}
              </p>
              {session.role === "admin" ? (
                <Link
                  href="/integrations"
                  className="inline-flex items-center gap-1 text-[10px] text-gold hover:underline"
                >
                  Integrations <ArrowUpRight className="h-2.5 w-2.5" />
                </Link>
              ) : (
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-1 text-[10px] text-gold hover:underline"
                >
                  Verify desk <ArrowUpRight className="h-2.5 w-2.5" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-danger/25 bg-danger-soft text-danger">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <DialogTitle className="mt-2">Reset the demo registry?</DialogTitle>
            <DialogDescription>
              This clears every locally created instrument, application, certificate,
              revocation and audit event, then restores the original seed snapshot. Live
              Supabase records are unaffected.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-background/50 p-3 text-[10px] leading-relaxed text-muted-foreground">
            <p className="font-mono text-[8px] uppercase tracking-[0.12em]">
              Will be removed
            </p>
            <p className="mt-1">
              {counts.instruments} instruments · {counts.applications} applications ·{" "}
              {counts.certificates} certificates · {counts.audit} audit events
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Keep my data
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset registry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-background/40 p-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className={cn("mt-0.5 break-words text-[11px]", mono && "font-mono text-[10px]")}>
          {value}
        </p>
      </div>
    </div>
  );
}

function PreferenceRow({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/30">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
        <Icon className="h-3 w-3" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px]">{label}</p>
        <p className="text-[9px] leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function describeDevice() {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua) && !/Chromium/.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua) && !/Chrome/.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Browser";
  const os = /Mac OS X/.test(ua)
    ? "macOS"
    : /Windows/.test(ua)
      ? "Windows"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : "Desktop";
  return `${browser} on ${os}`;
}
