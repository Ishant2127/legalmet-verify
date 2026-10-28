"use client";

import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/constants";
import { useRegistry } from "@/lib/registry/store";
import type { Role } from "@/lib/types";

export function RoleGuard({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { session } = useRegistry();

  if (session && roles.includes(session.role)) return <>{children}</>;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-warning/25 bg-warning-soft text-warning">
        <ShieldAlert className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-display text-2xl tracking-tight">Restricted workspace area</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This view is limited to{" "}
        {roles.map((role) => ROLE_LABEL[role]).join(" and ")}. Your current session is
        signed in as {session ? ROLE_LABEL[session.role] : "an unauthenticated user"}.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard">
            <LockKeyhole className="h-4 w-4" /> Return to overview
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login?persona=officer&next=/analytics">Switch persona</Link>
        </Button>
      </div>
    </div>
  );
}
