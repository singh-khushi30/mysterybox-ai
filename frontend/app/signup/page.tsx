import { redirect } from "next/navigation";
import { AuthDesk } from "@/components/auth/AuthDesk";
import { getServerUser } from "@/lib/supabase/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await getServerUser()) {
    redirect("/cases");
  }
  return <AuthDesk mode="signup" next={next} />;
}
