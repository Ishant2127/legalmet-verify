import { createClient } from "@/lib/supabase/server";
import { AnimatedNumber } from "@/components/motion/primitives";
import { Skeleton } from "@/components/ui/skeleton";

type Stats = { instruments: number; certificates_issued: number; active_certificates: number };

const labels: [keyof Stats, string][] = [
  ["instruments", "Instruments registered"],
  ["certificates_issued", "Certificates issued"],
  ["active_certificates", "Currently valid"],
];

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section aria-label="Platform metrics" className="border-y bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-8">
        {children}
      </div>
    </section>
  );
}

export async function Metrics() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_stats").maybeSingle<Stats>();

  if (error || !data) {
    return (
      <Frame>
        <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
          Live platform statistics are temporarily unavailable.
        </p>
      </Frame>
    );
  }

  return (
    <Frame>
      {labels.map(([key, label]) => (
        <div key={key} className="flex items-baseline justify-between gap-4 py-7 sm:flex-col sm:justify-start sm:px-8 sm:first:pl-0">
          <span className="text-sm text-muted-foreground">{label}</span>
          <AnimatedNumber
            value={Number(data[key] ?? 0)}
            className="tabular font-mono text-3xl font-medium tracking-tight"
          />
        </div>
      ))}
    </Frame>
  );
}

export function MetricsSkeleton() {
  return (
    <Frame>
      {labels.map(([key]) => (
        <div key={key} className="flex flex-col gap-3 py-7 sm:px-8 sm:first:pl-0">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </Frame>
  );
}
