import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/25 bg-gold/5">
          <BrandMark className="h-10 w-10" />
        </div>
        <p className="eyebrow">Registry error 404</p>
        <h1 className="mt-4 font-display text-5xl tracking-tight">This record is not on file.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The page you requested does not exist in the national registry. Head back to the
          verification desk or return to the public portal.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Public portal
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/verify">
              <Compass className="h-4 w-4" />
              Verify a certificate
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
