"use client";

import { useMemo, useRef } from "react";
import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Color, Group, MathUtils, Mesh } from "three";
import { useArchiveTextures } from "@/components/three/textures";

type CaseFolder3DProps = {
  position?: [number, number, number];
  hovered?: boolean;
  opening?: boolean;
  interactive?: boolean;
  reducedMotion?: boolean;
  onHoverChange?: (hovered: boolean) => void;
  onClick?: () => void;
};

export function CaseFolder3D({
  position = [0.16, 0.1, 0.2],
  hovered = false,
  opening = false,
  interactive = true,
  reducedMotion = false,
  onHoverChange,
  onClick,
}: CaseFolder3DProps) {
  const textures = useArchiveTextures();
  const root = useRef<Group>(null);
  const flap = useRef<Group>(null);
  const papers = useRef<Group>(null);
  const manila = useMemo(() => new Color("#b9895c"), []);

  useCursor(interactive && hovered);

  useFrame(() => {
    if (!root.current || !flap.current || !papers.current) {
      return;
    }

    const lift = opening ? 0.12 : hovered && !reducedMotion ? 0.07 : 0.02;
    const tilt = opening ? -0.08 : hovered ? -0.12 : -0.04;
    const flapAngle = opening ? -1.18 : hovered && !reducedMotion ? -0.28 : -0.06;
    const paperLift = opening ? 0.05 : hovered ? 0.018 : 0.004;

    root.current.position.y = MathUtils.lerp(root.current.position.y, lift, 0.08);
    root.current.rotation.x = MathUtils.lerp(root.current.rotation.x, tilt, 0.08);
    flap.current.rotation.x = MathUtils.lerp(flap.current.rotation.x, flapAngle, 0.08);
    papers.current.position.y = MathUtils.lerp(papers.current.position.y, paperLift, 0.08);
  });

  return (
    <group
      position={position}
      rotation={[0, 0.18, 0]}
      onPointerOver={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        onHoverChange?.(true);
      }}
      onPointerOut={() => {
        if (!interactive) return;
        onHoverChange?.(false);
      }}
      onClick={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        onClick?.();
      }}
    >
      <group ref={root} position={[0, 0.02, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.78, 0.018, 1.02]} />
          <meshStandardMaterial color="#8d4d32" roughness={0.82} metalness={0.04} />
        </mesh>
        <mesh position={[0, 0.012, 0]} receiveShadow>
          <boxGeometry args={[0.76, 0.01, 1]} />
          <meshStandardMaterial
            color={manila}
            map={textures.paper}
            roughness={0.88}
            metalness={0}
          />
        </mesh>
        <mesh position={[-0.36, 0.03, 0]} castShadow>
          <boxGeometry args={[0.06, 0.05, 1.02]} />
          <meshStandardMaterial color="#4a1f28" roughness={0.7} metalness={0.08} />
        </mesh>
        <group ref={papers} position={[0.02, 0.02, 0.02]}>
          <PaperSheet position={[0.02, 0.01, -0.02]} rotation={0.04} color="#e4d3b8" />
          <PaperSheet position={[-0.01, 0.018, 0.03]} rotation={-0.06} color="#dcc6a6" />
        </group>
        <group ref={flap} position={[0, 0.02, -0.5]}>
          <mesh castShadow position={[0, 0, 0.22]} rotation={[0.02, 0, 0]}>
            <boxGeometry args={[0.78, 0.012, 0.46]} />
            <meshStandardMaterial
              color="#a86b42"
              map={textures.paper}
              roughness={0.86}
            />
          </mesh>
          <mesh position={[0.02, 0.01, 0.24]} rotation={[-0.02, 0, 0]}>
            <planeGeometry args={[0.42, 0.18]} />
            <meshStandardMaterial map={textures.label} roughness={0.7} />
          </mesh>
        </group>
        <mesh position={[0.28, 0.03, 0.36]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.035, 0.035, 0.01, 20]} />
          <meshStandardMaterial color="#8a2d3a" roughness={0.45} metalness={0.12} />
        </mesh>
      </group>
    </group>
  );
}

function PaperSheet({
  position,
  rotation,
  color,
}: {
  position: [number, number, number];
  rotation: number;
  color: string;
}) {
  const ref = useRef<Mesh>(null);

  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, rotation]}>
      <planeGeometry args={[0.58, 0.78]} />
      <meshStandardMaterial color={color} roughness={0.92} />
    </mesh>
  );
}
