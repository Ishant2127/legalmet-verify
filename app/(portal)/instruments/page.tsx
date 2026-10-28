"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ClipboardCheck,
  MapPin,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
import { PortalPageSkeleton } from "@/components/portal/loading";
import { PageHeader } from "@/components/portal/page-header";
import { StatCard } from "@/components/portal/stat-card";
import { CertificateStatus, InstrumentStatusBadge } from "@/components/portal/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DISTRICTS } from "@/lib/constants";
import {
  enrichCertificate,
  findApplicationByInstrument,
  ownerInstruments,
} from "@/lib/registry/derive";
import { useRegistry } from "@/lib/registry/store";
import type { Instrument } from "@/lib/types";
import { cn, formatDate, initials } from "@/lib/utils";

export default function InstrumentsPage() {
  const { state, session, hydrated } = useRegistry();
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Instrument | null>(null);

  const scoped = useMemo(() => {
    if (!session) return [];
    const base =
      session.role === "owner" && session.ownerId
        ? ownerInstruments(state, session.ownerId)
        : state.instruments;
    const term = search.trim().toLowerCase();
    return base
      .filter((instrument) => {
        if (district !== "all" && instrument.district !== district) return false;
        if (status !== "all" && instrument.status !== status) return false;
        if (!term) return true;
        const owner = state.owners.find((item) => item.id === instrument.ownerId);
        return [
          instrument.name,
          instrument.serial,
          instrument.manufacturer,
          instrument.model,
          instrument.type,
          instrument.location,
          owner?.organization,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort(
        (a, b) =>
          new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
      );
  }, [state, session, search, district, status]);

  if (!hydrated || !session) return <PortalPageSkeleton />;

  const all = scoped;
  const active = all.filter((item) => item.status === "active").length;
  const underReview = all.filter((item) => item.status === "under_review").length;
  const districts = new Set(all.map((item) => item.district)).size;

  const detailOwner = selected
    ? state.owners.find((owner) => owner.id === selected.ownerId)
    : undefined;
  const detailApplication = selected
    ? findApplicationByInstrument(state, selected.id)
    : undefined;
  const detailCertificate = selected
    ? state.certificates.find((certificate) => certificate.instrumentId === selected.id)
    : undefined;
  const detailEnriched = detailCertificate
    ? enrichCertificate(state, detailCertificate)
    : undefined;

  const filtersActive = search.trim() !== "" || district !== "all" || status !== "all";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Instrument registry"
        title={
          <>
            Instruments <span className="italic text-gold">on file.</span>
          </>
        }
        description={
          session.role === "owner"
            ? "Every measuring instrument registered to your establishment, with its current verification status."
            : "The district's registered measuring instruments, inspection history and certificate coverage."
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/applications">
                <ClipboardCheck className="h-3.5 w-3.5" /> Applications
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/instruments/new">
                <Plus className="h-3.5 w-3.5" /> Register instrument
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Instruments" value={all.length} hint="Scoped to your workspace" icon={Scale} />
        <StatCard
          label="Active"
          value={active}
          hint="Verified and trade-ready"
          icon={BadgeCheck}
          tone="success"
        />
        <StatCard
          label="Under review"
          value={underReview}
          hint="Awaiting first inspection"
          icon={Wrench}
          tone="warning"
        />
        <StatCard
          label="Districts"
          value={districts}
          hint="Jurisdictional spread"
          icon={MapPin}
          tone="info"
        />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, serial, model, manufacturer or holder…"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:w-[360px]">
              <Select value={district} onChange={(event) => setDistrict(event.target.value)}>
                <option value="all">All districts</option>
                {DISTRICTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">All states</option>
                <option value="active">Active</option>
                <option value="under_review">Under review</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              {all.length} instruments · sorted by registration
            </p>
            {filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDistrict("all");
                  setStatus("all");
                }}
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                <SlidersHorizontal className="h-3 w-3" /> Filter by district or state
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-3 font-medium sm:px-6">Instrument</th>
                <th className="px-3 py-3 font-medium">Holder</th>
                <th className="px-3 py-3 font-medium">Location</th>
                <th className="px-3 py-3 font-medium">Registered</th>
                <th className="px-3 py-3 font-medium">State</th>
                <th className="px-5 py-3 text-right font-medium sm:px-6">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {scoped.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <Scale className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <p className="mt-3 text-sm font-medium">No instruments match this view</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {filtersActive
                        ? "Adjust the search or filters to widen the result set."
                        : "Register the first instrument to open a verification application."}
                    </p>
                    <Button asChild size="sm" className="mt-4">
                      <Link href="/instruments/new">
                        <Plus className="h-3.5 w-3.5" /> Register instrument
                      </Link>
                    </Button>
                  </td>
                </tr>
              ) : null}
              {scoped.map((instrument) => {
                const owner = state.owners.find((item) => item.id === instrument.ownerId);
                const certificate = state.certificates.find(
                  (item) => item.instrumentId === instrument.id,
                );
                const enriched = certificate ? enrichCertificate(state, certificate) : null;
                return (
                  <tr
                    key={instrument.id}
                    className="group cursor-pointer border-t border-border/70 transition-colors hover:bg-muted/25"
                    onClick={() => setSelected(instrument)}
                  >
                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-[9px] font-semibold text-muted-foreground">
                          {initials(instrument.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-[11px] font-medium">
                            {instrument.name}
                          </p>
                          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                            {instrument.serial} · {instrument.accuracyClass}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[170px] px-3 py-3.5">
                      <p className="truncate text-[11px]">{owner?.organization ?? "—"}</p>
                      <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                        {owner?.name}
                      </p>
                    </td>
                    <td className="max-w-[180px] px-3 py-3.5">
                      <p className="truncate text-[10px]">{instrument.location}</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        {instrument.district}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-[10px] text-muted-foreground">
                      {formatDate(instrument.registeredAt)}
                    </td>
                    <td className="px-3 py-3.5">
                      <InstrumentStatusBadge status={instrument.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right sm:px-6">
                      {enriched ? (
                        <div className="flex flex-col items-end gap-1">
                          <CertificateStatus state={enriched.state} />
                          <span className="font-mono text-[8px] text-muted-foreground">
                            {enriched.certificate.number}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-xl">
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="gold">Instrument file</Badge>
                  <InstrumentStatusBadge status={selected.status} />
                </div>
                <DialogTitle className="mt-2">{selected.name}</DialogTitle>
                <DialogDescription>
                  {selected.manufacturer} · {selected.model} · serial{" "}
                  <span className="font-mono">{selected.serial}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Detail label="Category" value={selected.category} />
                <Detail label="Accuracy class" value={selected.accuracyClass} />
                <Detail label="Capacity / range" value={selected.capacity} />
                <Detail label="District" value={selected.district} />
                <Detail label="Holder" value={detailOwner?.organization ?? "—"} />
                <Detail label="GSTIN" value={detailOwner?.gstin ?? "—"} mono />
                <Detail label="Location" value={selected.location} />
                <Detail label="Registered" value={formatDate(selected.registeredAt)} />
                <Detail
                  label="Last inspected"
                  value={
                    selected.lastInspectedAt ? formatDate(selected.lastInspectedAt) : "Not yet"
                  }
                />
                <Detail
                  label="Application"
                  value={detailApplication?.number ?? "—"}
                  mono
                />
              </div>

              <Separator />

              {detailEnriched ? (
                <div className="rounded-xl border border-border bg-background/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                        Current certificate
                      </p>
                      <p className="mt-1 font-mono text-xs text-gold">
                        {detailEnriched.certificate.number}
                      </p>
                    </div>
                    <CertificateStatus state={detailEnriched.state} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <p className="text-muted-foreground">
                      Issued {formatDate(detailEnriched.certificate.issuedAt)}
                    </p>
                    <p className="text-right text-muted-foreground">
                      Valid until {formatDate(detailEnriched.certificate.validUntil)}
                    </p>
                  </div>
                  <div className="mt-3">
                    <Button asChild size="sm" className="w-full">
                      <Link
                        href={`/verify?cert=${encodeURIComponent(detailEnriched.certificate.number)}`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Verify sealed certificate
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-center">
                  <CalendarClock className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-2 text-xs font-medium">No certificate issued yet</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {detailApplication
                      ? `Application ${detailApplication.number} is ${detailApplication.status}.`
                      : "A verification application will open on registration."}
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/applications">
                      Track application <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={cn("min-w-0", label === "Location" && "col-span-2")}>
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 break-words text-[11px]", mono && "font-mono")}>{value}</p>
    </div>
  );
}
