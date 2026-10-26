import { Suspense } from "react";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { Metrics, MetricsSkeleton } from "@/components/landing/metrics";
import {
  CertificatesSection,
  HowItWorks,
  RolesSection,
  SiteFooter,
} from "@/components/landing/sections";
import { createClient } from "@/lib/supabase/server";

async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <SiteHeader signedIn={Boolean(data?.claims)} />;
}

export default function Home() {
  return (
    <>
      <Suspense fallback={<SiteHeader signedIn={false} />}>
        <Header />
      </Suspense>
      <main>
        <Hero />
        <Suspense fallback={<MetricsSkeleton />}>
          <Metrics />
        </Suspense>
        <HowItWorks />
        <CertificatesSection />
        <RolesSection />
      </main>
      <SiteFooter />
    </>
  );
}
