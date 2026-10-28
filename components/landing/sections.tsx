import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  CircleDot,
  Cloud,
  Fingerprint,
  Globe2,
  Layers3,
  LockKeyhole,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_PERSONAS, INSTRUMENT_TYPES, MINISTRY, ORG, ROLE_LABEL } from "@/lib/constants";

export function TrustSection() {
  return (
    <section id="trust" className="relative py-20 lg:py-28">
      <div className="container">
        <div className="max-w-2xl">
          <p className="eyebrow">The trust layer</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            A certificate should be <span className="italic text-gold">provable.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            LegalMet Verify turns a paper certificate into a live, tamper-evident record.
            Every seal is recomputed from the instrument's identity, not trusted from a
            screenshot.
          </p>
        </div>

        <div className="mt-12 grid gap-3 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/5 blur-3xl" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                    <Fingerprint className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-2xl tracking-tight">
                    Tamper-evident by construction
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    A SHA-256 digest is computed over the certificate number, instrument
                    serial and issuance timestamp. Change one character and the seal
                    breaks.
                  </p>
                </div>
                <Badge variant="gold" className="hidden sm:inline-flex">
                  live integrity
                </Badge>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-border bg-background/70">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                    canonical payload
                  </span>
                  <span className="font-mono text-[9px] text-success">sha256</span>
                </div>
                <div className="space-y-1.5 p-4 font-mono text-[10px] leading-relaxed sm:text-[11px]">
                  <p className="text-muted-foreground">
                    <span className="text-gold">const</span> payload = [
                  </p>
                  <p className="pl-4 text-foreground/90">
                    "LMV-CERT-2026-0103",
                  </p>
                  <p className="pl-4 text-foreground/90">"BAL-7720-X",</p>
                  <p className="pl-4 text-foreground/90">"2026-07-29T10:00:00.000Z"</p>
                  <p className="text-muted-foreground">].join("|");</p>
                  <p className="pt-2 text-success">
                    9f2c8a7e…3d1b{" "}
                    <span className="text-muted-foreground">{"// seal intact"}</span>
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-gold/25">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-info/20 bg-info-soft text-info">
                <QrCode className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold">QR-first verification</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A citizen scans the seal on the instrument and lands on the exact
                certificate — no login, no app, no ambiguity.
              </p>
              <div className="mt-5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <ScanLine className="h-3.5 w-3.5 text-gold" />
                scan → resolve → verify
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-gold/25">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                <Workflow className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold">Role-aware workspaces</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Traders register instruments. Officers inspect and issue. Administrators
                see the national picture.
              </p>
              <div className="mt-5 flex flex-wrap gap-1">
                {["Owner", "Officer", "Admin"].map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-border bg-muted/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.14} className="lg:col-span-2">
            <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[size:48px_48px] opacity-[0.14]" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-md">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-success/20 bg-success-soft text-success">
                    <LockKeyhole className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-2xl tracking-tight">
                    Supabase + row-level security
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Public verification is read-only. Owners see only their instruments.
                    Officers act within their jurisdiction. Every action lands in an
                    immutable audit trail.
                  </p>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2">
                  {[
                    { icon: Cloud, label: "Postgres" },
                    { icon: ShieldCheck, label: "RLS" },
                    { icon: Layers3, label: "RPC" },
                    { icon: Globe2, label: "Public API" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-[10px] text-muted-foreground"
                    >
                      <Icon className="h-3.5 w-3.5 text-gold" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card/40 py-3">
            <div className="flex w-max animate-marquee gap-6 whitespace-nowrap">
              {[...INSTRUMENT_TYPES, ...INSTRUMENT_TYPES].map((type, index) => (
                <span
                  key={`${type}-${index}`}
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                >
                  <CircleDot className="h-3 w-3 text-gold/60" />
                  {type}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: Building2,
    title: "Register",
    body: "A trader files Form LMV-01 with the instrument's make, model, serial and location.",
  },
  {
    icon: ScanLine,
    title: "Inspect",
    body: "A Legal Metrology Officer reviews the queue, schedules a field visit and records the result.",
  },
  {
    icon: BadgeCheck,
    title: "Seal",
    body: "Approval issues a certificate and a SHA-256 seal bound to the instrument's identity.",
  },
  {
    icon: Globe2,
    title: "Verify",
    body: "Anyone scans the QR or enters the certificate number to see the live, signed record.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative border-y border-border/70 bg-card/25 py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              From instrument to <span className="italic text-gold">proof.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Four accountable steps, one continuous chain of custody. Every transition is
            timestamped and attributed.
          </p>
        </div>

        <Stagger className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <StaggerItem key={step.title}>
              <div className="group relative h-full rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-gold/30">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground/50">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
                {index < STEPS.length - 1 ? (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-border lg:block" />
                ) : null}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

const ROLE_ICONS = {
  owner: Building2,
  officer: ShieldCheck,
  admin: BarChart3,
} as const;

const ROLE_TONE = {
  owner: "text-gold bg-gold/5 border-gold/20",
  officer: "text-info bg-info-soft border-info/20",
  admin: "text-success bg-success-soft border-success/20",
} as const;

export function PersonaSection() {
  return (
    <section id="roles" className="py-20 lg:py-28">
      <div className="container">
        <div className="max-w-2xl">
          <p className="eyebrow">Workspaces</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            One registry. <span className="italic text-gold">Three vantage points.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Enter a fully interactive demo workspace as any persona. No password, no
            email — every action is persisted locally and can be reset at any time.
          </p>
        </div>

        <Stagger className="mt-12 grid gap-3 lg:grid-cols-3">
          {DEMO_PERSONAS.map((persona) => {
            const Icon = ROLE_ICONS[persona.role];
            return (
              <StaggerItem key={persona.role}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-gold/30 hover:shadow-glow">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border ${ROLE_TONE[persona.role]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      demo persona
                    </Badge>
                  </div>
                  <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    {ROLE_LABEL[persona.role]}
                  </p>
                  <h3 className="mt-1 font-display text-2xl tracking-tight">
                    {persona.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{persona.organization}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {persona.description}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {persona.capabilities.map((capability) => (
                      <li
                        key={capability}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <Check className="h-3.5 w-3.5 text-success" />
                        {capability}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-6 w-full group-hover:border-gold/40">
                    <Link
                      href={`/login?persona=${persona.role}&next=/dashboard`}
                    >
                      Enter {ROLE_LABEL[persona.role].split(" ")[0].toLowerCase()} workspace
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

export function ArchitectureSection() {
  return (
    <section className="border-t border-border/70 bg-card/25 py-20 lg:py-24">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Production stack</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Built like <span className="italic text-gold">public infrastructure.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
              A modern, typed, observable stack — chosen for correctness and longevity,
              not novelty. The public verification path is read-only and resilient; the
              workspace layer is strict and auditable.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Next.js 16",
                "React 19",
                "TypeScript",
                "Supabase",
                "Postgres RLS",
                "Tailwind CSS",
                "Recharts",
                "Web Crypto",
                "Motion",
              ].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/verify">
                  Open verification desk
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Explore workspaces</Link>
              </Button>
            </div>
          </div>

          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-border bg-background/80 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger/70" />
                  <span className="h-2 w-2 rounded-full bg-warning/70" />
                  <span className="h-2 w-2 rounded-full bg-success/70" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  registry.verify
                </span>
                <span className="font-mono text-[9px] text-success">200 OK</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">
{`{
  "certificate": "LMV-CERT-2026-0103",
  "status": "VALID",
  "instrument": {
    "name": "Class I Gold Micro Balance",
    "serial": "BAL-7720-X"
  },
  "seal": {
    "algorithm": "SHA-256",
    "digest": "9f2c8a7e…3d1b",
    "verified": true
  },
  "source": "supabase:verify_certificate",
  "latency_ms": 124
}`}
              </pre>
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-success">
                  <CircleDot className="h-3 w-3" /> seal recomputed client-side
                </span>
                <Sparkles className="h-3.5 w-3.5 text-gold" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-radial blur-2xl" />
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Public accountability</p>
          <h2 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            Verify before <span className="italic text-gold">you trust.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A fair market starts with a trusted measure. Check a certificate, inspect the
            seal, or bring your own instruments into the national registry.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/verify">
                <ShieldCheck className="h-4 w-4" />
                Verify a certificate
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login?persona=owner&next=/dashboard">
                Register an instrument
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {ORG} · {MINISTRY}
          </p>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/40">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/25 bg-gold/5 text-gold">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-lg leading-none">
                  LegalMet <span className="text-gold">Verify</span>
                </p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
                  Nexus edition
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              A national instrument-trust infrastructure for verification, compliance and
              public accountability.
            </p>
            <Badge variant="success" dot className="mt-4">
              supabase connected
            </Badge>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Platform
            </p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li><Link className="hover:text-foreground" href="/verify">Public verification</Link></li>
              <li><Link className="hover:text-foreground" href="/login">Workspace sign in</Link></li>
              <li><Link className="hover:text-foreground" href="/#registry">Live registry</Link></li>
              <li><Link className="hover:text-foreground" href="/#how">How it works</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Workspaces
            </p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li><Link className="hover:text-foreground" href="/login?persona=owner&next=/dashboard">Traders & owners</Link></li>
              <li><Link className="hover:text-foreground" href="/login?persona=officer&next=/dashboard">Metrology officers</Link></li>
              <li><Link className="hover:text-foreground" href="/login?persona=admin&next=/dashboard">Administrators</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Governance
            </p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>{ORG}</li>
              <li>{MINISTRY}</li>
              <li>Legal Metrology Act, 2009</li>
              <li className="font-mono text-[10px] text-gold">Section 24</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-border pt-5 text-[10px] text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} LegalMet Verify Nexus. Demonstration build.</p>
          <p className="font-mono uppercase tracking-[0.14em]">
            Built with Next.js · Supabase · Web Crypto
          </p>
        </div>
      </div>
    </footer>
  );
}
