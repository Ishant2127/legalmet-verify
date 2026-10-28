"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Fingerprint,
  LockKeyhole,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimatedNumber, Reveal } from "@/components/motion/primitives";
import { Button } from "@/components/ui/button";
import { useRegistry } from "@/lib/registry/store";
import { computeMetrics, enrichCertificate } from "@/lib/registry/derive";
import { canonicalCertificatePayload, sha256Hex, shortHash } from "@/lib/crypto";
import { formatDate } from "@/lib/utils";

const PRESETS = ["LMV-CERT-2026-0101", "LMV-CERT-2026-0482", "CERT-2026-001"];

export function Hero() {
  const router = useRouter();
  const { state } = useRegistry();
  const [cert, setCert] = useState("");
  const [origin, setOrigin] = useState("");
  const [seal, setSeal] = useState("");

  const metrics = useMemo(() => computeMetrics(state), [state]);
  const featured = useMemo(() => {
    const certificate = state.certificates.find(
      (item) => item.number === "LMV-CERT-2026-0103",
    );
    return certificate ? enrichCertificate(state, certificate) : null;
  }, [state]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!featured?.instrument) return;
    let active = true;
    sha256Hex(
      canonicalCertificatePayload({
        number: featured.certificate.number,
        serial: featured.instrument.serial,
        issuedAt: featured.certificate.issuedAt,
      }),
    ).then((hash) => {
      if (active) setSeal(hash);
    });
    return () => {
      active = false;
    };
  }, [featured]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = cert.trim();
    if (!value) return;
    router.push(`/verify?cert=${encodeURIComponent(value)}`);
  }

  const qrValue = `${origin || "https://legalmet.verify"}/verify?cert=${featured?.certificate.number ?? "LMV-CERT-2026-0103"}`;

  return (
    <section className="relative overflow-hidden pb-16 pt-32 lg:pb-24 lg:pt-40">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-70" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gold-radial blur-2xl" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-info/5 blur-3xl" />

      <div className="container relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-16">
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/5 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                  National Instrument Trust Infrastructure
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <h1 className="mt-6 max-w-[11ch] font-display text-[clamp(3.4rem,8.5vw,6.8rem)] leading-[0.88] tracking-[-0.03em] text-balance">
                Trust, <span className="gold-text italic">measured.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Every commercial weight, measure and meter in India — sealed, verifiable
                and publicly accountable. One national layer for traders, inspectors and
                citizens.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <form onSubmit={submit} className="mt-8 max-w-xl">
                <div className="glass gold-border flex flex-col gap-2 rounded-2xl p-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={cert}
                      onChange={(event) => setCert(event.target.value)}
                      placeholder="Certificate no., serial no. or QR payload"
                      aria-label="Certificate number"
                      className="h-11 w-full rounded-xl border-0 bg-transparent pl-10 pr-3 font-mono text-[13px] uppercase tracking-wide text-foreground outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <Button type="submit" className="h-11 shrink-0 px-5">
                    Verify seal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                    Try a live record
                  </span>
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => router.push(`/verify?cert=${encodeURIComponent(preset)}`)}
                      className="rounded-full border border-border bg-card/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </form>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5 text-gold" /> SHA-256 digital seals
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LockKeyhole className="h-3.5 w-3.5 text-gold" /> Supabase-backed registry
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Section 24 compliant
                </span>
              </div>
            </Reveal>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, rotate: 1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative mx-auto w-full max-w-[470px]"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-gold/10 blur-3xl" />
            <div className="absolute -right-5 top-10 z-20 hidden animate-float rounded-xl border border-border bg-card px-3 py-2 shadow-xl sm:block">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-soft text-success">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold">Seal intact</p>
                  <p className="font-mono text-[9px] text-muted-foreground">SHA-256 verified</p>
                </div>
              </div>
            </div>
            <div className="absolute -left-6 bottom-16 z-20 hidden animate-float rounded-xl border border-border bg-card px-3 py-2 shadow-xl [animation-delay:1.2s] sm:block">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Public lookup
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-gold">124 ms response</p>
            </div>

            <div className="certificate-paper noise relative overflow-hidden rounded-[1.6rem] p-5 sm:p-6">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
              <div className="pointer-events-none absolute inset-0 animate-scan bg-gradient-to-b from-transparent via-gold/[0.06] to-transparent" />

              <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
                    Government of India
                  </p>
                  <p className="mt-1 font-display text-xl leading-none tracking-tight">
                    Certificate of Verification
                  </p>
                  <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-gold">
                    Directorate of Legal Metrology
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/25 bg-success-soft px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Valid
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4 py-5">
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                    Registered instrument
                  </p>
                  <p className="mt-1 text-[15px] font-semibold leading-snug">
                    {featured?.instrument?.name ?? "Class I Gold Micro Balance"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {featured?.instrument?.manufacturer ?? "Sartorius AG"} ·{" "}
                    {featured?.instrument?.model ?? "Secura 224-1S"}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                        Certificate
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-gold">
                        {featured?.certificate.number ?? "LMV-CERT-2026-0103"}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                        Serial
                      </p>
                      <p className="mt-0.5 font-mono text-[11px]">
                        {featured?.instrument?.serial ?? "BAL-7720-X"}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                        Valid until
                      </p>
                      <p className="mt-0.5 text-[11px]">
                        {featured ? formatDate(featured.certificate.validUntil) : "18 Aug 2027"}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                        Holder
                      </p>
                      <p className="mt-0.5 truncate text-[11px]">
                        {featured?.owner?.organization ?? "Golden Bazaar Jewellers"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-xl border border-border bg-background p-2">
                    <QRCodeSVG
                      value={qrValue}
                      size={86}
                      bgColor="transparent"
                      fgColor="currentColor"
                      level="M"
                      className="text-foreground"
                    />
                  </div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                    Scan to verify
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-background/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                    Cryptographic seal
                  </p>
                  <span className="font-mono text-[8px] text-success">INTACT</span>
                </div>
                <p className="mt-1 break-all font-mono text-[9px] leading-relaxed text-gold/90">
                  {seal ? shortHash(seal, 26, 18) : "computing seal…"}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[9px] font-medium">Digitally signed</p>
                    <p className="font-mono text-[8px] text-muted-foreground">
                      Central Metrology Root Authority
                    </p>
                  </div>
                </div>
                <ScanLine className="h-4 w-4 text-muted-foreground/60" />
              </div>
            </div>

            <div className="absolute inset-x-8 -bottom-3 h-6 rounded-full bg-background/80 blur-xl" />
          </motion.div>
        </div>

        <Reveal delay={0.25}>
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border/60 sm:grid-cols-4">
            {[
              { label: "Sealed certificates", value: metrics.totalCertificates },
              { label: "Instruments on file", value: metrics.totalInstruments },
              { label: "Districts covered", value: metrics.districtsCovered },
              {
                label: "Compliance rate",
                value: Math.round(metrics.complianceRate),
                suffix: "%",
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-card/80 px-5 py-4 backdrop-blur-sm">
                <p className="font-display text-3xl tracking-tight">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <p>
              Live Supabase registry connected ·{" "}
              <Link href="/verify?cert=CERT-2026-001" className="text-gold hover:underline">
                verify a live government record
              </Link>
            </p>
            <Link
              href="/#registry"
              className="inline-flex items-center gap-1 text-gold hover:underline"
            >
              Inspect registry health <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
