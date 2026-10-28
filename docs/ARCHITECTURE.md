# LegalMet Verify Nexus — Architecture

> A production-shaped reference implementation of a national instrument-trust
> platform: public certificate verification, trader self-service, officer
> inspection workflow, cryptographic seals, analytics and an immutable audit
> stream.

---

## 1. System context

```text
 Citizen / Trader / Officer / Auditor
                 │
                 ▼
 ┌──────────────────────────────────────────────────────────────┐
 │  Next.js 16 App Router (React 19, TypeScript, Tailwind 3.4)  │
 │                                                              │
 │  Public surface            Workspace (portal)                │
 │  ├── /                     ├── /dashboard                    │
 │  ├── /verify               ├── /instruments (+ /new)         │
 │  └── /login                ├── /applications                 │
 │                            ├── /certificates                 │
 │                            ├── /analytics                    │
 │                            ├── /audit                        │
 │                            ├── /integrations                 │
 │                            └── /settings                     │
 │                                                              │
 │  Route handlers                                              │
 │  ├── GET  /api/health        infrastructure probe            │
 │  ├── GET  /api/verify        live certificate RPC bridge     │
 │  ├── POST /api/demo-login    signed persona cookie           │
 │  └── POST /api/demo-logout   cookie expiry                   │
 └───────────────┬───────────────────────────┬──────────────────┘
                 │                           │
                 ▼                           ▼
      Browser localStorage          Supabase (Postgres + RLS)
      demo registry snapshot        ├── certificates (legacy)
      + preferences                 ├── verify_certificate() RPC
                                    ├── nexus_certificates
                                    ├── verify_nexus_certificate()
                                    └── nexus_registry_health()
```

The application is **demo-first and live-ready**:

- The complete lifecycle (registration → inspection → issuance → revocation)
  runs against a deterministic, browser-persisted demo registry, so the app is
  fully explorable without credentials.
- The public verification desk additionally queries the deployed Supabase
  project for real certificate rows, normalises the legacy payload and
  recomputes the seal locally.

---

## 2. Runtime topology

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16 App Router | Server Components for auth + metadata, Client Components for interactive state |
| UI runtime | React 19 | `use client` islands, no global store library |
| Language | TypeScript (strict) | `tsc --noEmit` is a CI gate |
| Styling | Tailwind CSS 3.4 + CSS custom properties | Dark-first tokens, light theme via `next-themes` |
| Components | Radix UI primitives | Dialog, Dropdown, Tabs, Tooltip, Switch, Progress, Separator |
| Motion | Motion for React | Respectful, short-duration entrance transitions |
| Charts | Recharts | Issuance trend, district compliance, instrument mix |
| Forms | react-hook-form + Zod | LMV-01 registration validation |
| PDF | jsPDF | Client-side A4 certificate, no server upload |
| QR | qrcode / qrcode.react | Offline verification payload |
| Data (demo) | `localStorage` | Versioned registry snapshot |
| Data (live) | Supabase Postgres + RLS | Publishable key only |
| Auth | Signed HMAC demo cookie | Optional Supabase email auth on `/login` |
| CI | GitHub Actions | install → typecheck → lint → build |

---

## 3. Route and rendering map

### Public routes

| Route | Rendering | Responsibility |
| --- | --- | --- |
| `/` | Server + client islands | Product narrative, live registry metrics, verification entry point |
| `/verify` | Client | Demo lookup, live Supabase lookup, seal recomputation, PDF/print/QR |
| `/login` | Server shell + client form | One-click personas, optional Supabase email flow |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` | Metadata routes | Crawl + install metadata |
| `/icon.svg` | Static asset | App icon |

### Workspace routes (`app/(portal)`)

`app/(portal)/layout.tsx` reads the session cookie on the server. If the cookie
is absent or the HMAC is invalid, it redirects to `/login?next=/dashboard`.
The layout then renders `PortalShell` with the verified session.

| Route | Roles | Purpose |
| --- | --- | --- |
| `/dashboard` | all | Role-aware KPIs, issuance trend, compliance, queue, renewal radar, audit stream |
| `/instruments` | all | Instrument register, filters, detail sheet |
| `/instruments/new` | all | LMV-01 registration form → application |
| `/applications` | all | Owner tracking; officer approve / schedule / reject |
| `/certificates` | all | Register, revocation, CSV export, PDF download |
| `/analytics` | officer, admin | District compliance, trend analysis, seal-integrity audit |
| `/audit` | officer, admin | Rolling SHA-256 chain, filters, JSON export |
| `/integrations` | officer, admin | Supabase/GitHub/VS Code health, probes, migration, security posture |
| `/settings` | all | Session, appearance, preferences, snapshot reset/export, API surface |

`RoleGuard` renders a restricted-area panel rather than crashing when a role
lacks access. Navigation items are filtered in the shell with the same role map
(`NAV_SECTIONS` in `lib/constants.ts`).

---

## 4. Authentication and session model

### Demo personas (primary path)

Anonymous Supabase sign-in is disabled on the linked project, so demo access
does **not** depend on email confirmation. Instead:

1. `POST /api/demo-login` validates the requested persona (`owner`, `officer`,
   `admin`).
2. `personaSession(role)` builds a `Session` object from `DEMO_PERSONAS`.
3. `signSession()` creates `base64url(payload) + "." + base64url(HMAC-SHA256)`.
4. The token is written to an **httpOnly, sameSite=lax** cookie
   (`lmv_nexus_session`) with a 7-day TTL.
5. Every server render verifies the HMAC and TTL before trusting the payload.

The signing secret comes from `DEMO_SESSION_SECRET`. A documented fallback
keeps local development frictionless; production deployments must set a strong
secret.

### Optional Supabase email auth

`/login` can also call `supabase.auth.signInWithPassword()` and
`signUp()`. If the project requires email confirmation or RLS blocks profile
reads, the UI degrades gracefully and the persona path remains available.
No service-role key is ever shipped to the client.

### Authorisation

Authorisation is enforced twice:

- **UI**: `RoleGuard`, filtered navigation, hidden officer-only actions.
- **Domain**: store actions (`approveApplication`, `requestInspection`,
  `rejectApplication`, `revokeCertificate`) throw when the session role is
  `owner` or missing.

This is appropriate for a demo. A production deployment would move these
mutations behind Supabase RLS + security-definer RPCs, as sketched in
`supabase/migrations/20261027_nexus.sql`.

---

## 5. Data model (demo registry)

`lib/types.ts` defines the canonical entities. `lib/registry/seed.ts` builds a
deterministic snapshot with relative dates so the demo never goes stale.

```text
Owner 1 ─── n Instrument 1 ─── n Application 1 ─── 0..1 Certificate
   │                              │
   └────────────── n ─────────────┘

