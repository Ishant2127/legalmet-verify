<div align="center">
  <img src="https://img.shields.io/badge/Government_of_India-Legal_Metrology_Division-amber?style=for-the-badge&logo=shield" alt="Legal Metrology Division" />
  <br />
  <br />
  <h1>🏛️ LegalMet Verify</h1>
  <p><strong>National Online Metrology Verification & Cryptographic Registry System</strong></p>
  <p><em>Ministry of Consumer Affairs, Food & Public Distribution • Directorate of Legal Metrology</em></p>

  <p>
    <a href="#key-features"><strong>Features</strong></a> ·
    <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
    <a href="#quick-start"><strong>Quick Start</strong></a> ·
    <a href="#database-setup"><strong>Database Setup</strong></a> ·
    <a href="#multi-persona-workflows"><strong>Workflows</strong></a> ·
    <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a>
  </p>
</div>

---

## 📌 Overview

**LegalMet Verify** is a high-security, tamper-evident digital portal designed to modernize the inspection, approval, and public verification of commercial weighing and measuring instruments across India (Weighbridges, Fuel Dispensers, Precision Balances, and Retail Scales).

Built under the statutory mandate of **Section 24 of the Legal Metrology Act, 2009**, it introduces:
- **Instant Citizen Verification:** Anyone can verify the authenticity of a certified instrument by entering its certificate registration ID or scanning its QR code.
- **SHA-256 Cryptographic Digital Hash:** Tamper-evident seals computed dynamically over device serial numbers, certificate IDs, and issuance timestamps.
- **Role-Based Persona Routing:** Separate authenticated interfaces for Traders/Owners, Legal Metrology Officers (LMOs), and System Administrators.

---

## 🚀 Key Features

* **Public Verification Engine (`/verify`)**
  * Live certificate lookup against the national registry.
  * Interactive preset sample IDs (`LMV-CERT-2026-0101` to `0104`).
  * Double-border official document view with government crest watermark.
  * One-click SHA-256 hash copy and browser print stylesheet (`window.print()`).
* **Commercial Trader Portal (`/owner/dashboard`)**
  * View all declared commercial instruments, calibration state, and compliance certificates.
  * Form LMV-01 for instrument registration and automatic application filing (`/owner/register-instrument`).
* **Official Inspection Desk (`/official/applications`)**
  * Inspection work queue for Legal Metrology Officers.
  * One-click "Approve & Issue Certificate" triggering PostgreSQL RPC procedures.
* **National Portal Landing (`/`)**
  * Pitch-black & amber authoritative aesthetics (`zinc-950`, `amber-400`).
  * Real-time metrics counters for verified devices, digital seals, and jurisdictions.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org) (App Router, Turbopack, TypeScript)
* **Styling & Design System:** [Tailwind CSS](https://tailwindcss.com), [Lucide React](https://lucide.dev)
* **Database & Auth:** [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Auth, RPC Functions)
* **Animation:** [Motion (Framer Motion)](https://motion.dev)

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root of your project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*(Note: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is also supported for backward compatibility).*

---

## 📦 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ishant2127/legalmet-verify.git
   cd legalmet-verify
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase)

To enable the cryptographic verification function and realistic seed data:

1. Open your **Supabase Dashboard** $\rightarrow$ **SQL Editor**.
2. Run the migration script located at [`supabase/migrations/20261026_phase1_architecture.sql`](./supabase/migrations/20261026_phase1_architecture.sql).
3. The script configures:
   * Profile audit columns and RLS policies.
   * `verify_certificate(cert_number)` RPC returning certificate specs and SHA-256 digital signatures.
   * `issue_certificate(app_id)` RPC for officer approvals.
   * Four realistic sample certificates for immediate testing.

---

## 🧪 Test Certificate Registry IDs

You can test the public lookup immediately at `/verify` using any of these preloaded numbers:

| Certificate Number | Instrument Type | Make & Model | District |
|---|---|---|---|
| `LMV-CERT-2026-0101` | Heavy Weighing System | Essae Digitronics (E1200) | North District |
| `LMV-CERT-2026-0102` | Flow Meter / Fuel Dispenser | Gilbarco Veeder-Root (Encore 700 S) | South District |
| `LMV-CERT-2026-0103` | Class I High-Precision Scale | Sartorius AG (Secura 224-1S) | Central District |
| `LMV-CERT-2026-0104` | Counter Retail Scale | METTLER TOLEDO (bRite 100) | East District |

---

## 🚢 Deploy to Vercel

The application is fully optimized for **Vercel** with Turbopack zero-error builds:

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Click **Deploy**.

---

<div align="center">
  <sub>Directorate of Legal Metrology • Ministry of Consumer Affairs, Food & Public Distribution</sub>
</div>
