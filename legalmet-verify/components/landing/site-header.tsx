"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#services", label: "Services" },
  { href: "/verify", label: "Verify Certificate" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 8));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-precise",
        scrolled || open
          ? "border-border/80 bg-background/80 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Wordmark />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
              <span className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-foreground/60 transition-transform duration-300 ease-precise group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Button asChild size="sm">
              <Link href="/protected">
                Open dashboard <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="group">
                <Link href="/auth/sign-up">
                  Get Started
                  <ArrowRight className="transition-transform duration-300 ease-precise group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-[15px] text-foreground/80 hover:bg-secondary"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {signedIn ? (
                  <Button asChild className="col-span-2">
                    <Link href="/dashboard">Open dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline">
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth/sign-up">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
