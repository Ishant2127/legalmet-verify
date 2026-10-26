"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  Scale, 
  QrCode, 
  Sparkles,
  FileBadge,
  CheckCircle2,
  Lock,
  ChevronRight
} from "lucide-react";
import { EASE } from "@/components/motion/primitives";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 text-white pt-8 pb-16 md:pt-14 md:pb-24 border-b border-zinc-800">
      {/* Subtle background glow */}
      <div 
        aria-hidden 
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))]" 
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        
        {/* National Crest Badge */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-zinc-900/90 px-3.5 py-1.5 text-xs text-zinc-300 shadow-xl backdrop-blur mb-6"
          >
            <span className="flex size-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-amber-400 font-semibold tracking-wide">
              NATIONAL VERIFICATION INITIATIVE
            </span>
            <span className="text-zinc-600">|</span>
            <span>Legal Metrology Division</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className="text-balance text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08]"
          >
            National Online <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
              Metrology Verification
            </span>{" "}
            System
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            className="mt-6 text-zinc-400 text-base sm:text-lg max-w-2xl leading-relaxed"
          >
            A tamper-evident, cryptographic verification infrastructure for commercial weights, measures, weighbridges, and retail fuel dispensers governed under the Legal Metrology Act.
          </motion.p>

          {/* Quick CTA Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <Link
              href="/verify"
              className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm transition shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-black" />
              Verify a Certificate Now
            </Link>

            <Link
              href="/owner/dashboard"
              className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-medium text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              Owner Portal
            </Link>

            <Link
              href="/official/applications"
              className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-medium text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              Officer Queue
            </Link>
          </motion.div>
        </div>

        {/* 3 Interactive Role Gateway Cards */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1: Citizen / Public */}
          <Link
            href="/verify"
            className="group relative p-6 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl transition duration-300 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  Public Domain
                </span>
                <h2 className="text-xl font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                  Citizen Registry Verification
                </h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Validate the digital seal and authenticity of any weighing device by entering its certificate number or scanning its QR code.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center text-xs font-mono text-amber-400 gap-1 group-hover:gap-2 transition-all">
              <span>Open Public Registry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: Instrument Owners & Traders */}
          <Link
            href="/owner/dashboard"
            className="group relative p-6 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl transition duration-300 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  Commercial Owners
                </span>
                <h2 className="text-xl font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                  Trader & Device Portal
                </h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Declare new commercial instruments, track verification progress, receive expiry alerts, and download compliance cards.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center text-xs font-mono text-amber-400 gap-1 group-hover:gap-2 transition-all">
              <span>Access Owner Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: Legal Metrology Officers */}
          <Link
            href="/official/applications"
            className="group relative p-6 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl transition duration-300 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  Authorized Officers
                </span>
                <h2 className="text-xl font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                  Officer Inspection Desk
                </h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Review field verification applications, evaluate technical tolerances, and issue tamper-proof digital certificates.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center text-xs font-mono text-amber-400 gap-1 group-hover:gap-2 transition-all">
              <span>Open Inspection Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
