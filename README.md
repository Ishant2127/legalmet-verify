<div align="center">

# ⚖️ LegalMet Verify Nexus

**National instrument-trust infrastructure for verification, compliance and inspection.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4-000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.3-087ea4?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![CI](https://img.shields.io/badge/CI-typecheck%20%7C%20lint%20%7C%20build-d9a441?style=flat-square&logo=githubactions)](./.github/workflows/ci.yml)

*A production-shaped rebuild of LegalMet Verify — darker, faster, cryptographically legible.*

[Quick start](#-quick-start) · [Routes](#-route-map) · [Personas](#-demo-personas) · [Architecture](./docs/ARCHITECTURE.md) · [Live data](#-live-supabase-verification)

</div>

---

## Why Nexus

LegalMet Verify Nexus is a full re-imagining of the original portal as a
**trust operating system** for legal metrology:

- **Public verification that proves something.** Every certificate carries a
  deterministic SHA-256 seal over `CERTIFICATE|SERIAL|ISSUED_AT`; the browser
  recomputes it on lookup instead of trusting a badge.
- **Three real workspaces.** Traders register instruments, officers run the
  inspection queue, administrators monitor national compliance and audit
  integrity.
- **A complete lifecycle.** Registration → application → inspection → sealed
  certificate → renewal radar → revocation, with every mutation written to an
  audit stream.
- **Live + demo in one surface.** Known records are queried from the linked
  Supabase project; the full workflow stays explorable offline with a versioned
  local registry.
- **A control room, not a settings page.** `/integrations` reports Supabase
  reachability and latency, probes real certificates, checks environment
  variables and publishes the production migration.
- **An official document, not a screenshot.** Certificates render as a
  double-ruled A4 PDF and a print stylesheet, with QR payloads for offline
  checking.

---

## ✨ Feature tour

### Public desk

| Route | What it does |
| --- | --- |
| `/` | Narrative landing, live registry metrics, verification entry, workflow explainer |
| `/verify` | Demo + live certificate lookup, seal recomputation, QR, print, PDF, share |
| `/login` | One-click personas, optional Supabase email sign-in |

### Trader workspace

| Route | What it does |
| --- | --- |
| `/dashboard` | My instruments, valid certificates, open applications, next expiry |
| `/instruments` | Instrument register with state, district and inspection history |
| `/instruments/new` | LMV-01 form (react-hook-form + Zod) that opens an application |
| `/applications` | Track every submission and its status |
| `/certificates` | Download sealed PDFs, inspect revocation history |

### Officer workspace

| Route | What it does |
| --- | --- |
| `/applications` | Priority queue, approve & issue, schedule inspection, reject |
| `/certificates` | Revoke with a permanently recorded reason, export CSV |
| `/analytics` | District compliance, issuance trend, instrument mix, seal audit |
| `/audit` | Rolling SHA-256 chain, entity/role filters, JSON export |

### Administrator workspace

| Route | What it does |
| --- | --- |
| `/analytics` | National coverage and compliance intelligence |
| `/audit` | Integrity verification across the full event ledger |
| `/integrations` | Supabase/GitHub/VS Code health, live probes, migration, security posture |
| `/settings` | Session, appearance, preferences, snapshot export/reset |

---

## 🧱 Stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16.4** App Router, `proxy.ts`, async cookies |
| UI | **React 19.3**, TypeScript strict |
| Styling | **Tailwind CSS 3.4** with CSS-variable design tokens, dark-first |
| Primitives | **Radix UI** dialog, dropdown, tabs, tooltip, switch, progress |
| Motion | **Motion** for React |
| Charts | **Recharts** |
| Forms | **react-hook-form + Zod** |
| Data | **Supabase** Postgres + RLS, `@supabase/ssr` |
| Documents | **jsPDF**, print CSS |
| QR | **qrcode**, **qrcode.react** |
| Feedback | **Sonner** |
| Icons | **Lucide** |
| CI | **GitHub Actions** |

---

## 🚀 Quick start

```bash
cd legalmet-verify-nextgen
npm install
npm run dev
```

Open **http://localhost:3000**.

Environment is read from `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://szfjkeivaccwmcyelhdv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
DEMO_SESSION_SECRET=replace-with-a-long-random-string
NEXT_PUBLIC_GITHUB_REPO=https://github.com/Ishant2127/legalmet-verify
NEXT_PUBLIC_WORKSPACE_PATH=/absolute/path/to/legalmet-verify-nextgen
```

`DEMO_SESSION_SECRET` is optional locally (a documented fallback is used), but
must be set for any deployed instance.

### Quality gates

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

---

## 🎭 Demo personas

Anonymous Supabase sign-in is disabled on the linked project, so demo access
uses a signed HMAC cookie rather than an email round-trip.

| Persona | Role | Organisation | Entry |
| --- | --- | --- | --- |
| Aarav Mittal | Trader | Mittal Traders & Industries | `/login?persona=owner&next=/dashboard` |
| Insp. R. K. Verma | Officer | North District Metrology Office | `/login?persona=officer&next=/dashboard` |
| Control Room | Admin | National Metrology Command | `/login?persona=admin&next=/dashboard` |

Sessions are `httpOnly`, `sameSite=lax`, valid for 7 days and verified on every
server render.

---

## 🔐 Live Supabase verification

The public desk queries the deployed `verify_certificate(cert_number)` RPC and
normalises legacy rows (missing district, hash or status casing).

| Certificate | Result |
| --- | --- |
| `CERT-2026-001` | Live record |
| `LMV-CERT-2026-0482` | Live record |
| `LMV-CERT-2026-0915` | Live record |
| `LMV-CERT-2026-0101` | Demo record only (no RPC row) |

Try:

```text
/verify?cert=LMV-CERT-2026-0482
/verify?cert=LMV-CERT-2026-0103
```

Endpoints:

- `GET /api/health` — reachability, HTTP status, latency, project ref, row count
- `GET /api/verify?cert=…` — RPC bridge with latency and records
- `POST /api/demo-login` — signed persona cookie
- `POST /api/demo-logout` — expire session

### Production migration (additive)

[`supabase/migrations/20261027_nexus.sql`](./supabase/migrations/20261027_nexus.sql)
adds a dedicated ledger without touching the legacy tables:

- `nexus_certificates` with validity constraints, indexes and RLS
- public `select` grant, **no public write policy**
- `verify_nexus_certificate(text)` security-definer RPC
- `nexus_registry_health()` for probes
- `nexus_public_register` view

Run it once in **Supabase → SQL Editor**, then verify:

```sql
select * from public.verify_nexus_certificate('LMV-CERT-2026-0482');
select public.nexus_registry_health();
```

---

## 🧬 The seal

```text
payload = CERT_NUMBER | SERIAL_NUMBER | ISSUED_AT_ISO
seal    = SHA-256(payload)
```

Implemented with Web Crypto in [`lib/crypto.ts`](./lib/crypto.ts). The digest is
recomputed at verification time and compared with the stored seal. Certificate,
serial or timestamp drift produces a mismatch.

The audit stream goes further and folds events into a rolling root:

```text
digestₙ = SHA-256(digestₙ₋₁ | at | actor | action | entity | entityId | detail)
```

Open `/audit` and run **Verify chain** to recompute it in the browser.

---

## 🗂️ Project structure

```text
legalmet-verify-nextgen/
├── app/
│   ├── (portal)/            dashboard, instruments, applications,
│   │                        certificates, analytics, audit,
│   │                        integrations, settings
│   ├── api/                 health, verify, demo-login, demo-logout
│   ├── login/               personas + optional Supabase auth
│   ├── verify/              public verification desk
│   ├── layout.tsx           fonts, metadata, providers
│   ├── page.tsx             landing
│   └── globals.css          design tokens, print styles
├── components/
│   ├── brand/               wordmark + crest
│   ├── landing/             hero, metrics, workflow
│   ├── portal/              shell, charts, stats, guards, palette
│   ├── ui/                  Radix-based primitives
│   └── verify/              verification client + document
├── lib/
│   ├── registry/            seed, derive, store, live client
│   ├── supabase/            browser + server clients
│   ├── crypto.ts            canonical seal
│   ├── demo-session.ts      HMAC session codec
│   ├── pdf.ts               A4 certificate generator
│   └── types.ts             domain contracts
├── supabase/migrations/     legacy + Nexus SQL
├── .github/workflows/ci.yml
├── .vscode/                 workspace, extensions, debug
├── docs/ARCHITECTURE.md
└── proxy.ts                 Next 16 route protection
```

Full design notes: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## 🎨 Design language

- **Obsidian + brass.** Near-black surfaces, a restrained gold accent, serif
  display type against a technical mono.
- **Government-grade document view.** Double rules, crest watermark, seal panel,
  print stylesheet.
- **Dense, legible operation.** Compact tables, monospace identifiers, explicit
  status pills, no decorative dashboards.
- **Dark-first, light-complete.** Both themes are tokenised; `/settings` switches
  them instantly.
- **Motion with restraint.** Short entrance transitions, no layout thrash.

---

## 🧪 Test matrix

| Flow | Steps |
| --- | --- |
| Live verification | `/verify?cert=LMV-CERT-2026-0482` → seal recomputed, PDF + QR |
| Demo verification | `/verify?cert=LMV-CERT-2026-0103` → valid; `0106` → revoked |
| Registration | Owner → `/instruments/new` → submit → application appears |
| Issuance | Officer → `/applications` → approve → certificate + seal created |
| Revocation | Officer → `/certificates` → revoke with reason → verify shows revoked |
| Audit | `/audit` → verify chain → export JSON |
| Integrations | Admin → `/integrations` → recheck health → probe all |
| Preferences | `/settings` → theme, toggles, export, reset |
| Responsive | 390 px, 768 px, 1280 px; mobile drawer + horizontal tables |

---

## 🚢 Deploy

The repository root **is** the application root, so Vercel needs no custom root
directory.

1. Import `Ishant2127/legalmet-verify` in Vercel. Framework preset: **Next.js**.
2. Add the environment variables below for Production, Preview and Development:

   | Variable | Required | Value |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | yes | `https://szfjkeivaccwmcyelhdv.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Supabase publishable key |
   | `DEMO_SESSION_SECRET` | recommended | long random string |
   | `NEXT_PUBLIC_SITE_URL` | recommended | `https://<project>.vercel.app` |
   | `NEXT_PUBLIC_GITHUB_REPO` | optional | `https://github.com/Ishant2127/legalmet-verify` |

3. Build command `npm run build`, output is auto-detected (`.next`), Node 22.
4. Deploy. The public desk works immediately; `/integrations` confirms the
   ledger is reachable.

`vercel.json` pins the `bom1` (Mumbai) region and baseline security headers.
`NEXT_PUBLIC_SITE_URL` is optional at first deploy: metadata falls back to
`VERCEL_URL` automatically.

> The demo registry is intentionally browser-local. Issuance and revocation do
> not mutate Supabase until the production RPCs are enabled.

---

## 📜 Scope and disclaimer

This is a **demonstration and reference implementation**, not an official
Government of India service. Certificate numbers, organisations and districts
are fictional except for the live records already present in the linked
Supabase project. Legal Metrology Act references are contextual.

The original `legalmet-verify` application is preserved on the `legacy` branch.
`main` now contains the Nexus implementation.

---

<div align="center">

**LegalMet Verify Nexus** · *Trust, measured.*

Directorate of Legal Metrology · Ministry of Consumer Affairs, Food & Public Distribution

</div>
