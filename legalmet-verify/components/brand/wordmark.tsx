import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <path d="M5 16.5h14" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M7 16.5v-2M9.5 16.5v-1M12 16.5v-3M14.5 16.5v-1M17 16.5v-2"
        stroke="hsl(var(--primary-foreground))"
        strokeOpacity="0.55"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M8 9.2l2.6 2.6L16.4 6"
        stroke="hsl(var(--saffron))"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Wordmark({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <LogoMark className="transition-transform duration-500 ease-precise group-hover:rotate-[-6deg]" />
      <span>
        LegalMet <span className="font-normal text-muted-foreground">Verify</span>
      </span>
    </Link>
  );
}
