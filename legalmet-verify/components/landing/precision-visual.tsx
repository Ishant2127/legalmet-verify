"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/components/motion/primitives";

const CX = 220;
const CY = 230;
const R = 150;
const START = -200;
const END = 20;

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
}

const ticks = Array.from({ length: 45 }, (_, i) => {
  const angle = START + ((END - START) / 44) * i;
  const major = i % 5 === 0;
  const outer = polar(angle, R);
  const inner = polar(angle, R - (major ? 16 : 8));
  return { i, major, outer, inner, angle };
});

function arcPath(radius: number, from: number, to: number) {
  const s = polar(from, radius);
  const e = polar(to, radius);
  const large = to - from > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
}

const NEEDLE_TARGET = -62;

export function PrecisionVisual() {
  const reduce = useReducedMotion();
  const needleStart = reduce ? NEEDLE_TARGET + 90 : START + 90;

  return (
    <div className="relative mx-auto aspect-[44/36] w-full max-w-[520px]">
      <svg
        viewBox="0 0 440 360"
        className="h-full w-full"
        role="img"
        aria-label="Animated calibration gauge settling on a verified reading"
      >
        <defs>
          <linearGradient id="arc-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(var(--cobalt))" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(var(--cobalt))" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--cobalt))" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(var(--cobalt))" stopOpacity="0" />
          </radialGradient>
          <clipPath id="scan-clip">
            <rect x="40" y="40" width="360" height="230" />
          </clipPath>
        </defs>

        <circle cx={CX} cy={CY} r="190" fill="url(#glow)" />

        <motion.path
          d={arcPath(R + 14, START, END)}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeOpacity="0.12"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
        />

        {ticks.map((t) => (
          <motion.line
            key={t.i}
            x1={t.inner.x}
            y1={t.inner.y}
            x2={t.outer.x}
            y2={t.outer.y}
            stroke="hsl(var(--foreground))"
            strokeOpacity={t.major ? 0.7 : 0.25}
            strokeWidth={t.major ? 1.5 : 1}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + t.i * 0.018, duration: 0.3 }}
          />
        ))}

        {ticks
          .filter((t) => t.major)
          .map((t, idx) => {
            const p = polar(t.angle, R - 32);
            return (
              <motion.text
                key={t.i}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground font-mono"
                fontSize="10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + idx * 0.05 }}
              >
                {idx * 10}
              </motion.text>
            );
          })}

        <motion.path
          d={arcPath(R + 14, START, NEEDLE_TARGET)}
          fill="none"
          stroke="url(#arc-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, delay: 0.6, ease: EASE }}
        />

        <motion.g
          style={{ originX: `${CX}px`, originY: `${CY}px` }}
          initial={{ rotate: needleStart }}
          animate={{ rotate: NEEDLE_TARGET + 90 }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 40, damping: 9, delay: 0.7 }
          }
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - R + 22}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.g>
        <circle cx={CX} cy={CY} r="7" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <circle cx={CX} cy={CY} r="2" fill="hsl(var(--saffron))" />

        <motion.g
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6, ease: EASE }}
        >
          <text
            x={CX}
            y={CY + 44}
            textAnchor="middle"
            className="fill-foreground font-mono"
            fontSize="26"
            fontWeight="500"
            letterSpacing="-0.5"
          >
            13.800 kg
          </text>
          <text
            x={CX}
            y={CY + 64}
            textAnchor="middle"
            className="fill-muted-foreground font-mono"
            fontSize="9.5"
            letterSpacing="1.5"
          >
            {"CLASS III · e = 5 g · ±0.01%"}
          </text>
        </motion.g>

        <g clipPath="url(#scan-clip)">
          <motion.rect
            x="40"
            width="360"
            height="1"
            fill="hsl(var(--cobalt))"
            opacity="0.5"
            initial={{ y: 40 }}
            animate={reduce ? { y: 40, opacity: 0 } : { y: [40, 270, 40] }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatDelay: 2, delay: 2 }}
          />
        </g>

        <line x1="40" x2="400" y1="330" y2="330" stroke="hsl(var(--foreground))" strokeOpacity="0.15" />
        {Array.from({ length: 37 }, (_, i) => (
          <line
            key={i}
            x1={40 + i * 10}
            x2={40 + i * 10}
            y1="330"
            y2={i % 5 === 0 ? 320 : 325}
            stroke="hsl(var(--foreground))"
            strokeOpacity={i % 5 === 0 ? 0.35 : 0.15}
          />
        ))}
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.9, duration: 0.6, ease: EASE }}
        className="absolute bottom-[14%] right-0 flex items-center gap-2.5 rounded-lg border bg-card/90 py-2 pl-2 pr-3.5 shadow-[0_8px_24px_-12px_hsl(221_43%_11%/0.25)] backdrop-blur sm:right-2"
      >
        <span className="relative flex size-7 items-center justify-center rounded-md bg-success/10">
          <svg viewBox="0 0 16 16" className="size-4 text-success" aria-hidden>
            <motion.path
              d="M3.5 8.5l3 3 6-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.3, duration: 0.5, ease: EASE }}
            />
          </svg>
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-xs font-medium text-foreground">Verified</span>
          <span className="font-mono text-[10px] text-muted-foreground">Within tolerance</span>
        </span>
      </motion.div>
    </div>
  );
}
