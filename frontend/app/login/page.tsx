import { AuthDesk } from "@/components/auth/AuthDesk";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  return <AuthDesk mode="login" next={next} reason={reason} />;
}
