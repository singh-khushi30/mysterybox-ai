import { AuthDesk } from "@/components/auth/AuthDesk";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthDesk mode="login" next={next} />;
}
