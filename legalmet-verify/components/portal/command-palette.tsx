"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  BadgeCheck,
  CircleDot,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  UserCog,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NAV_SECTIONS, ROLE_LABEL } from "@/lib/constants";
import { enrichCertificate, searchRegistry } from "@/lib/registry/derive";
import { useRegistry } from "@/lib/registry/store";
import type { Session } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function CommandPalette({
  open,
  onOpenChange,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
}) {
  const router = useRouter();
  const { state } = useRegistry();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const navigation = useMemo(
    () =>
      NAV_SECTIONS.flatMap((section) =>
        section.items
          .filter((item) => item.roles.includes(session.role))
          .map((item) => ({ ...item, section: section.label })),
      ),
    [session.role],
  );

  const certificateResults = useMemo(() => {
    if (query.trim().length < 2) return [];
    return searchRegistry(state, query)
      .slice(0, 5)
      .map((details) => enrichCertificate(state, details.certificate));
  }, [query, state]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  async function signOut() {
    onOpenChange(false);
    await fetch("/api/demo-logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          loop
          shouldFilter
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search pages, certificates, serials…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <span className="kbd">esc</span>
          </div>
          <Command.List className="max-h-[420px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-xs text-muted-foreground">
              No matching pages or certificates.
            </Command.Empty>

            {certificateResults.length ? (
              <Command.Group heading="Certificates">
                {certificateResults.map((details) => (
                  <Command.Item
                    key={details.certificate.id}
                    value={`${details.certificate.number} ${details.instrument?.serial ?? ""} ${details.owner?.organization ?? ""}`}
                    onSelect={() => go(`/verify?cert=${encodeURIComponent(details.certificate.number)}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm data-[selected=true]:bg-muted"
                  >
                    <BadgeCheck className="h-4 w-4 shrink-0 text-gold" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-xs">
                        {details.certificate.number}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {details.instrument?.name} · {formatDate(details.certificate.validUntil)}
                      </span>
                    </span>
                    <CircleDot
                      className={cn(
                        "h-3 w-3 shrink-0",
                        details.state === "valid"
                          ? "text-success"
                          : details.state === "expiring"
                            ? "text-warning"
                            : details.state === "revoked"
                              ? "text-danger"
                              : "text-muted-foreground",
                      )}
                    />
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}

            <Command.Group heading="Navigate">
              {navigation.map((item) => (
                <Command.Item
                  key={item.href}
                  value={`${item.label} ${item.section} ${item.href}`}
                  onSelect={() => go(item.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm data-[selected=true]:bg-muted"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{item.label}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60">
                    {item.section}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item
                value="verify public certificate lookup"
                onSelect={() => go("/verify")}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm data-[selected=true]:bg-muted"
              >
                <ShieldCheck className="h-4 w-4 text-gold" />
                <span className="flex-1">Open public verification desk</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Command.Item>
              <Command.Item
                value="toggle theme dark light appearance"
                onSelect={() => {
                  setTheme(resolvedTheme === "dark" ? "light" : "dark");
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm data-[selected=true]:bg-muted"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4 text-gold" />
                ) : (
                  <Moon className="h-4 w-4 text-gold" />
                )}
                <span className="flex-1">Toggle appearance</span>
              </Command.Item>
              <Command.Item
                value={`profile ${session.name} ${ROLE_LABEL[session.role]}`}
                onSelect={() => go("/settings")}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm data-[selected=true]:bg-muted"
              >
                <UserCog className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">Workspace profile</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60">
                  {ROLE_LABEL[session.role]}
                </span>
              </Command.Item>
              <Command.Item
                value="sign out log out session"
                onSelect={() => void signOut()}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-danger data-[selected=true]:bg-danger-soft"
              >
                <LogOut className="h-4 w-4" />
                <span className="flex-1">End session</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-between border-t border-border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="kbd">↑</span>
              <span className="kbd">↓</span> navigate
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="kbd">↵</span> open
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
