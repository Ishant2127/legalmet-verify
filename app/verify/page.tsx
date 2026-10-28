import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/sections";
import { VerifyClient } from "@/components/verify/verify-client";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description:
    "Resolve any legal-metrology certificate against the national registry, recompute its SHA-256 seal and inspect its live validity.",
  alternates: { canonical: "/verify" },
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ cert?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.cert) ? params.cert[0] : params.cert;
  const initialCert = raw?.trim() || undefined;

  return (
    <>
      <div className="print-hidden">
        <SiteHeader />
      </div>

      <main>
        <div className="print-hidden border-b border-border/60 bg-card/20">
          <div className="container flex h-10 items-center justify-between text-[10px] text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-3 w-3" /> Back to {APP_NAME}
            </Link>
            <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em]">
              <ShieldCheck className="h-3 w-3 text-gold" />
              Section 24 · Legal Metrology Act, 2009
            </span>
          </div>
        </div>

        <VerifyClient initialCert={initialCert} />
      </main>

      <div className="print-hidden">
        <SiteFooter />
      </div>
    </>
  );
}
