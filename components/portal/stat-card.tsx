import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";

const TONES = {
  gold: "border-gold/20 bg-gold/5 text-gold",
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/20 bg-warning-soft text-warning",
  danger: "border-danger/20 bg-danger-soft text-danger",
  info: "border-info/20 bg-info-soft text-info",
  muted: "border-border bg-muted/60 text-muted-foreground",
} as const;

export type StatTone = keyof typeof TONES;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "gold",
  suffix,
  href,
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  suffix?: string;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
              TONES[tone],
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-[30px] leading-none tracking-tight tabular">
        {typeof value === "number" ? (
          <AnimatedNumber value={value} suffix={suffix} />
        ) : (
          <>
            {value}
            {suffix}
          </>
        )}
      </p>
      {hint ? (
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {href ? (
        <span className="mt-2 inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.14em] text-gold opacity-0 transition-opacity group-hover:opacity-100">
          Open <ArrowUpRight className="h-2.5 w-2.5" />
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    "group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card transition-colors hover:border-gold/25 sm:p-5",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
