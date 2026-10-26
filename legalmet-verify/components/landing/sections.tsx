import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/primitives";

function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
      <span className="text-cobalt">{index}</span>
      <span className="h-px w-8 bg-border" />
      {children}
    </p>
  );
}

const steps = [
  {
    icon: Gauge,
    title: "Register an Instrument",
    body: "Add scales, weighbridges, dispensers and meters with serial numbers, capacity and accuracy class.",
  },
  {
    icon: CalendarClock,
    title: "Schedule Verification",
    body: "Submit a verification or renewal application. An authorized official reviews it and schedules an inspection.",
  },
  {
    icon: FileCheck2,
    title: "Access Your Certificate",
    body: "Once the instrument passes, a digital certificate with a public QR code is issued instantly.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <SectionLabel index="01">How it works</SectionLabel>
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em] md:text-[40px] md:leading-[1.1]">
            Three steps from instrument to certificate.
          </h2>
        </Reveal>

        <Stagger inView step={0.12} as="ol" className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
          {steps.map((step, i) => (
            <StaggerItem as="li" key={step.title} className="relative flex flex-col gap-4 md:pr-10">
              <div className="flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-lg border bg-card">
                  <step.icon className="size-[18px] text-foreground" strokeWidth={1.6} />
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {"STEP "}
                  {String(i + 1).padStart(2, "0")}
                </span>
                {i < steps.length - 1 && (
                  <span aria-hidden className="hidden h-px flex-1 ruler-x opacity-60 md:block" />
                )}
              </div>
              <h3 className="text-lg font-medium tracking-tight">{step.title}</h3>
              <p className="text-pretty leading-relaxed text-muted-foreground">{step.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export function CertificatesSection() {
  return (
    <section className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-2">
        <Reveal className="flex flex-col gap-5">
          <SectionLabel index="02">Digital certificates</SectionLabel>
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em] md:text-[40px] md:leading-[1.1]">
            Tamper-evident certificates anyone can check in seconds.
          </h2>
          <p className="max-w-lg text-pretty leading-relaxed text-muted-foreground">
            Each certificate carries a unique number and QR code. Customers, inspectors and businesses can
            confirm validity publicly — without ever seeing the owner&apos;s private information.
          </p>
          <ul className="mt-2 flex flex-col gap-3 text-sm">
            {[
              [QrCode, "Scan the QR code or enter the certificate number"],
              [ShieldCheck, "Only public-safe details are disclosed"],
              [BadgeCheck, "Clear valid, expired and revoked states"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof QrCode;
              return (
                <li key={text as string} className="flex items-center gap-3">
                  <I className="size-4 text-cobalt" strokeWidth={1.75} />
                  {text as string}
                </li>
              );
            })}
          </ul>
          <Link
            href="/verify"
            className="group mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-foreground"
          >
            <span className="border-b border-foreground/30 pb-0.5 transition-colors group-hover:border-foreground">
              Verify a certificate
            </span>
            <ArrowUpRight className="size-4 transition-transform duration-300 ease-precise group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <CertificateMock />
        </Reveal>
      </div>
    </section>
  );
}

function CertificateMock() {
  return (
    <figure
      aria-label="Example certificate layout"
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border bg-background p-6 shadow-[0_24px_48px_-24px_hsl(221_43%_11%/0.25)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Certificate of verification
          </span>
          <span className="font-mono text-sm font-medium">LMC-XXXX-XXXXXXXXXX</span>
        </div>
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-success/10 px-2.5 text-xs font-medium text-success">
          <span className="size-1.5 rounded-full bg-success" /> Valid
        </span>
      </div>
      <div className="my-6 h-px ruler-x opacity-50" />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        {[
          ["Instrument", "Platform scale"],
          ["Accuracy class", "III"],
          ["Issued", "On approval"],
          ["Valid until", "12 months"],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex items-end justify-between">
        <div aria-hidden className="grid size-16 grid-cols-6 gap-[2px] rounded-md border bg-card p-1.5">
          {Array.from({ length: 36 }, (_, i) => (
            <span
              key={i}
              className={(i * 7 + (i % 5)) % 3 === 0 || i % 7 === 0 ? "bg-foreground" : "bg-transparent"}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">Illustrative layout</span>
      </div>
    </figure>
  );
}

const ownerFeatures = [
  [Gauge, "Instrument registry", "Keep every device, serial and location in one place."],
  [ClipboardCheck, "Application tracking", "Follow each request from submission to decision."],
  [Bell, "Expiry notifications", "Know when certificates need renewal."],
] as const;

const officialFeatures = [
  [CalendarClock, "Inspection scheduling", "Plan field visits for assigned applications."],
  [FileCheck2, "Findings & decisions", "Record results that issue certificates automatically."],
  [Users, "Role administration", "Administrators manage officials and access."],
] as const;

export function RolesSection() {
  return (
    <section id="services" className="scroll-mt-20 border-t">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <SectionLabel index="03">Services</SectionLabel>
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em] md:text-[40px] md:leading-[1.1]">
            Built for owners and the officials who verify them.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-2">
          {[
            { title: "For instrument owners", items: ownerFeatures },
            { title: "For authorized officials", items: officialFeatures },
          ].map((group, gi) => (
            <Reveal key={group.title} delay={gi * 0.08} className="flex flex-col gap-8 bg-background p-7 md:p-10">
              <h3 className="text-sm font-medium text-muted-foreground">{group.title}</h3>
              <ul className="flex flex-col gap-7">
                {group.items.map(([Icon, title, body]) => (
                  <li key={title} className="group flex gap-4">
                    <Icon
                      className="mt-0.5 size-5 shrink-0 text-foreground/70 transition-colors duration-300 group-hover:text-cobalt"
                      strokeWidth={1.6}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{title}</span>
                      <span className="text-sm leading-relaxed text-muted-foreground">{body}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 md:flex-row md:justify-between md:px-8">
        <div className="flex max-w-xs flex-col gap-3">
          <span className="text-[15px] font-semibold tracking-tight">
            LegalMet <span className="font-normal text-muted-foreground">Verify</span>
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A student innovation project for SIH26036 — Development of an Online Verification System for
            Weighing and Measuring Instruments.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-14 gap-y-3 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Platform</span>
            <Link className="text-foreground/80 hover:text-foreground" href="/#how-it-works">How it works</Link>
            <Link className="text-foreground/80 hover:text-foreground" href="/#services">Services</Link>
            <Link className="text-foreground/80 hover:text-foreground" href="/verify">Verify certificate</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account</span>
            <Link className="text-foreground/80 hover:text-foreground" href="/auth/login">Sign in</Link>
            <Link className="text-foreground/80 hover:text-foreground" href="/auth/sign-up">Create account</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Legal</span>
            <span className="text-foreground/60">Legal Metrology Act, 2009</span>
            <span className="text-foreground/60">Prototype — not an official portal</span>
          </div>
        </nav>
      </div>
    </footer>
  );
}