AuditEvent n ── references any entity by id
RegistryState = { owners, instruments, applications, certificates, audit }
```

Seed scale:

- 7 owners across 5 districts
- 12 instruments (weighbridges, dispensers, balances, scales, meters)
- 12 applications across pending / inspection / approved / rejected
- 8 certificates spanning valid / expiring / expired / revoked
- 28 audit events

### Persistence strategy

`RegistryProvider` (`lib/registry/store.tsx`):

1. Initialises from `createSeedState()` so server and first client render match.
2. On mount, hydrates from `localStorage["lmv-nexus-registry-v2"]` when the
   snapshot version matches.
3. Persists every subsequent state change.
4. Backfills missing certificate seals asynchronously with Web Crypto.
5. Keeps the in-memory registry working if storage is unavailable.

All writes create audit events. `recordVerification()` de-duplicates consecutive
identical public lookups and caps the stream at 120 events to keep storage
bounded.

---

## 6. Cryptographic seal

`lib/crypto.ts`:

```text
payload = CERTIFICATE_NUMBER | SERIAL_NUMBER | ISSUED_AT_ISO
seal    = SHA-256(UTF-8(payload)) → lowercase hex
```

- Numbers and serials are trimmed and upper-cased.
- `issuedAt` is normalised with `new Date(...).toISOString()`.
- The browser recomputes the digest during verification and compares it with
  the stored seal.
- Any drift in the three source fields changes the digest, exposing tampering.

The live Supabase path uses the same algorithm over the RPC row. If the legacy
row has no `digital_hash`, the client computes one; if it does, the RPC value is
displayed and the recomputation establishes `hashValid`.

### Audit chain

`/audit` folds events in ascending time order:

```text
digest₀ = "GENESIS"
digestₙ = SHA-256(digestₙ₋₁ | at | actor | action | entity | entityId | detail)
```

The resulting root is a compact integrity fingerprint for the whole local
history and can be exported with the event list.

---

## 7. Live Supabase verification

`lib/registry/live.ts` and `app/api/verify/route.ts` both use the deployed
`verify_certificate(cert_number)` RPC.

Legacy rows may omit `digital_hash`, `district` and `owner_organization`, and
may use status strings such as `"Valid"`. `mapRow()` normalises:

- status → upper-case
- missing instrument/owner fields → explicit fallbacks
- missing district → `Central District`
- missing hash → locally recomputed SHA-256

Known live records verified against the project:

| Certificate | RPC result |
| --- | --- |
| `CERT-2026-001` | found |
| `LMV-CERT-2026-0482` | found |
| `LMV-CERT-2026-0915` | found |
| `LMV-CERT-2026-0101` | no rows (demo-only record) |

`/integrations` exposes a probe table for these presets and reports latency,
row count and HTTP status. `/api/health` performs a lightweight
`certificates?select=certificate_number` request to prove reachability without
requiring elevated credentials.

The additive migration adds a cleaner target for future writes:

- `nexus_certificates` with constraints, indexes and RLS
- `verify_nexus_certificate(text)` security-definer RPC
- `nexus_registry_health()` for probes
- `nexus_public_register` view
- public read grant, no public mutation policy

---

## 8. Security posture

| Concern | Control |
| --- | --- |
| Session forgery | HMAC-SHA256 over a base64url payload, verified server-side |
| Session theft | `httpOnly`, `sameSite=lax`, `secure` in production, 7-day TTL |
| Role escalation | Role is inside the signed payload; domain actions re-check it |
| Secret exposure | Only `NEXT_PUBLIC_*` values reach the browser; no service-role key |
| Data mutation | Demo writes stay local; live ledger has no anon write policy |
| Certificate tampering | Deterministic SHA-256 seal recomputed at verification |
| XSS surface | React escaping, no `dangerouslySetInnerHTML` in user-facing views |
| PDF privacy | Certificates are generated in the browser with jsPDF |
| Storage abuse | Audit stream capped, corrupt snapshots ignored safely |

Production hardening checklist:

1. Set a long random `DEMO_SESSION_SECRET`.
2. Replace demo cookie auth with Supabase Auth + RLS.
3. Move issuance/revocation into security-definer RPCs with officer claims.
4. Add rate limiting to `/api/verify` and `/api/demo-login`.
5. Add signed, time-boxed QR payloads rather than raw certificate numbers.
6. Enable Supabase audit logging and point `/audit` at the server stream.

---

## 9. Performance and UX

- Server Components handle auth, metadata and static shells; interactive pages
  are explicit client islands.
- Charts are isolated in `components/portal/charts.tsx`; heavy pages load
  skeletons (`PortalPageSkeleton`) until hydration.
- `useMemo` scopes derived registries and metrics; no global recomputation on
  unrelated renders.
- PDF and QR generation are lazy, client-side and user-triggered.
- Typography uses `next/font` (Manrope, Instrument Serif, JetBrains Mono) with
  `display: swap`.
- Dark and light tokens are CSS variables, so theme switching does not
  re-render the tree.
- Print CSS produces an official A4 document from `/verify`.
- Responsive breakpoints cover mobile navigation, horizontal table scroll and
  stacked analytics.

---

## 10. Observability and operations

| Surface | Signal |
| --- | --- |
| `/api/health` | Supabase reachability, HTTP status, latency, project ref, row count, Node version |
| `/integrations` | Per-integration status pills, live probe table, environment checklist |
| `/audit` | Domain event stream + rolling SHA-256 root |
| `/settings` | Session lifetime, device, persistence keys, snapshot export/reset |
| CI | Typecheck, lint and production build on every push/PR |

Health responses are `no-store`. The endpoint never returns keys or connection
strings, only the project ref and counts.

---

## 11. File map

```text
app/
  (portal)/
    layout.tsx               server-side session gate
    dashboard/page.tsx       role-aware overview
    instruments/…            register + detail
    applications/page.tsx    officer workflow
    certificates/page.tsx    register, revoke, export
    analytics/page.tsx       compliance intelligence
    audit/page.tsx           hash-chained event stream
    integrations/page.tsx    infrastructure control room
    settings/page.tsx        account + preferences
  api/
    health/route.ts          reachability probe
    verify/route.ts          live RPC bridge
    demo-login/route.ts      signed persona cookie
    demo-logout/route.ts     cookie expiry
  layout.tsx                 fonts, metadata, providers
  page.tsx                   public landing
  verify/page.tsx            public verification desk
  login/page.tsx             persona + email auth
