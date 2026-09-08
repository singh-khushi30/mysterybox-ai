"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { WaxSealButton } from "@/components/shared/WaxSealButton";
import { useAuth } from "@/lib/auth/context";

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function AuthDesk({
  mode,
  next,
  reason,
}: {
  mode: "login" | "signup";
  next?: string;
  reason?: string;
}) {
  const { user, ready, signIn, signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    reason === "timeout" ? "Your session expired after 1 hour. Please log in again." : null
  );
  const [showPassword, setShowPassword] = useState(false);

  const isSignup = mode === "signup";
  const nextPath = safeNext(next);
  const destination = nextPath ?? "/cases";
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
  const signupHref = nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup";

  useEffect(() => {
    if (ready && user) {
      router.replace(destination);
    }
  }, [destination, ready, router, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (isSignup) {
        const result = await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim() || email.split("@")[0] || "Detective",
        });
        if (result === "confirm") {
          setNotice("Account created. Check your email to confirm, then log in.");
          return;
        }
      } else {
        await signIn(email.trim(), password);
      }
      router.replace(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign up failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="desk-blotter relative min-h-dvh px-6 py-10 md:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(196_160_106/8%),transparent_50%)]" />
      <div className="relative mx-auto max-w-md">
        <Link
          href="/"
          className="font-mono text-[0.62rem] tracking-[0.32em] text-brass uppercase hover:text-paper"
        >
          MysteryBox · Archive
        </Link>
        <p className="mt-10 font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
          {isSignup ? "The register" : "The door"}
        </p>
        <h1 className="mt-2 font-display text-5xl text-paper">
          {isSignup ? "Take a name" : "Return to the desk"}
        </h1>
        <p className="mt-3 text-beige/60">
          {isSignup
            ? "The cabinet keeps each detective’s files apart. Sign up with your email and password."
            : "Log in with your email and password. Only your own papers will be laid on the blotter."}
        </p>

        <form onSubmit={(event) => void onSubmit(event)} className="mt-8 space-y-5">
          {isSignup && (
            <Field label="Display name">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="nickname"
                className="paper-texture w-full px-4 py-3 font-serif text-lg text-[#2d2118] outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
              />
            </Field>
          )}
          <Field label="Email" hint="This is your email address.">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="paper-texture w-full px-4 py-3 font-serif text-lg text-[#2d2118] outline-none placeholder:text-[#2d2118]/35 focus-visible:ring-2 focus-visible:ring-brass/70"
            />
          </Field>
          <Field label="Password" hint="This is your password. Use at least 6 characters.">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="Your password"
                className="paper-texture w-full px-4 py-3 pr-12 font-serif text-lg text-[#2d2118] outline-none placeholder:text-[#2d2118]/35 focus-visible:ring-2 focus-visible:ring-brass/70"
              />
              <button
                type="button"
                onClick={() => setShowPassword((open) => !open)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#2d2118]/55 hover:text-[#2d2118] focus-visible:ring-2 focus-visible:ring-brass/70 focus-visible:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </Field>

          {error && <p className="font-display text-beige/70 italic">{error}</p>}
          {notice && <p className="font-display text-beige/70 italic">{notice}</p>}

          <div className="pt-2">
            <WaxSealButton type="submit" disabled={busy} className="w-full">
              {busy ? "Filing…" : isSignup ? "Sign the register" : "Enter"}
            </WaxSealButton>
          </div>
        </form>

        <p className="mt-8 font-mono text-[0.62rem] tracking-[0.18em] text-beige/50 uppercase">
          {isSignup ? (
            <>
              Already on the books?{" "}
              <Link href={loginHref} className="text-brass hover:text-paper">
                Return to the door
              </Link>
            </>
          ) : (
            <>
              New to the cabinet?{" "}
              <Link href={signupHref} className="text-brass hover:text-paper">
                Take a name
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="mt-2 block text-sm text-beige/50">{hint}</span>}
    </label>
  );
}
