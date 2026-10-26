"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, Scale, Building2 } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<"owner" | "official">("owner");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            organization: organization,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });

      if (error) throw error;

      // Upsert profile record directly into public.profiles
      if (data?.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          organization: organization,
          role: role,
        });
      }

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[11px] font-mono tracking-widest uppercase font-bold">
              Account Registration
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Create Portal Account
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Select your persona to register for the Legal Metrology System.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-4">
              
              {/* Persona Selector Tabs */}
              <div>
                <Label className="text-xs font-mono uppercase text-zinc-400 block mb-2">
                  Select User Persona *
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("owner")}
                    className={cn(
                      "p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer",
                      role === "owner"
                        ? "bg-black border-amber-400 text-white shadow-sm"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Scale className="w-4 h-4 text-amber-400" />
                      Device Owner
                    </div>
                    <span className="text-[10px] text-zinc-500">Trader / Merchant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("official")}
                    className={cn(
                      "p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer",
                      role === "official"
                        ? "bg-black border-amber-400 text-white shadow-sm"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      Metrology Officer
                    </div>
                    <span className="text-[10px] text-zinc-500">Authorized Inspector</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs font-mono uppercase text-zinc-400">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-white placeholder-zinc-600 focus-visible:ring-amber-500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="org" className="text-xs font-mono uppercase text-zinc-400">
                  Establishment / Department *
                </Label>
                <Input
                  id="org"
                  type="text"
                  placeholder={role === "owner" ? "e.g. Sharma Hardware & Weighbridge" : "e.g. Central Metrology Zone"}
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-white placeholder-zinc-600 focus-visible:ring-amber-500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-mono uppercase text-zinc-400">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-white placeholder-zinc-600 focus-visible:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-xs font-mono uppercase text-zinc-400">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-950 border-zinc-700 text-white focus-visible:ring-amber-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password" className="text-xs font-mono uppercase text-zinc-400">
                    Confirm Password *
                  </Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="bg-zinc-950 border-zinc-700 text-white focus-visible:ring-amber-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-semibold transition mt-2 cursor-pointer" 
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : `Register as ${role === "owner" ? "Device Owner" : "Metrology Officer"}`}
              </Button>
            </div>

            <div className="mt-5 text-center text-xs text-zinc-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-amber-400 hover:underline font-medium">
                Log in here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
