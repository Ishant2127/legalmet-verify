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
import { Building2, Scale, ShieldCheck } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Check user role from profiles to route immediately
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const role = profile?.role;
        if (role === "official" || role === "admin") {
          router.push("/official/applications");
        } else {
          router.push("/owner/dashboard");
        }
      } else {
        router.push("/protected");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during authentication");
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
              National Metrology Auth
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Portal Login
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Sign in as a Commercial Device Owner (Trader) or Legal Metrology Officer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-mono uppercase text-zinc-400">
                  Registered Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="officer@metrology.gov.in or trader@store.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-white placeholder-zinc-600 focus-visible:ring-amber-500"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-mono uppercase text-zinc-400">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-amber-400/80 hover:text-amber-300 underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-white focus-visible:ring-amber-500"
                />
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
                {isLoading ? "Authenticating..." : "Sign In to Portal"}
              </Button>
            </div>

            <div className="mt-5 text-center text-xs text-zinc-400">
              Need a registered account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-amber-400 hover:underline font-medium"
              >
                Create Account (Select Role)
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
