"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Fingerprint,
  Info,
  Loader2,
  MapPin,
  Scale,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ACCURACY_CLASSES,
  DISTRICTS,
  INSTRUMENT_CATEGORIES,
  INSTRUMENT_TYPES,
  MEASUREMENT_UNITS,
} from "@/lib/constants";
import { useRegistry } from "@/lib/registry/store";
import { cn } from "@/lib/utils";

const CATEGORY_BY_TYPE: Record<string, string> = {
  Weighbridge: "Heavy Weighing System",
  "Fuel Dispenser": "Flow Meter",
  "Precision Balance": "Weighing Scale",
  "Retail Scale": "Weighing Scale",
  "Flow Meter": "Flow Meter",
  "Taxi Meter": "Measuring Instrument",
  "Clinical Thermometer": "Measuring Instrument",
};

const schema = z.object({
  name: z.string().min(4, "Give the instrument a descriptive name."),
  type: z.string().min(1, "Select an instrument type."),
  category: z.string().min(1, "Select a category."),
  manufacturer: z.string().min(2, "Manufacturer is required."),
  model: z.string().min(1, "Model is required."),
  serial: z
    .string()
    .min(4, "Serial numbers are at least 4 characters.")
    .regex(/^[A-Za-z0-9][A-Za-z0-9/_-]*$/, "Use letters, digits, dashes or slashes only."),
  capacity: z.string().min(1, "Capacity or measuring range is required."),
  measurementUnit: z.string().optional(),
  accuracyClass: z.string().min(1, "Select an accuracy class."),
  location: z.string().min(5, "Describe where the instrument is installed."),
  district: z.string().min(1, "Select a jurisdiction."),
  ownerId: z.string().min(1, "Select the registered holder."),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterInstrumentPage() {
  const router = useRouter();
  const { state, session, hydrated, registerInstrument } = useRegistry();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "Weighbridge",
      category: "Heavy Weighing System",
      manufacturer: "",
      model: "",
      serial: "",
      capacity: "",
      measurementUnit: "",
      accuracyClass: "Class III",
      location: "",
      district: session?.district ?? "North District",
      ownerId: session?.ownerId ?? "own_001",
    },
  });

  const typeValue = watch("type");
  const watched = watch();

  useEffect(() => {
    const nextCategory = CATEGORY_BY_TYPE[typeValue];
    if (nextCategory) setValue("category", nextCategory);
  }, [typeValue, setValue]);

  async function onSubmit(values: FormValues) {
    if (!confirmed) {
      toast.error("Confirm the statutory declaration before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const { application } = registerInstrument(values);
      toast.success("Instrument registered", {
        description: `${application.number} is now in the district verification queue.`,
      });
      router.push("/applications");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not register the instrument.";
      if (message.toLowerCase().includes("serial")) {
        setError("serial", { message });
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated || !session) {
    return (
      <div className="h-96 animate-pulse rounded-2xl border border-border bg-card/50" />
    );
  }

  const isOwner = session.role === "owner";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Form LMV-01"
        title={
          <>
            Register an <span className="italic text-gold">instrument.</span>
          </>
        }
        description="File the instrument's identity, metrological specification and installed location. Submission opens a verification application for the district office."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/instruments">
              <ArrowLeft className="h-3.5 w-3.5" /> Registry
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-start gap-3 border-b border-border pb-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/5 font-mono text-[10px] text-gold">
                01
              </span>
              <div>
                <CardTitle>Instrument identity</CardTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Name, type and make. This is what the public sees on verification.
                </p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
              <Field
                label="Instrument name"
                error={errors.name?.message}
                className="sm:col-span-2"
                hint="e.g. 100-Ton Electronic Pitless Weighbridge"
              >
                <Input
                  {...register("name")}
                  placeholder="100-Ton Electronic Pitless Weighbridge"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field label="Instrument type" error={errors.type?.message}>
                <Select {...register("type")}>
                  {INSTRUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Category" error={errors.category?.message}>
                <Select {...register("category")}>
                  {INSTRUMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Manufacturer" error={errors.manufacturer?.message}>
                <Input
                  {...register("manufacturer")}
                  placeholder="Essae Digitronics"
                  aria-invalid={Boolean(errors.manufacturer)}
                />
              </Field>
              <Field label="Model number" error={errors.model?.message}>
                <Input
                  {...register("model")}
                  placeholder="E1200"
                  aria-invalid={Boolean(errors.model)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start gap-3 border-b border-border pb-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/5 font-mono text-[10px] text-gold">
                02
              </span>
              <div>
                <CardTitle>Metrological specification</CardTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Traceability details used during inspection and seal computation.
                </p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-5 sm:grid-cols-3">
              <Field
                label="Serial number"
                error={errors.serial?.message}
                className="sm:col-span-1"
                hint="Unique across the registry"
              >
                <Input
                  {...register("serial")}
                  placeholder="WB-2026-9901"
                  className="font-mono uppercase"
                  aria-invalid={Boolean(errors.serial)}
                />
              </Field>
              <Field label="Capacity / range" error={errors.capacity?.message}>
                <Input
                  {...register("capacity")}
                  placeholder="100 t or 220 g"
                  aria-invalid={Boolean(errors.capacity)}
                />
              </Field>
              <Field
                label="Measurement unit"
                hint="Unit the machine measures in"
              >
                <Select {...register("measurementUnit")}>
                  <option value="">— Select unit —</option>
                  {MEASUREMENT_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Accuracy class" error={errors.accuracyClass?.message}>
                <Select {...register("accuracyClass")}>
                  {ACCURACY_CLASSES.map((accuracy) => (
                    <option key={accuracy} value={accuracy}>
                      {accuracy}
                    </option>
                  ))}
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start gap-3 border-b border-border pb-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/5 font-mono text-[10px] text-gold">
                03
              </span>
              <div>
                <CardTitle>Installed location & holder</CardTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Determines the inspecting jurisdiction and the public certificate record.
                </p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
              <Field
                label="Installed address / site"
                error={errors.location?.message}
                className="sm:col-span-2"
              >
                <Input
                  {...register("location")}
                  placeholder="Mittal Logistics Yard, Gate 3"
                  aria-invalid={Boolean(errors.location)}
                />
              </Field>
              <Field label="District / jurisdiction" error={errors.district?.message}>
                <Select {...register("district")}>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Registered holder" error={errors.ownerId?.message}>
                {isOwner ? (
                  <>
                    <Input
                      value={session.organization}
                      readOnly
                      className="bg-muted/40 text-muted-foreground"
                    />
                    <input type="hidden" {...register("ownerId")} />
                  </>
                ) : (
                  <Select {...register("ownerId")}>
                    {state.owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.organization}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--gold))]"
                />
                <span className="text-[11px] leading-relaxed text-muted-foreground">
                  I declare that the information submitted is true and that the instrument
                  is available for inspection. I understand that a false declaration is
                  punishable under the{" "}
                  <span className="text-foreground">Legal Metrology Act, 2009</span>.
                </span>
              </label>

              <Separator />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-gold" />
                  Signed as {session.name}
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/instruments">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={submitting || !confirmed} size="sm">
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ClipboardCheck className="h-3.5 w-3.5" />
                    )}
                    Submit LMV-01
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gold-radial blur-2xl" />
            <div className="relative flex items-center justify-between">
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                Live instrument file
              </p>
              <Badge variant="outline" dot>
                draft
              </Badge>
            </div>
            <div className="relative mt-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/5 text-gold">
                <Scale className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                  {watched.name || "Untitled measuring instrument"}
                </p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  {watched.serial || "SERIAL-PENDING"}
                </p>
              </div>
            </div>

            <dl className="relative mt-4 space-y-2 border-t border-border pt-3 text-[10px]">
              <PreviewRow label="Type" value={watched.type || "—"} />
              <PreviewRow label="Category" value={watched.category || "—"} />
              <PreviewRow
                label="Make / model"
                value={[watched.manufacturer, watched.model].filter(Boolean).join(" · ") || "—"}
              />
              <PreviewRow label="Capacity" value={watched.capacity || "—"} />
              <PreviewRow label="Measurement unit" value={watched.measurementUnit || "—"} />
              <PreviewRow label="Accuracy" value={watched.accuracyClass || "—"} />
              <PreviewRow label="District" value={watched.district || "—"} />
            </dl>

            <div className="relative mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border bg-background/50 px-3 py-2">
              <Fingerprint className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-muted-foreground">
                seal generated on issuance
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                What happens next
              </p>
              {[
                {
                  icon: ClipboardCheck,
                  title: "Application opens",
                  body: "An LMV-APP number is created and queued by priority.",
                },
                {
                  icon: MapPin,
                  title: "Inspection scheduled",
                  body: "The district office assigns a field visit.",
                },
                {
                  icon: BadgeCheck,
                  title: "Certificate sealed",
                  body: "On approval, a SHA-256 seal and QR are issued.",
                },
              ].map((step, index) => (
                <div key={step.title} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 font-mono text-[8px] text-muted-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[11px] font-medium">{step.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
            <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-gold">
              <Sparkles className="h-3 w-3" /> Demo persistence
            </p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
              This submission is stored in your browser registry snapshot. Switch personas
              to review it from the officer desk.
            </p>
            <div className="mt-2 flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
              <Building2 className="h-3 w-3" /> {session.organization}
              <ArrowRight className="h-3 w-3" />
              <Wrench className="h-3 w-3" /> {session.district}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[10px] text-danger">
          <Info className="h-2.5 w-2.5" /> {error}
        </p>
      ) : hint ? (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="max-w-[65%] truncate text-right">{value}</dd>
    </div>
  );
}
