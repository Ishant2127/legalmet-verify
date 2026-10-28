"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  ClipboardCheck,
  Database,
  Download,
  Fingerprint,
  Loader2,
  RefreshCw,
  Scale,
  ScanLine,
  ScrollText,
  Search,
  ShieldCheck,
  ShieldX,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PortalPageSkeleton } from "@/components/portal/loading";
import { PageHeader } from "@/components/portal/page-header";
import { RoleGuard } from "@/components/portal/role-guard";
import { StatCard } from "@/components/portal/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/separator";
import { ROLE_SHORT, ROLE_LABEL } from "@/lib/constants";
import { sha256Hex, shortHash } from "@/lib/crypto";
import { useRegistry } from "@/lib/registry/store";
import type { AuditEvent, Role } from "@/lib/types";
import { cn, downloadBlob, formatDateTime, formatRelative, titleCase } from "@/lib/utils";

const ENTITIES = ["instrument", "application", "certificate", "registry", "session"] as const;

const ENTITY_ICONS = {
  instrument: Scale,
  application: ClipboardCheck,
  certificate: BadgeCheck,
  registry: Database,
  session: User,
} as const;

function eventTone(event: AuditEvent) {
  if (event.action.includes("revoked") || event.action.includes("rejected")) {
    return "border-danger/25 bg-danger-soft text-danger";
  }
  if (event.action.includes("issued") || event.action.includes("approved")) {
    return "border-success/25 bg-success-soft text-success";
  }
  if (event.action.includes("inspection") || event.action.includes("registered")) {
    return "border-info/25 bg-info-soft text-info";
  }
  if (event.action.includes("verification")) {
    return "border-gold/25 bg-gold-soft text-gold";
  }
  return "border-border bg-muted/60 text-muted-foreground";
}

function eventIcon(event: AuditEvent) {
  if (event.action.includes("verification")) return ScanLine;
  if (event.action.includes("revoked")) return ShieldX;
  if (event.action.includes("snapshot")) return Fingerprint;
  if (event.entity === "certificate") return BadgeCheck;
  return ENTITY_ICONS[event.entity] ?? Activity;
}

