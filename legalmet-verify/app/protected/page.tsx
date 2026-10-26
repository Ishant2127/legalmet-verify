import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();

  // 1. Verify authenticated user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // 2. Query profile role from Supabase database
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("Error loading user profile:", error);
  }

  const role = profile?.role || "owner";

  // 3. Render role-aware workspace
  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {profile?.full_name || user.email}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            Role: <span className="font-semibold text-primary">{role}</span>
          </p>
        </div>
      </header>

      {/* Role-Specific Component Placeholders */}
      {role === "owner" && (
        <section className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-2">Instrument Owner Portal</h2>
          <p className="text-muted-foreground mb-4">
            Register new weighing and measuring instruments or check your pending verification requests.
          </p>
          {/* Owner Dashboard content will go here */}
        </section>
      )}

      {role === "official" && (
        <section className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-2">Inspection Work Queue</h2>
          <p className="text-muted-foreground mb-4">
            Review assigned applications, perform physical inspections, and issue certificates.
          </p>
          {/* Officer Dashboard content will go here */}
        </section>
      )}

      {role === "admin" && (
        <section className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-2">Administrative & Oversight Portal</h2>
          <p className="text-muted-foreground mb-4">
            Manage system users, assign officers, oversee audits, and authorize approvals.
          </p>
          {/* Admin Dashboard content will go here */}
        </section>
      )}
    </div>
  );
}