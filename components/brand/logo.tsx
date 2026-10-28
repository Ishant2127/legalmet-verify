import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
    >
      <defs>
        <linearGradient id="lm-gold" x1="8" y1="4" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(42 85% 66%)" />
          <stop offset="0.55" stopColor="hsl(39 80% 53%)" />
          <stop offset="1" stopColor="hsl(32 78% 42%)" />
        </linearGradient>
      </defs>
      <path
        d="M22 3.5 38.5 9v11.2c0 9.8-6.6 16.9-16.5 20.3C12.1 37.1 5.5 30 5.5 20.2V9L22 3.5Z"
        stroke="url(#lm-gold)"
        strokeWidth="1.6"
        fill="hsl(var(--gold) / 0.06)"
      />
      <path d="M13.5 18.5h17" stroke="url(#lm-gold)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 12.5v15.2" stroke="url(#lm-gold)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.5 31.5h13" stroke="url(#lm-gold)" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="m13.5 18.5-3.2 5.1h6.4l-3.2-5.1ZM30.5 18.5l-3.2 5.1h6.4l-3.2-5.1Z"
        stroke="url(#lm-gold)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="12.4" r="1.5" fill="url(#lm-gold)" />
    </svg>
  );
}

export function Wordmark({
  href = "/",
  className,
  compact = false,
}: {
  href?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3", className)}>
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/5 transition-colors group-hover:border-gold/45">
        <BrandMark className="h-7 w-7" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] tracking-tight text-foreground">
          LegalMet <span className="text-gold">Verify</span>
        </span>
        {!compact ? (
          <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
            National Trust Infrastructure
          </span>
        ) : null}
      </span>
    </Link>
  );
}
