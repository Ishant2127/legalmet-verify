"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRegistry } from "@/lib/registry/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#trust", label: "Trust layer" },
  { href: "/#registry", label: "Live registry" },
  { href: "/#how", label: "How it works" },
  { href: "/#roles", label: "Workspaces" },
];

export function SiteHeader() {
  const { session } = useRegistry();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between lg:h-[72px]">
        <Wordmark />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-success/25 bg-success-soft px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-success md:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Registry live
          </span>
          <ThemeToggle />
          {session ? (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard">
                Open workspace
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                Secure sign in
              </Link>
            </Button>
          )}
          <Button asChild size="sm" className="sm:hidden">
            <Link href="/verify">Verify</Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Menu">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Navigate</DropdownMenuLabel>
              {NAV.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/verify">Public verification</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={session ? "/dashboard" : "/login"}>
                  {session ? "Open workspace" : "Secure sign in"}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
