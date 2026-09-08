"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

function GateNotice({ label }: { label: string }) {
  return (
    <main className="desk-blotter flex min-h-dvh items-center justify-center px-6">
      <p className="font-mono text-[0.68rem] tracking-[0.28em] text-brass uppercase">{label}</p>
    </main>
  );
}

function AuthGateInner({ children }: { children: ReactNode }) {
  const { user, ready, profileReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      const search = searchParams.toString();
      const next = `${pathname}${search ? `?${search}` : ""}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [pathname, ready, router, searchParams, user]);

  if (!ready || (user && !profileReady)) {
    return <GateNotice label="Opening the register…" />;
  }

  if (!user) {
    return <GateNotice label="Redirecting to the door…" />;
  }

  return <>{children}</>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<GateNotice label="Opening the register…" />}>
      <AuthGateInner>{children}</AuthGateInner>
    </Suspense>
  );
}
