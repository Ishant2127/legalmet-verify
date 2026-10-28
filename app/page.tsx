import type { Metadata } from "next";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { LiveRegistry } from "@/components/landing/live-registry";
import {
  ArchitectureSection,
  ClosingCta,
  HowItWorks,
  PersonaSection,
  SiteFooter,
  TrustSection,
} from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "LegalMet Verify Nexus — Trust, measured.",
  description:
    "Verify any legal-metrology certificate in seconds. Tamper-evident SHA-256 seals, QR verification, live Supabase registry and role-aware inspection workspaces.",
};

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustSection />
        <LiveRegistry />
        <HowItWorks />
        <PersonaSection />
        <ArchitectureSection />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
