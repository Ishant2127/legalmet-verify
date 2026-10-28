"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CircleCheck,
  Cloud,
  Database,
  Loader2,
  RefreshCw,
  ServerCog,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLiveRegistrySnapshot, type LiveRegistrySnapshot } from "@/lib/registry/live";
import { formatDate } from "@/lib/utils";

export function LiveRegistry() {
  const [snapshot, setSnapshot] = useState<LiveRegistrySnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const next = await getLiveRegistrySnapshot(6);
    setSnapshot(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section id="registry" className="relative border-y border-border/70 bg-card/30 py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[size:72px_72px] opacity-[0.18]" />
      <div className="container relative">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Live registry</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              The national ledger, <span className="italic text-gold">in real time.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              This strip is not a mock. It queries the connected Supabase project and
              resolves each certificate through the national verification function.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
              <Database className="h-3.5 w-3.5 text-gold" />
              {snapshot?.projectRef ? `supabase/${snapshot.projectRef}` : "supabase/connected"}
            </span>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </Button>
            <Button asChild size="sm">
              <Link href="/verify">
                Verification desk
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {loading && !snapshot
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse rounded-2xl border border-border bg-card/60"
                />
              ))
            : null}

          {!loading && snapshot?.error ? (
            <div className="md:col-span-3 rounded-2xl border border-warning/25 bg-warning-soft p-6">
              <div className="flex items-center gap-3">
                <TriangleAlert className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-semibold">Live registry is not reachable</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {snapshot.error}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {snapshot?.records.map((record) => {
            const status = record.status.toUpperCase();
            const tone =
              status === "VALID"
                ? "success"
                : status === "REVOKED"
                  ? "danger"
                  : status === "EXPIRED"
                    ? "default"
                    : "warning";
            return (
              <Link
                key={record.number}
                href={`/verify?cert=${encodeURIComponent(record.number)}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-5 transition-all hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-glow"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold/5 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 bg-gold/5 text-gold">
                      <CircleCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Supabase record
                      </p>
                      <p className="font-mono text-xs font-semibold text-gold">
                        {record.number}
                      </p>
                    </div>
                  </div>
                  <Badge variant={tone}>{record.status}</Badge>
                </div>
                <p className="mt-4 line-clamp-2 text-sm font-medium">{record.instrumentName}</p>
                <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                  {record.manufacturer} · {record.model}
                </p>
                <div className="mt-4 flex items-end justify-between border-t border-border/70 pt-3">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                      Holder
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px]">{record.ownerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                      Valid until
                    </p>
                    <p className="mt-0.5 text-[11px]">{formatDate(record.validUntil)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Cloud className="h-3 w-3" /> live query
                  </span>
                  <span className="inline-flex items-center gap-1 text-gold opacity-0 transition-opacity group-hover:opacity-100">
                    Verify <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}

          {!loading && snapshot && !snapshot.error && snapshot.records.length === 0 ? (
            <div className="md:col-span-3 rounded-2xl border border-border bg-card/60 p-8 text-center">
              <ServerCog className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Registry connected, no public records yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Run the Nexus migration to seed certificates, or verify a demo record.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            RPC verify_certificate online
          </span>
          <span>Latency {snapshot?.latencyMs ?? "—"} ms</span>
          <span>{snapshot?.records.length ?? 0} public records resolved</span>
          <span className="text-muted-foreground/60">Read-only anon key</span>
        </div>
      </div>
    </section>
  );
}
