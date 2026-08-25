"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import type { Points as PointsType } from "three";
import { CameraRig } from "@/components/three/CameraRig";
import { DetectiveDesk } from "@/components/three/DetectiveDesk";
import { Lighting } from "@/components/three/Lighting";

export type MysteryRoomProps = {
  pointer: { x: number; y: number };
  folderHovered: boolean;
  entering?: boolean;
  opening?: boolean;
  reducedMotion?: boolean;
  simplified?: boolean;
  onFolderHover?: (hovered: boolean) => void;
  onFolderClick?: () => void;
  onArrive?: () => void;
};

export function MysteryRoom({
  pointer,
  folderHovered,
  entering = false,
  opening = false,
  reducedMotion = false,
  simplified = false,
  onFolderHover,
  onFolderClick,
  onArrive,
}: MysteryRoomProps) {
  return (
    <Canvas
      dpr={simplified ? [1, 1] : [1, 1.5]}
      gl={{
        antialias: !simplified,
        alpha: false,
        powerPreference: "high-performance",
      }}
      shadows={!simplified}
    >
      <color attach="background" args={["#0c0a08"]} />
      <fog attach="fog" args={["#0c0a08", 8, 16]} />
      <Lighting
        folderHovered={folderHovered}
        opening={opening}
        simplified={simplified}
      />
      <CameraRig
        pointer={pointer}
        entering={entering}
        opening={opening}
        reducedMotion={reducedMotion}
        onArrive={onArrive}
      />
      <DetectiveDesk
        pointer={pointer}
        folderHovered={folderHovered}
        opening={opening}
        reducedMotion={reducedMotion}
        simplified={simplified}
        onFolderHover={onFolderHover}
        onFolderClick={onFolderClick}
      />
      {!simplified && !reducedMotion && <DustParticles />}
    </Canvas>
  );
}

const DUST_POSITIONS = createDustPositions();

function createDustPositions() {
  const next = new Float32Array(160 * 3);

  for (let i = 0; i < 160; i += 1) {
    next[i * 3] = (hash(i) - 0.5) * 5.5;
    next[i * 3 + 1] = hash(i + 41) * 2.6;
    next[i * 3 + 2] = (hash(i + 83) - 0.5) * 3.8;
  }

  return next;
}

function hash(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

function DustParticles() {
  const ref = useRef<PointsType>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.012;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.04;
  });

  return (
    <Points ref={ref} positions={DUST_POSITIONS} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#d8c7ad"
        size={0.018}
        sizeAttenuation
        depthWrite={false}
        opacity={0.32}
      />
    </Points>
  );
}
