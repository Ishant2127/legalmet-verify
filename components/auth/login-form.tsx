"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_PERSONAS, ROLE_LABEL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_ICONS = {
  owner: Building2,
  officer: ShieldCheck,
  admin: UserCog,
} as const;

const ROLE_TONE = {
  owner: "border-gold/25 bg-gold/5 text-gold",
  officer: "border-info/25 bg-info-soft text-info",
  admin: "border-success/25 bg-success-soft text-success",
} as const;

export function LoginForm({
  initialPersona,
  next,
}: {
  initialPersona?: Role;
  next: string;
}) {
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<Role | null>(initialPersona ?? null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  async function enterPersona(persona: Role) {
    setPendingRole(persona);
    try {
      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      if (!response.ok) throw new Error("Could not create the demo session.");
      const data = (await response.json()) as { session?: { name: string } };
      toast.success(`Signed in as ${data.session?.name ?? ROLE_LABEL[persona]}`);
      router.replace(next);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed.");
      setPendingRole(null);
    }
  }

  useEffect(() => {
    if (!initialPersona || autoStarted.current) return;
    autoStarted.current = true;
    void enterPersona(initialPersona);
    // The persona is intentionally read once from the server-rendered URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPersona]);

  async function submitCredentials(event: React.FormEvent) {
    event.preventDefault();
    setAuthError(null);
    setAuthPending(true);

    try {
      const supabase = createClient();
      const { data, error } =
        authMode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (error) {
        setAuthError(error.message);
        return;
      }

      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabase: {
            role: role === "officer" ? "official" : role,
            email,
            name:
              (data.user?.user_metadata?.full_name as string | undefined) ??
              email.split("@")[0],
            organization:
              (data.user?.user_metadata?.organization as string | undefined) ??
              (role === "owner"
                ? "Registered Trade Establishment"
                : role === "officer"
                  ? "District Metrology Office"
                  : "National Metrology Command"),
            district: "Central District",
          },
        }),
      });
      if (!response.ok) throw new Error("Could not establish the workspace session.");
      toast.success(
        authMode === "signin" ? "Signed in with Supabase" : "Account created",
        { description: "Your workspace session is ready." },
      );
      router.replace(next);
      router.refresh();
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Supabase authentication is unavailable on this project.",
      );
    } finally {
      setAuthPending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <p className="eyebrow">Secure workspace access</p>
        <h1 className="mt-3 font-display text-4xl leading-none tracking-tight">
          Enter the <span className="italic text-gold">registry.</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Choose a demonstration persona for the full experience, or sign in with a
          Supabase identity.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <Tabs defaultValue="persona">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="persona">
              <Sparkles className="h-3.5 w-3.5" /> Demo personas
            </TabsTrigger>
            <TabsTrigger value="auth">
              <KeyRound className="h-3.5 w-3.5" /> Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="persona" className="space-y-2">
            {DEMO_PERSONAS.map((persona) => {
              const Icon = ROLE_ICONS[persona.role];
              const active = pendingRole === persona.role;
              return (
                <button
                  key={persona.role}
                  type="button"
                  disabled={pendingRole !== null}
                  onClick={() => void enterPersona(persona.role)}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-xl border border-border bg-background/40 p-3 text-left transition-all hover:border-gold/40 hover:bg-muted/40 disabled:opacity-60",
                    active && "border-gold/50 bg-gold/5",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                      ROLE_TONE[persona.role],
                    )}
                  >
                    {active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{persona.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {persona.organization}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {persona.capabilities.slice(0, 2).map((capability) => (
                        <span
                          key={capability}
                          className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground"
                        >
                          <Check className="h-2.5 w-2.5 text-success" /> {capability}
                        </span>
                      ))}
                    </span>
                  </span>
                </button>
              );
            })}
            <p className="flex items-start gap-2 rounded-lg border border-info/20 bg-info-soft px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
              <Fingerprint className="mt-0.5 h-3 w-3 shrink-0 text-info" />
              Demo sessions are HMAC-signed, HTTP-only cookies. Registry mutations live in
              a local snapshot and can be reset from Settings.
            </p>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <form onSubmit={submitCredentials} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Official email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@organisation.in"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={
                      authMode === "signin" ? "current-password" : "new-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Workspace role</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["owner", "officer", "admin"] as Role[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRole(item)}
                      className={cn(
                        "rounded-lg border px-2 py-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
                        role === item
                          ? "border-gold/40 bg-gold/10 text-gold"
                          : "border-border bg-background/40 text-muted-foreground hover:border-gold/25",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {authError ? (
                <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-[10px] leading-relaxed text-warning">
                  <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    {authError}
                    <span className="mt-0.5 block text-muted-foreground">
                      Supabase email auth may require confirmation, or be disabled on this
                      project. Use a demo persona to explore immediately.
                    </span>
                  </span>
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={authPending}>
                {authPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LockKeyhole className="h-4 w-4" />
                )}
                {authMode === "signin" ? "Sign in with Supabase" : "Create account"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {authMode === "signin" ? "New to the registry?" : "Already registered?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "signin" ? "signup" : "signin");
                  setAuthError(null);
                }}
                className="font-medium text-gold hover:underline"
              >
                {authMode === "signin" ? "Create an account" : "Sign in instead"}
              </button>
            </div>

            <p className="flex items-start gap-1.5 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
              Authentication is handled by Supabase Auth. The workspace layer issues a
              separate signed session cookie scoped to this domain.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-gold">
          <ArrowRight className="h-3 w-3 rotate-180" /> Back to public site
        </Link>
        <Link
          href="/verify"
          className="inline-flex items-center gap-1 hover:text-gold"
        >
          Verify without signing in <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {initialPersona ? (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-gold/25 bg-gold/5 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-gold">
            <Sparkles className="h-3 w-3" /> Preparing {initialPersona} workspace
          </span>
          <Badge variant="gold">one-click demo</Badge>
        </div>
      ) : null}
    </div>
  );
}