export default function AuditPage() {
  const { state, session, hydrated } = useRegistry();
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [root, setRoot] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...state.audit]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .filter((event) => (entity === "all" ? true : event.entity === entity))
      .filter((event) => (roleFilter === "all" ? true : event.role === roleFilter))
      .filter((event) => {
        if (!term) return true;
        return [event.actor, event.action, event.detail, event.entityId]
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
  }, [state.audit, search, entity, roleFilter]);

  const chain = useCallback(async () => {
    setBusy(true);
    let digest = "GENESIS";
    const ascending = [...state.audit].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    );
    for (const event of ascending) {
      digest = await sha256Hex(
        [
          digest,
          event.at,
          event.actor,
          event.action,
          event.entity,
          event.entityId,
          event.detail,
        ].join("|"),
      );
    }
    setRoot(digest);
    setBusy(false);
  }, [state.audit]);

  useEffect(() => {
    if (hydrated) void chain();
  }, [hydrated, chain]);

  if (!hydrated || !session) return <PortalPageSkeleton />;

  const issued = state.audit.filter((event) => event.action === "certificate.issued").length;
  const revoked = state.audit.filter((event) => event.action === "certificate.revoked").length;
  const verifications = state.audit.filter(
    (event) => event.action === "verification.performed",
  ).length;

  const roleDistribution = (["owner", "officer", "admin", "system"] as const).map(
    (role) => ({
      role,
      count: state.audit.filter((event) => event.role === role).length,
    }),
  );
  const totalEvents = state.audit.length || 1;

  function exportLog() {
    const payload = {
      exportedAt: new Date().toISOString(),
      chainRoot: root,
      algorithm: "SHA-256 rolling chain over at, actor, action, entity, entityId, detail",
      events: filtered,
    };
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      `legalmet-audit-${new Date().toISOString().slice(0, 10)}.json`,
    );
    toast.success("Audit log exported", {
      description: `${filtered.length} events · chain root included`,
    });
  }

  const filtersActive = search !== "" || entity !== "all" || roleFilter !== "all";

  return (
    <RoleGuard roles={["officer", "admin"]}>
      <div className="space-y-5">
        <PageHeader
          eyebrow="Immutable record"
          title={
            <>
              Audit <span className="italic text-gold">trail.</span>
            </>
          }
          description="Every registration, decision, issuance, revocation and public verification — attributed and ordered."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => void chain()} disabled={busy}>
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Recompute chain
              </Button>
              <Button size="sm" onClick={exportLog}>
                <Download className="h-3.5 w-3.5" /> Export log
              </Button>
            </>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Events" value={state.audit.length} hint="Full registry history" icon={ScrollText} />
          <StatCard
            label="Certificates issued"
            value={issued}
            hint="Across all districts"
            icon={BadgeCheck}
            tone="success"
          />
          <StatCard
            label="Revocations"
            value={revoked}
            hint="Withdrawn seals"
            icon={ShieldX}
            tone="danger"
          />
          <StatCard
            label="Verifications"
            value={verifications}
            hint="Public lookups recorded"
            icon={ScanLine}
            tone="info"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.42fr_0.58fr]">
          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Chain integrity</CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Rolling SHA-256 over the ordered event log
                </p>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="rounded-xl border border-success/25 bg-success-soft p-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-success">
                      <ShieldCheck className="h-3 w-3" /> chain root
                    </span>
                    <Badge variant="success" dot>
                      sealed
                    </Badge>
                  </div>
                  <p className="mt-2 break-all font-mono text-[10px] leading-relaxed text-success">
                    {busy ? "Computing…" : root ? shortHash(root, 30, 24) : "—"}
                  </p>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  The root is recomputed in your browser from the full event list. Any edit
                  to an actor, action, timestamp or detail changes the root digest.
                </p>
                <div className="flex items-center justify-between border-t border-border pt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span>algorithm</span>
                  <span className="text-foreground">sha-256 / rolling</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span>events folded</span>
                  <span className="text-foreground">{state.audit.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Actor distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {roleDistribution.map((entry) => {
                  const percent = (entry.count / totalEvents) * 100;
                  return (
                    <div key={entry.role}>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="capitalize text-muted-foreground">
                          {entry.role === "system" ? "Registry sentinel" : ROLE_LABEL[entry.role as Role]}
                        </span>
                        <span className="font-mono">{entry.count}</span>
                      </div>
                      <Progress
                        value={percent}
                        className="mt-1 h-1"
                        indicatorClassName={
                          entry.role === "officer"
                            ? "bg-info"
                            : entry.role === "admin"
                              ? "bg-success"
                              : entry.role === "owner"
                                ? "bg-gold"
                                : "bg-muted-foreground"
                        }
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search actor, action, detail…"
                    className="pl-9"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={entity} onChange={(event) => setEntity(event.target.value)}>
                    <option value="all">All entities</option>
                    {ENTITIES.map((item) => (
                      <option key={item} value={item}>
                        {titleCase(item)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                  >
                    <option value="all">All actors</option>
                    <option value="owner">Owners</option>
                    <option value="officer">Officers</option>
                    <option value="admin">Admins</option>
                    <option value="system">System</option>
                  </Select>
                </div>
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  <span>{filtered.length} events</span>
                  {filtersActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setEntity("all");
                        setRoleFilter("all");
                      }}
                      className="hover:text-gold"
                    >
                      Reset
                    </button>
                  ) : (
                    <span>live filters</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
              <CardTitle>Event timeline</CardTitle>
              <Badge variant="outline">newest first</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              {filtered.length === 0 ? (
                <div className="py-14 text-center">
                  <ScrollText className="mx-auto h-6 w-6 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium">No events match these filters</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reset the filters to see the full trail.
                  </p>
                </div>
              ) : null}
              <ol className="relative ml-3 border-l border-border">
                {filtered.map((event) => {
                  const Icon = eventIcon(event);
                  return (
                    <li key={event.id} className="relative pb-5 pl-5 last:pb-0">
                      <span
                        className={cn(
                          "absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border bg-card",
                          eventTone(event),
                        )}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="flex flex-wrap items-start justify-between gap-1">
                        <p className="text-[11px] font-semibold capitalize">
                          {event.action.replace(/\./g, " · ")}
                        </p>
                        <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                          {formatRelative(event.at)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {event.detail}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground/80">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-2.5 w-2.5" /> {event.actor}
                        </span>
                        <span>
                          {event.role === "system" ? "Sentinel" : ROLE_SHORT[event.role]}
                        </span>
                        <span className="text-gold/70">{event.entityId}</span>
                        <span>{formatDateTime(event.at)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
          <p className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <Fingerprint className="h-4 w-4 text-gold" />
            Chain root{" "}
            <span className="font-mono text-[10px] text-foreground">
              {root ? shortHash(root, 16, 10) : "—"}
            </span>
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
            export includes the root digest
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}
