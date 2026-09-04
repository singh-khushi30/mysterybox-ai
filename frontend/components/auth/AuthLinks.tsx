"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/context";

export function AuthLinks({ className }: { className?: string }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <span className={className}>…</span>;
  }

  if (user) {
    return (
      <Link href="/profile" className={className}>
        Profile
      </Link>
    );
  }

  return (
    <span className="flex gap-5">
      <Link href="/login" className={className}>
        Log in
      </Link>
      <Link href="/signup" className={className}>
        Sign up
      </Link>
    </span>
  );
}
