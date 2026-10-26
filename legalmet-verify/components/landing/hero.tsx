"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE } from "@/components/motion/primitives";
import { PrecisionVisual } from "./precision-visual";

const words = ["Every", "measurement."];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid mask-fade opacity-60" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col items-start">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border bg-card/70 py-1 pl-1 pr-3 text-xs text-muted-foreground backdrop-blur"
          >
            <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-primary-foreground">
              SIH26036
            </span>
            Online verification for legal metrology
          </motion.p>

          <h1 className="mt-6 text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[72px]">
            <span className="block overflow-hidden pb-1">
              {words.map((w, i) => (
                <motion.span
                  key={w}
                  className="mr-[0.25em] inline-block"
                  initial={{ y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.08 }}
                >
                  {w}
                </motion.span>
              ))}
            </span>
            <span className="block overflow-hidden pb-2">
              <motion.span
                className="relative inline-block text-cobalt"
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.28 }}
              >
                Verified.
                <motion.span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-saffron"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.9 }}
                />
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.45 }}
            className="mt-6 max-w-[34rem] text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            A smarter way to register instruments, manage verification, and validate certificates —
            all in one transparent digital platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
            className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Button asChild size="lg" className="group">
              <Link href="/auth/sign-up">
                Get Started
                <ArrowRight className="transition-transform duration-300 ease-precise group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="group">
              <Link href="/verify">
                <ScanLine className="text-cobalt transition-transform duration-300 ease-precise group-hover:scale-110" />
                Verify a Certificate
              </Link>
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm"
          >
            {[
              ["Row-level secured", "data access"],
              ["Public QR", "certificate checks"],
              ["Role-based", "official workflows"],
            ].map(([a, b]) => (
              <div key={a} className="flex flex-col">
                <dt className="font-medium text-foreground">{a}</dt>
                <dd className="text-muted-foreground">{b}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <div className="relative">
          <PrecisionVisual />
        </div>
      </div>
    </section>
  );
}
