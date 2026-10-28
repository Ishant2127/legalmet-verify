import type { CertificateState, Role } from "@/lib/types";

export const APP_NAME = "LegalMet Verify Nexus";
export const APP_SHORT = "LegalMet Nexus";
export const ORG = "Directorate of Legal Metrology";
export const MINISTRY = "Ministry of Consumer Affairs, Food & Public Distribution";
export const GOV = "Government of India";
export const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO ?? "https://github.com/Ishant2127/legalmet-verify";

export const DISTRICTS = [
  "North District",
  "South District",
  "East District",
  "West District",
  "Central District",
] as const;

export const INSTRUMENT_TYPES = [
  "Weighbridge",
  "Fuel Dispenser",
  "Precision Balance",
  "Retail Scale",
  "Flow Meter",
  "Taxi Meter",
  "Clinical Thermometer",
] as const;

export const INSTRUMENT_CATEGORIES = [
  "Heavy Weighing System",
  "Weighing Scale",
  "Flow Meter",
  "Measuring Instrument",
] as const;

export const ACCURACY_CLASSES = [
  "Class I",
  "Class II",
  "Class III",
  "Class IIII",
  "Class 0.2",
  "Class 0.5",
  "Class 0.05",
] as const;

export const MEASUREMENT_UNITS = [
  { value: "kg", label: "Kilograms (kg)", category: "Mass / Weight" },
  { value: "lbs", label: "Pounds (lbs)", category: "Mass / Weight" },
  { value: "g", label: "Grams (g)", category: "Mass / Weight" },
  { value: "mg", label: "Milligrams (mg)", category: "Mass / Weight" },
  { value: "t", label: "Metric Tonnes (t)", category: "Mass / Weight" },
  { value: "oz", label: "Ounces (oz)", category: "Mass / Weight" },
  { value: "L", label: "Litres (L)", category: "Volume / Flow" },
  { value: "L/min", label: "Litres per minute (L/min)", category: "Volume / Flow" },
  { value: "mL", label: "Millilitres (mL)", category: "Volume / Flow" },
  { value: "gal", label: "Gallons (gal)", category: "Volume / Flow" },
  { value: "m3/h", label: "Cubic metres per hour (m³/h)", category: "Volume / Flow" },
  { value: "t/h", label: "Tonnes per hour (t/h)", category: "Mass Flow" },
  { value: "m", label: "Metres (m)", category: "Length / Distance" },
  { value: "km", label: "Kilometres (km)", category: "Length / Distance" },
  { value: "degC", label: "Degree Celsius (°C)", category: "Temperature" },
] as const;

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Traders & Owners",
  officer: "Legal Metrology Officers",
  admin: "System Administrators",
};

export const ROLE_SHORT: Record<Role, string> = {
  owner: "Owner",
  officer: "Officer",
  admin: "Admin",
};

type StatusTone = {
  label: string;
  className: string;
  dot: string;
};

export const CERTIFICATE_STATUS_META: Record<CertificateState, StatusTone> = {
  valid: {
    label: "Valid",
    className: "border-success/25 bg-success-soft text-success",
    dot: "bg-success",
  },
  expiring: {
    label: "Expiring soon",
    className: "border-warning/25 bg-warning-soft text-warning",
    dot: "bg-warning",
  },
  expired: {
    label: "Expired",
    className: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  revoked: {
    label: "Revoked",
    className: "border-danger/25 bg-danger-soft text-danger",
    dot: "bg-danger",
  },
};

export const APPLICATION_STATUS_META: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending review",
    className: "border-warning/25 bg-warning-soft text-warning",
    dot: "bg-warning",
  },
  inspection: {
    label: "Inspection scheduled",
    className: "border-info/25 bg-info-soft text-info",
    dot: "bg-info",
  },
  approved: {
    label: "Approved",
    className: "border-success/25 bg-success-soft text-success",
    dot: "bg-success",
  },
  rejected: {
    label: "Rejected",
    className: "border-danger/25 bg-danger-soft text-danger",
    dot: "bg-danger",
  },
};

export const DEMO_PERSONAS: Array<{
  role: Role;
  name: string;
  email: string;
  organization: string;
  district: string;
  badgeId?: string;
  ownerId?: string;
  description: string;
  capabilities: string[];
}> = [
  {
    role: "owner",
    name: "Aarav Mittal",
    email: "aarav@mittaltraders.in",
    organization: "Mittal Traders & Industries",
    district: "North District",
    ownerId: "own_001",
    description: "Commercial trader workspace for instruments, applications and certificates.",
    capabilities: ["Register instruments", "Track inspections", "Download certificates"],
  },
  {
    role: "officer",
    name: "Insp. R. K. Verma",
    email: "r.verma@metrology.gov.in",
    organization: "North District Metrology Office",
    district: "North District",
    badgeId: "LMO-ND-0412",
    description: "Inspection desk for the regional verification queue and certificate issuance.",
    capabilities: ["Review applications", "Schedule inspections", "Issue certificates"],
  },
  {
    role: "admin",
    name: "Control Room",
    email: "control@metrology.gov.in",
    organization: "National Metrology Command",
    district: "Central District",
    badgeId: "ADM-CENTRAL-001",
    description: "National command centre with analytics, audit trail and integrations.",
    capabilities: ["National analytics", "Audit trail", "Integration health"],
  },
];

export const DEMO_CERTIFICATES = [
  "LMV-CERT-2026-0101",
  "LMV-CERT-2026-0102",
  "LMV-CERT-2026-0103",
  "LMV-CERT-2026-0482",
  "CERT-2026-001",
] as const;

export const NAV_SECTIONS: Array<{
  label: string;
  items: Array<{
    href: string;
    label: string;
    icon: string;
    roles: Role[];
    badge?: "pending" | "expiring";
  }>;
}> = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Overview", icon: "LayoutDashboard", roles: ["owner", "officer", "admin"] },
      { href: "/instruments", label: "Instruments", icon: "Scale", roles: ["owner", "officer", "admin"] },
      { href: "/applications", label: "Applications", icon: "ClipboardCheck", roles: ["owner", "officer", "admin"], badge: "pending" },
      { href: "/certificates", label: "Certificates", icon: "BadgeCheck", roles: ["owner", "officer", "admin"], badge: "expiring" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/analytics", label: "Analytics", icon: "ChartNoAxesCombined", roles: ["officer", "admin"] },
      { href: "/audit", label: "Audit trail", icon: "ScrollText", roles: ["officer", "admin"] },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/integrations", label: "Integrations", icon: "PlugZap", roles: ["admin"] },
      { href: "/settings", label: "Settings", icon: "Settings", roles: ["owner", "officer", "admin"] },
    ],
  },
];

export const LIVE_REGISTRY_PRESETS = [
  "CERT-2026-001",
  "LMV-CERT-2026-0482",
  "LMV-CERT-2026-0915",
] as const;
