"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, Group, MathUtils } from "three";
import { CaseFolder3D } from "@/components/three/CaseFolder3D";
import { useArchiveTextures } from "@/components/three/textures";

type DetectiveDeskProps = {
  pointer: { x: number; y: number };
  folderHovered: boolean;
  opening?: boolean;
  reducedMotion?: boolean;
  simplified?: boolean;
  onFolderHover?: (hovered: boolean) => void;
  onFolderClick?: () => void;
};

export function DetectiveDesk({
  pointer,
  folderHovered,
  opening = false,
  reducedMotion = false,
  simplified = false,
  onFolderHover,
  onFolderClick,
}: DetectiveDeskProps) {
  const textures = useArchiveTextures();
  const objects = useRef<Group>(null);
  const photos = useMemo(
    () =>
      [
        { position: [-0.72, 0.075, 0.42] as [number, number, number], rotation: 0.32 },
        { position: [0.78, 0.075, 0.28] as [number, number, number], rotation: -0.4 },
        { position: [0.62, 0.075, -0.38] as [number, number, number], rotation: 0.18 },
      ] as const,
    []
  );

  useFrame(() => {
    if (!objects.current || reducedMotion) {
      return;
    }

    objects.current.position.x = MathUtils.lerp(
      objects.current.position.x,
      pointer.x * 0.045,
      0.06
    );
    objects.current.position.z = MathUtils.lerp(
      objects.current.position.z,
      pointer.y * 0.03,
      0.06
    );
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.86, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#0a0807" roughness={1} />
      </mesh>
      <mesh position={[0, 0.72, -2.35]} receiveShadow>
        <boxGeometry args={[8.4, 3.4, 0.12]} />
        <meshStandardMaterial color="#1a1410" roughness={0.92} />
      </mesh>
      {!simplified && (
        <>
          <mesh position={[-3.6, 0.7, -0.4]}>
            <boxGeometry args={[0.12, 3.3, 5.2]} />
            <meshStandardMaterial color="#120e0b" roughness={0.95} />
          </mesh>
          <mesh position={[0.15, 1.42, -2.24]}>
            <boxGeometry args={[2.3, 1.35, 0.06]} />
            <meshStandardMaterial
              map={textures.cork}
              color="#8a6740"
              roughness={0.95}
            />
          </mesh>
          <Note position={[-0.55, 1.62, -2.2]} rotation={0.08} color="#e4d3b8" />
          <Note position={[0.18, 1.78, -2.2]} rotation={-0.12} color="#d7c09a" />
          <Note position={[0.62, 1.38, -2.2]} rotation={0.16} color="#c9b089" />
          <mesh position={[-1.7, 1.55, -2.28]}>
            <planeGeometry args={[0.55, 1.7]} />
            <meshStandardMaterial
              color="#d8c7ad"
              transparent
              opacity={0.08}
              roughness={0.3}
            />
          </mesh>
        </>
      )}
      <mesh position={[0, -0.42, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.12, 2.05]} />
        <meshStandardMaterial map={textures.wood} color="#4a2e1d" roughness={0.78} />
      </mesh>
      <mesh position={[0, -0.35, 0.08]} receiveShadow>
        <boxGeometry args={[2.5, 0.02, 1.45]} />
        <meshStandardMaterial color="#2a1c16" roughness={0.9} />
      </mesh>
      <mesh position={[-1.45, -0.78, 0.75]} castShadow>
        <boxGeometry args={[0.1, 0.62, 0.1]} />
        <meshStandardMaterial color="#2b1b13" />
      </mesh>
      <mesh position={[1.45, -0.78, 0.75]} castShadow>
        <boxGeometry args={[0.1, 0.62, 0.1]} />
        <meshStandardMaterial color="#2b1b13" />
      </mesh>
      <mesh position={[-1.45, -0.78, -0.65]} castShadow>
        <boxGeometry args={[0.1, 0.62, 0.1]} />
        <meshStandardMaterial color="#2b1b13" />
      </mesh>
      <mesh position={[1.45, -0.78, -0.65]} castShadow>
        <boxGeometry args={[0.1, 0.62, 0.1]} />
        <meshStandardMaterial color="#2b1b13" />
      </mesh>

      <group ref={objects}>
        <DeskLamp />
        <group scale={1.18}>
          <CaseFolder3D
            hovered={folderHovered}
            opening={opening}
            reducedMotion={reducedMotion}
            onHoverChange={onFolderHover}
            onClick={onFolderClick}
          />
        </group>
        {photos.map((photo) => (
          <mesh
            key={`${photo.position[0]}-${photo.rotation}`}
            position={photo.position}
            rotation={[-Math.PI / 2, 0, photo.rotation]}
            castShadow
            receiveShadow
          >
            <planeGeometry args={[0.34, 0.42]} />
            <meshStandardMaterial map={textures.photo} roughness={0.86} />
          </mesh>
        ))}
        <EvidenceTag position={[-0.86, 0.08, -0.18]} rotation={0.5} labelWidth={0.28} />
        <EvidenceTag position={[0.92, 0.08, 0.55]} rotation={-0.35} labelWidth={0.32} />
        {!simplified && <Inkwell />}
      </group>
    </group>
  );
}

function DeskLamp() {
  return (
    <group position={[-1.55, -0.28, -0.15]} scale={0.82}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.08, 20]} />
        <meshStandardMaterial color="#3a2a1c" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0.08, 0.52, 0]} rotation={[0, 0, -0.35]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.9, 10]} />
        <meshStandardMaterial color="#b08a52" roughness={0.35} metalness={0.55} />
      </mesh>
      <mesh position={[0.32, 1.02, 0.04]} rotation={[0.4, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.18, 16, 1, true]} />
        <meshStandardMaterial
          color="#5a3d24"
          roughness={0.55}
          metalness={0.15}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0.38, 0.96, 0.08]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshBasicMaterial color="#ffd19a" />
      </mesh>
    </group>
  );
}

function EvidenceTag({
  position,
  rotation,
  labelWidth,
}: {
  position: [number, number, number];
  rotation: number;
  labelWidth: number;
}) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, rotation]}>
      <mesh>
        <planeGeometry args={[labelWidth, 0.12]} />
        <meshStandardMaterial color="#e8d7b8" roughness={0.88} />
      </mesh>
      <mesh position={[-labelWidth / 2 - 0.02, 0, 0.001]}>
        <circleGeometry args={[0.02, 12]} />
        <meshStandardMaterial color="#8a6a3d" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Note({
  position,
  rotation,
  color,
}: {
  position: [number, number, number];
  rotation: number;
  color: string;
}) {
  return (
    <mesh position={position} rotation={[0, 0, rotation]}>
      <planeGeometry args={[0.32, 0.24]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function Inkwell() {
  return (
    <group position={[-0.95, -0.22, -0.48]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.08, 12]} />
        <meshStandardMaterial color="#1d1713" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0.08, 0.36, 0]} rotation={[0, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.22, 8]} />
        <meshStandardMaterial color="#6b4b2a" />
      </mesh>
    </group>
  );
}
