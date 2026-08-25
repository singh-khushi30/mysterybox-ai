"use client";

import dynamic from "next/dynamic";
import { HeroFallback } from "@/components/three/HeroFallback";
import { SceneFallback } from "@/components/three/SceneFallback";

const MysteryRoom = dynamic(
  () => import("@/components/three/MysteryRoom").then((mod) => mod.MysteryRoom),
  {
    ssr: false,
    loading: () => <SceneFallback />,
  }
);

type HeroExperienceProps = {
  pointer: { x: number; y: number };
  folderHovered: boolean;
  entering: boolean;
  reducedMotion: boolean;
  mode: "mobile" | "tablet" | "desktop" | null;
  onFolderHover: (hovered: boolean) => void;
  onFolderClick: () => void;
  onArrive: () => void;
};

export function HeroExperience({
  pointer,
  folderHovered,
  entering,
  reducedMotion,
  mode,
  onFolderHover,
  onFolderClick,
  onArrive,
}: HeroExperienceProps) {
  if (mode === null) {
    return <SceneFallback />;
  }

  if (mode === "mobile") {
    return <HeroFallback />;
  }

  return (
    <MysteryRoom
      pointer={pointer}
      folderHovered={folderHovered}
      entering={entering}
      reducedMotion={reducedMotion}
      simplified={mode === "tablet"}
      onFolderHover={onFolderHover}
      onFolderClick={onFolderClick}
      onArrive={onArrive}
    />
  );
}
