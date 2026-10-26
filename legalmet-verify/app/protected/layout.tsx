import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Wordmark />

          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link
              href="/protected"
              className="font-medium hover:text-primary"
            >
              Dashboard
            </Link>

            <Link
              href="/verify"
              className="font-medium hover:text-primary"
            >
              Verify certificate
            </Link>

            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>

      <footer className="border-t px-6 py-5 text-center text-sm text-muted-foreground">
        LegalMet Verify · Online Verification System for Weights and Measures
      </footer>
    </div>
  );
}