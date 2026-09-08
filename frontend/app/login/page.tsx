import { redirect } from "next/navigation";
import { AuthDesk } from "@/components/auth/AuthDesk";
import { getServerUser } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  if (await getServerUser()) {
    redirect("/cases");
  }
  return <AuthDesk mode="login" next={next} reason={reason} />;
}
