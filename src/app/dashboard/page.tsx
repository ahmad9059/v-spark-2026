import { redirect } from "next/navigation";

import { Dashboard } from "~/components/dashboard/dashboard";
import { createClient } from "~/lib/supabase/server";

export const metadata = { title: "Dashboard | Spark Scheduler" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <Dashboard userId={user.id} email={user.email ?? ""} />;
}
