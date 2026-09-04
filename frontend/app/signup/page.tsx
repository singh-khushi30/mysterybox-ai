import { AuthDesk } from "@/components/auth/AuthDesk";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthDesk mode="signup" next={next} />;
}
