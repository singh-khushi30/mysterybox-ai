"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthGate } from "@/components/auth/AuthGate";
import { Portrait } from "@/components/shared/Portrait";
import { useAuth } from "@/lib/auth/context";
import { initialsFromDisplayName } from "@/lib/investigation/profile";

export function DetectiveProfile() {
  return (
    <AuthGate>
      <ProfileDesk />
    </AuthGate>
  );
}

function ProfileDesk() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const name = profile?.displayName ?? "Detective";
  const rank = profile?.detectiveRank ?? "Rookie Detective";
  const stats = profile?.stats;
  const current = stats?.currentInvestigation;
  const deskHref = current
    ? `/cases/${current.slug === "the-last-guest-at-blackwood-manor" ? "001" : current.slug}/investigate`
    : "/cases";

  return (
    <main className="desk-blotter relative min-h-dvh px-6 py-10 md:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(196_160_106/8%),transparent_50%)]" />
      <div className="relative mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/cases"
            className="font-mono text-[0.62rem] tracking-[0.32em] text-brass uppercase hover:text-paper"
          >
            MysteryBox · Archive
          </Link>
          <button
            type="button"
            onClick={() => {
              void signOut().then(() => router.push("/"));
            }}
            className="font-mono text-[0.62rem] tracking-[0.22em] text-beige/55 uppercase hover:text-brass"
          >
            Log out
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end">
          <Portrait initials={initialsFromDisplayName(name)} className="h-40 w-32 text-4xl" />
          <div>
            <p className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
              MysteryBox Private Archive
            </p>
            <h1 className="mt-2 font-display text-5xl text-paper">{name}</h1>
            <p className="mt-2 text-beige/60">Consulting detective · Rank {rank}</p>
          </div>
        </div>

        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Completed cases" value={String(stats?.completedCases ?? 0)} />
          <Stat label="Accuracy" value={`${stats?.accuracy ?? 0}%`} />
          <Stat label="Average score" value={String(stats?.averageScore ?? 0)} />
          <Stat label="Detective rank" value={rank} />
        </section>

        <section className="paper-texture mt-8 p-6 text-[#2d2118] shadow-[0_18px_50px_rgb(0_0_0/35%)]">
          <h2 className="font-mono text-[0.62rem] tracking-[0.22em] uppercase">
            Current investigation
          </h2>
          <p className="mt-2 font-display text-2xl">
            {current?.title ?? "No file is open on the desk."}
          </p>
          <Link
            href={deskHref}
            className="mt-3 inline-block font-mono text-[0.62rem] tracking-[0.16em] uppercase underline-offset-4 hover:underline"
          >
            {current ? "Return to the desk" : "Open the archive"}
          </Link>
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
              Recently solved
            </h2>
            <ul className="mt-4 space-y-3">
              {(stats?.recentlySolved ?? []).map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="flex items-baseline justify-between border-b border-brass/15 pb-3"
                >
                  <span>
                    <span className="font-display text-xl text-paper">{item.title}</span>
                    {item.year && (
                      <span className="ml-2 font-mono text-[0.58rem] text-beige/40">
                        {item.year}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-sm text-brass">{item.score}</span>
                </motion.li>
              ))}
              {(stats?.recentlySolved.length ?? 0) === 0 && (
                <li className="text-sm text-beige/45">No seals have been set yet.</li>
              )}
            </ul>
          </div>
          <div>
            <h2 className="font-mono text-[0.62rem] tracking-[0.28em] text-brass uppercase">
              Achievements
            </h2>
            <ul className="mt-4 space-y-4">
              {(profile?.achievements ?? []).map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                  className="border border-brass/15 p-4"
                >
                  <p className="font-display text-xl text-paper">{item.title}</p>
                  <p className="mt-1 text-sm text-beige/55">{item.detail}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-brass/15 bg-[#161310]/80 p-4">
      <p className="font-mono text-[0.58rem] tracking-[0.2em] text-beige/45 uppercase">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-paper">{value}</p>
    </div>
  );
}
