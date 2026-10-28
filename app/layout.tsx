import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono, Manrope } from "next/font/google";
import { cookies } from "next/headers";
import { AppProviders } from "@/components/providers/app-providers";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/demo-session";
import { APP_NAME, GITHUB_REPO, MINISTRY, ORG } from "@/lib/constants";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} — Trust, measured.`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "A national instrument-trust infrastructure for public certificate verification, trader compliance, officer inspections and tamper-evident digital seals.",
  applicationName: APP_NAME,
  authors: [{ name: ORG }],
  creator: ORG,
  publisher: MINISTRY,
  keywords: [
    "legal metrology",
    "instrument verification",
    "certificate registry",
    "weighbridge",
    "fuel dispenser",
    "tamper evident",
    "Government of India",
    "Supabase",
    "Next.js",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: APP_NAME,
    title: `${APP_NAME} — Trust, measured.`,
    description:
      "Verify a legal-metrology certificate in seconds. Tamper-evident seals, QR verification and national compliance intelligence.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Trust, measured.`,
    description:
      "National instrument trust infrastructure for verification, compliance and inspection.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  other: {
    "github-repository": GITHUB_REPO,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090a" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const session = await verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);

  return (
    <html lang="en-IN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} min-h-svh app-shell-bg font-sans antialiased`}
      >
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
