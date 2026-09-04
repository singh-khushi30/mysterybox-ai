"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, ready, router, user]);

  if (!ready) {
    return (
      <main className="desk-blotter flex min-h-dvh items-center justify-center px-6">
        <p className="font-mono text-[0.68rem] tracking-[0.28em] text-brass uppercase">
          Opening the register…
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="desk-blotter flex min-h-dvh items-center justify-center px-6">
        <p className="font-mono text-[0.68rem] tracking-[0.28em] text-brass uppercase">
          Redirecting to the door…
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