components/
  brand/                     wordmark and crest
  landing/                   hero, metrics, workflow, footer
  portal/                    shell, charts, stats, guards, palette
  ui/                        Radix-based primitives
  verify/                    verification client + document
lib/
  crypto.ts                  canonical payload + SHA-256
  demo-session.ts            HMAC session codec
  registry/                  seed, derive, store, live client
  supabase/                  browser + server clients
  types.ts                   domain contracts
supabase/migrations/         additive SQL for the live ledger
proxy.ts                     Next 16 request proxy
```

---

## 12. Extension points

- **Real officer accounts** — map Supabase `profiles.role` into `Session` via
  `sessionFromSupabase()`, then replace the demo cookie route.
- **Server-issued certificates** — call a security-definer
  `nexus_issue_certificate(app_id)` and return the sealed row.
- **Offline verification** — encode `{ cert, serial, issuedAt, seal }` in the QR
  payload and verify the signature without a network round-trip.
- **Notifications** — subscribe to `valid_until` windows with a scheduled
  Supabase Edge Function.
- **Multi-tenant jurisdictions** — scope every derive function by district or
  office id; the UI already routes on `session.district`.

---

## 13. Local development

```bash
cd legalmet-verify-nextgen
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev                  # http://localhost:3000
```

Quality gates:

```bash
npm run typecheck
npm run lint
npm run build
```

Demo personas are available directly at:

- `/login?persona=owner&next=/dashboard`
- `/login?persona=officer&next=/dashboard`
- `/login?persona=admin&next=/dashboard`

Public verification examples:

- Live: `/verify?cert=LMV-CERT-2026-0482`
- Demo: `/verify?cert=LMV-CERT-2026-0103`
- Missing: `/verify?cert=LMV-CERT-2026-9999`
