"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { HeroExperience } from "@/components/three/HeroExperience";
import { AuthLinks } from "@/components/auth/AuthLinks";
import { WaxSealButton } from "@/components/shared/WaxSealButton";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useViewportMode } from "@/hooks/useViewportMode";

export function LandingView() {
  const router = useRouter();
  const mode = useViewportMode();
  const reducedMotion = usePrefersReducedMotion();
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [folderHovered, setFolderHovered] = useState(false);
  const [entering, setEntering] = useState(false);

  const beginInvestigation = useCallback(() => {
    if (entering) return;
    setEntering(true);

    if (reducedMotion || mode === "mobile") {
      router.push("/cases");
    }
  }, [entering, mode, reducedMotion, router]);

  useEffect(() => {
    if (!entering || reducedMotion || mode === "mobile") {
      return;
    }

    const fallback = window.setTimeout(() => {
      router.push("/cases");
    }, 2200);

    return () => window.clearTimeout(fallback);
  }, [entering, mode, reducedMotion, router]);

  const handleArrive = useCallback(() => {
    router.push("/cases");
  }, [router]);

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-ink"
      onPointerMove={(event) => {
        if (reducedMotion || entering) return;
        setPointer({
          x: (event.clientX / window.innerWidth) * 2 - 1,
          y: (event.clientY / window.innerHeight) * 2 - 1,
        });
      }}
    >
      <div className="absolute inset-0">
        <HeroExperience
          pointer={pointer}
          folderHovered={folderHovered}
          entering={entering}
          reducedMotion={reducedMotion}
          mode={mode}
          onFolderHover={setFolderHovered}
          onFolderClick={beginInvestigation}
          onArrive={handleArrive}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/35 via-transparent to-ink/55" />

      <div className="relative z-10 flex min-h-dvh flex-col px-6 py-8 md:px-12">
        <header className="pointer-events-auto flex items-center justify-between font-mono text-[0.62rem] tracking-[0.34em] text-brass/70 uppercase">
          <span>Private Archive</span>
          <nav className="flex gap-5">
            <Link href="/cases" className="hover:text-brass">
              Cases
            </Link>
            <AuthLinks className="hover:text-brass" />
          </nav>
        </header>

        <section className="mx-auto mt-10 max-w-3xl text-center md:mt-14">
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-mono text-[0.68rem] tracking-[0.42em] text-brass uppercase"
          >
            An AI detective bureau
          </motion.p>
          <motion.h1
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mt-4 font-display text-5xl leading-none tracking-[0.18em] text-paper uppercase md:text-7xl"
          >
            MysteryBox
          </motion.h1>
          <motion.p
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.45 }}
            className="mx-auto mt-6 max-w-md font-display text-xl text-beige/80 italic md:text-2xl"
          >
            Every clue matters. Everyone has something to hide.
          </motion.p>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="pointer-events-auto mt-32 md:mt-40"
          >
            <WaxSealButton onClick={beginInvestigation} disabled={entering}>
              Start Investigating
            </WaxSealButton>
          </motion.div>
        </section>

        <p className="mt-auto pt-10 text-center font-mono text-[0.6rem] tracking-[0.28em] text-beige/35 uppercase">
          Move through the room. The first case is already on the desk.
        </p>
      </div>

      <AnimatePresence>
        {entering && (
          <motion.div
            className="absolute inset-0 z-20 bg-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.7, delay: reducedMotion ? 0 : 0.55 }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
