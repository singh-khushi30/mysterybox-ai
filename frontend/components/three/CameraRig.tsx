"use client";

import { useEffect, useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera as PerspectiveCameraImpl, Vector3 } from "three";

type CameraRigProps = {
  pointer: { x: number; y: number };
  entering?: boolean;
  opening?: boolean;
  reducedMotion?: boolean;
  onArrive?: () => void;
};

const idlePosition = new Vector3(0.05, 2.35, 4.35);
const enterPosition = new Vector3(0.12, 1.05, 1.85);
const openPosition = new Vector3(0.02, 1.45, 2.6);
const lookIdle = new Vector3(0.1, -0.15, 0.05);
const lookEnter = new Vector3(0.16, 0.02, 0.18);
const lookOpen = new Vector3(0.12, 0.02, 0.16);

export function CameraRig({
  pointer,
  entering = false,
  opening = false,
  reducedMotion = false,
  onArrive,
}: CameraRigProps) {
  const cameraRef = useRef<PerspectiveCameraImpl>(null);
  const look = useRef(lookIdle.clone());
  const arrived = useRef(false);

  useEffect(() => {
    arrived.current = false;
  }, [entering, opening]);

  useFrame(() => {
    const camera = cameraRef.current;
    if (!camera) {
      return;
    }

    const destination = opening
      ? openPosition
      : entering
        ? enterPosition
        : idlePosition;
    const lookTarget = opening ? lookOpen : entering ? lookEnter : lookIdle;
    const parallax = reducedMotion || entering || opening ? 0 : 1;
    const targetX = destination.x + pointer.x * 0.22 * parallax;
    const targetY = destination.y + pointer.y * 0.1 * parallax;
    const lerp = entering || opening ? 0.045 : 0.035;

    camera.position.x = MathUtils.lerp(camera.position.x, targetX, lerp);
    camera.position.y = MathUtils.lerp(camera.position.y, targetY, lerp);
    camera.position.z = MathUtils.lerp(camera.position.z, destination.z, lerp);

    look.current.lerp(lookTarget, lerp);
    camera.lookAt(look.current);

    if ((entering || opening) && !arrived.current) {
      if (camera.position.distanceTo(destination) < 0.12) {
        arrived.current = true;
        onArrive?.();
      }
    }
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[0.05, 2.35, 4.35]}
      fov={38}
      near={0.1}
      far={24}
      onUpdate={(camera) => camera.lookAt(lookIdle)}
    />
  );
}
