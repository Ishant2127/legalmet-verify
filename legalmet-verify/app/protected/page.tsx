import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();

  // 1. Verify authenticated user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 2. Query profile role from Supabase database
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "owner";

  // 3. Immediately route to their dedicated dashboard
  if (role === "official" || role === "admin") {
    redirect("/official/applications");
  } else {
    redirect("/owner/dashboard");
  }
}