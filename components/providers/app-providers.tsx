"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { RegistryProvider } from "@/lib/registry/store";
import type { Session } from "@/lib/types";

export function AppProviders({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={180}>
        <RegistryProvider session={session}>
          {children}
          <Toaster />
        </RegistryProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
