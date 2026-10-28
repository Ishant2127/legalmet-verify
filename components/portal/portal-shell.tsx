"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChartNoAxesCombined,
  ClipboardCheck,
  ChevronRight,
  CircleDot,
  LayoutDashboard,
  LogOut,
  Menu,
  PlugZap,
  Scale,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Wordmark } from "@/components/brand/logo";
import { CommandPalette } from "@/components/portal/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_SECTIONS, ROLE_LABEL } from "@/lib/constants";
import { expiringCertificates, pendingQueue } from "@/lib/registry/derive";
import { useRegistry } from "@/lib/registry/store";
import type { Session } from "@/lib/types";
import { formatRelative, initials } from "@/lib/utils";
const ICONS = {
  LayoutDashboard,
  Scale,
  ClipboardCheck,
  BadgeCheck,
  ChartNoAxesCombined,
  ScrollText,
  PlugZap,
  Settings,
} as const;

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/instruments": "Instruments",
  "/instruments/new": "Register instrument",
  "/applications": "Applications",
  "/certificates": "Certificates",
  "/analytics": "Analytics",
  "/audit": "Audit trail",
  "/integrations": "Integrations",
  "/settings": "Settings",
};

export function PortalShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, exportRegistry } = useRegistry();
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.roles.includes(session.role)),
      })).filter((section) => section.items.length > 0),
    [session.role],
  );

  const counts = useMemo(
    () => ({
      pending: pendingQueue(state).length,
      expiring: expiringCertificates(state).length,
    }),
    [state],
  );

  const activeItem = sections
    .flatMap((section) => section.items)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const sectionLabel = sections.find((section) =>
    section.items.some((item) => item.href === activeItem?.href),
  )?.label;

  const expiring = useMemo(() => expiringCertificates(state, 4), [state]);
  const queue = useMemo(() => pendingQueue(state).slice(0, 3), [state]);
  const notificationCount = counts.expiring + counts.pending;

  async function signOut() {
    await fetch("/api/demo-logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  async function switchPersona(role: "owner" | "officer" | "admin") {
    await fetch("/api/demo-logout", { method: "POST" });
    window.location.href = `/login?persona=${role}&next=/dashboard`;
  }

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-border bg-card/30 lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Wordmark href="/dashboard" compact />
        </div>

        <div className="border-b border-border px-4 py-3">
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
            Active workspace
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/5 text-gold">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium">{session.organization}</p>
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                {ROLE_LABEL[session.role]} · {session.district}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/70">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = ICONS[item.icon as keyof typeof ICONS] ?? LayoutDashboard;
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const badgeValue =
                    item.badge === "pending"
                      ? counts.pending
                      : item.badge === "expiring"
                        ? counts.expiring
                        : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-active={active}
                      className="nav-link"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badgeValue > 0 ? (
                        <span className="rounded-full bg-gold/15 px-1.5 py-0.5 font-mono text-[9px] text-gold">
                          {badgeValue}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                Registry health
              </p>
              <span className="inline-flex items-center gap-1 font-mono text-[8px] text-success">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                LIVE
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              Supabase ledger synced · {state.certificates.length} certificates / {state.instruments.length} instruments
            </p>
            <div className="mt-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
              <span>last update</span>
              <span>{formatRelative(state.lastUpdated)}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-[10px] font-semibold text-gold">
                  {initials(session.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium">{session.name}</span>
                  <span className="block truncate font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                    {session.badgeId ?? session.email}
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel>Demo session</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <UserCog /> Profile & settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/verify">
                  <ShieldCheck /> Public verify desk
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void switchPersona(session.role === "owner" ? "officer" : "owner")}>
                <Sparkles /> Switch persona
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportRegistry}>
                <ScrollText /> Export registry JSON
              </DropdownMenuItem>
              <DropdownMenuItem className="text-danger" onClick={() => void signOut()}>
                <LogOut /> End session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="hidden min-w-0 items-center gap-2 text-xs sm:flex">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              {sectionLabel ?? "Operations"}
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="truncate font-medium">
              {PAGE_TITLES[pathname] ?? activeItem?.label ?? "Workspace"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-8 items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 text-[11px] text-muted-foreground transition-colors hover:border-gold/30 hover:text-foreground sm:inline-flex"
            >
              <Search className="h-3.5 w-3.5" />
              Search registry
              <span className="kbd ml-2">⌘K</span>
            </button>

            <Badge variant="success" dot className="hidden md:inline-flex">
              Supabase live
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 ? (
                    <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gold px-0.5 font-mono text-[8px] font-bold text-gold-foreground">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Attention required</DropdownMenuLabel>
                {expiring.length === 0 && queue.length === 0 ? (
                  <div className="px-2.5 py-6 text-center text-xs text-muted-foreground">
                    Nothing needs your attention.
                  </div>
                ) : null}
                {expiring.map((details) => (
                  <DropdownMenuItem
                    key={details.certificate.id}
                    asChild
                  >
                    <Link href={`/verify?cert=${encodeURIComponent(details.certificate.number)}`}>
                      <CircleDot className="text-warning" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[10px]">
                          {details.certificate.number}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          Expires in {details.daysRemaining} days
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                {queue.map((application) => (
                  <DropdownMenuItem key={application.id} asChild>
                    <Link href="/applications">
                      <ClipboardCheck className="text-info" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[10px]">
                          {application.number}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {application.status === "inspection" ? "Inspection scheduled" : "Awaiting review"}
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/certificates">
                    <BadgeCheck /> Open certificate register
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-8 items-center gap-2 rounded-lg pl-0.5 pr-2 transition-colors hover:bg-muted/60"
                  aria-label="Account menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-[10px] font-semibold text-gold">
                    {initials(session.name)}
                  </span>
                  <span className="hidden text-left md:block">
                    <span className="block max-w-[9rem] truncate text-[11px] font-medium leading-tight">
                      {session.name}
                    </span>
                    <span className="block font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                      {ROLE_LABEL[session.role]}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>{session.email}</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <UserCog /> Account settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/verify">
                    <ShieldCheck /> Verification desk
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void navigator.clipboard.writeText(session.email);
                    toast.success("Email copied");
                  }}
                >
                  <Search /> Copy email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
                {(["owner", "officer", "admin"] as const)
                  .filter((role) => role !== session.role)
                  .map((role) => (
                    <DropdownMenuItem key={role} onClick={() => void switchPersona(role)}>
                      <Sparkles /> {ROLE_LABEL[role]}
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-danger" onClick={() => void signOut()}>
                  <LogOut /> End session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>

        <footer className="border-t border-border px-4 py-4 text-[9px] text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono uppercase tracking-[0.12em]">
            <span>LegalMet Verify Nexus · {ROLE_LABEL[session.role]} workspace</span>
            <span>Registry snapshot {formatRelative(state.lastUpdated)}</span>
          </div>
        </footer>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} session={session} />

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          hideClose
          className="left-0 top-0 h-svh w-72 max-w-[82vw] translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-y-0 border-l-0 p-0"
        >
          <DialogTitle className="sr-only">Workspace navigation</DialogTitle>
          <div className="flex h-16 items-center border-b border-border px-5">
            <Wordmark href="/dashboard" compact />
          </div>
          <div className="border-b border-border px-4 py-3">
            <p className="text-[11px] font-medium">{session.organization}</p>
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
              {ROLE_LABEL[session.role]} · {session.district}
            </p>
          </div>
          <nav className="space-y-4 p-3">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="px-3 pb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const Icon = ICONS[item.icon as keyof typeof ICONS] ?? LayoutDashboard;
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-active={active}
                      className="nav-link"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="p-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" /> End session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
