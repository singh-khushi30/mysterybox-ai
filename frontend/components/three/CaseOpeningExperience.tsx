"use client";

import dynamic from "next/dynamic";
import { HeroFallback } from "@/components/three/HeroFallback";
import { SceneFallback } from "@/components/three/SceneFallback";

const MysteryRoom = dynamic(
  () => import("@/components/three/MysteryRoom").then((mod) => mod.MysteryRoom),
  {
    ssr: false,
    loading: () => <SceneFallback label="Opening the file" />,
  }
);

type CaseOpeningExperienceProps = {
  opening: boolean;
  reducedMotion: boolean;
  mode: "mobile" | "tablet" | "desktop" | null;
};

export function CaseOpeningExperience({
  opening,
  reducedMotion,
  mode,
}: CaseOpeningExperienceProps) {
  if (mode === null) {
    return <SceneFallback label="Opening the file" />;
  }

  if (mode === "mobile") {
    return <HeroFallback />;
  }

  return (
    <MysteryRoom
      pointer={{ x: 0, y: 0 }}
      folderHovered
      opening={opening}
      reducedMotion={reducedMotion}
      simplified={mode === "tablet"}
    />
  );
}
