import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/demo-session";

export const metadata: Metadata = {
  title: {
    default: "Workspace",
    template: "%s · LegalMet Verify Nexus",
  },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = await verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) redirect("/login?next=/dashboard");

  return <PortalShell session={session}>{children}</PortalShell>;
}
