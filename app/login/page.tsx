import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Database, Fingerprint, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Wordmark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, MINISTRY, ORG } from "@/lib/constants";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/demo-session";
import type { Role } from "@/lib/types";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Enter the LegalMet Verify Nexus workspaces as a trader, metrology officer or administrator.",
};

const ROLES: Role[] = ["owner", "officer", "admin"];

function safeNext(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ persona?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawPersona = Array.isArray(params.persona) ? params.persona[0] : params.persona;
  const persona = ROLES.includes(rawPersona as Role) ? (rawPersona as Role) : undefined;
  const next = safeNext(params.next);

  const cookieStore = await cookies();
  const session = await verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  // Allow `/login?persona=...` to replace an existing session (persona switching).
  if (session && !persona) redirect(next);

  return (
    <div className="relative grid min-h-svh lg:grid-cols-[1.02fr_0.98fr]">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-40 lg:hidden" />

      <aside className="relative hidden overflow-hidden border-r border-border bg-card/30 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
        <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-gold-radial blur-3xl" />

        <div className="relative flex items-center justify-between">
          <Wordmark />
          <Badge variant="success" dot>
            registry live
          </Badge>
        </div>

        <div className="relative max-w-lg py-12">
          <p className="eyebrow">National instrument trust</p>
          <h2 className="mt-4 font-display text-[clamp(2.8rem,4.4vw,4.4rem)] leading-[0.92] tracking-[-0.03em]">
            A fair market starts with a{" "}
            <span className="gold-text italic">trusted measure.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            One accountable layer for every commercial weight, measure and meter — from
            the trader&apos;s counter to the national ledger.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background/60 backdrop-blur">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                trust chain
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> verified
              </span>
            </div>
            <div className="space-y-3 p-4">
              {[
                {
                  icon: Fingerprint,
                  title: "Deterministic seal",
                  body: "SHA-256 over certificate, serial and issuance time.",
                },
                {
                  icon: Database,
                  title: "Supabase ledger",
                  body: "Postgres RLS with a read-only public verification RPC.",
                },
                {
                  icon: Globe2,
                  title: "Open verification",
                  body: "QR-first public access with no account required.",
                },
              ].map((item, index) => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/5 text-gold">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground/50">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { value: "3", label: "workspaces" },
              { value: "12", label: "instruments" },
              { value: "5", label: "districts" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card/50 px-3 py-2.5"
              >
                <p className="font-display text-2xl leading-none">{stat.value}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold" /> {ORG}
          </span>
          <span className="text-muted-foreground/60">{MINISTRY}</span>
        </div>
      </aside>

      <main className="relative flex min-h-svh flex-col">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30 lg:hidden" />
        <div className="relative flex items-center justify-between px-5 py-5 lg:hidden">
          <Wordmark compact />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/verify"
              className="rounded-lg border border-border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"
            >
              Verify
            </Link>
          </div>
        </div>
        <div className="hidden justify-end px-8 py-5 lg:flex">
          <div className="flex items-center gap-1">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-gold"
            >
              <Sparkles className="h-3 w-3" /> Public verification
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8">
          <LoginForm initialPersona={persona} next={next} />
        </div>

        <footer className="relative px-5 pb-6 text-center text-[9px] leading-relaxed text-muted-foreground sm:px-8">
          <p>
            {APP_NAME} · Demonstration build. Not an official Government of India service.
          </p>
        </footer>
      </main>
    </div>
  );
}
