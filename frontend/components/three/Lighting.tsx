"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, PointLight, SpotLight } from "three";

type LightingProps = {
  folderHovered?: boolean;
  opening?: boolean;
  simplified?: boolean;
};

export function Lighting({
  folderHovered = false,
  opening = false,
  simplified = false,
}: LightingProps) {
  const lamp = useRef<SpotLight>(null);
  const glow = useRef<PointLight>(null);

  useFrame(() => {
    const target = opening ? 2.15 : folderHovered ? 1.95 : 1.55;
    const glowTarget = opening ? 0.85 : folderHovered ? 0.72 : 0.48;

    if (lamp.current) {
      lamp.current.intensity = MathUtils.lerp(lamp.current.intensity, target, 0.05);
    }
    if (glow.current) {
      glow.current.intensity = MathUtils.lerp(glow.current.intensity, glowTarget, 0.05);
    }
  });

  return (
    <>
      <ambientLight intensity={simplified ? 0.32 : 0.22} color="#cbb79a" />
      <hemisphereLight args={["#8a9bb0", "#1a100c", 0.28]} />
      <directionalLight
        position={[-3.2, 2.4, -1.6]}
        intensity={0.28}
        color="#9aa8bd"
      />
      <directionalLight
        position={[1.4, 3.2, 2.2]}
        intensity={0.35}
        color="#f0d2a8"
      />
      <spotLight
        ref={lamp}
        position={[-1.15, 1.55, 0.15]}
        angle={0.55}
        penumbra={0.7}
        intensity={2.1}
        color="#ffc48a"
        castShadow={!simplified}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0004}
      >
        <object3D attach="target" position={[0.05, 0.02, 0.15]} />
      </spotLight>
      <pointLight
        ref={glow}
        position={[-1.12, 1.28, 0.18]}
        intensity={0.48}
        color="#ffd7a8"
        distance={4.2}
        decay={2}
      />
    </>
  );
}
