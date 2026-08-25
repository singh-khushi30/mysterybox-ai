"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

function paintNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha = 0.08
) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;

  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * alpha;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }

  ctx.putImageData(image, 0, 0);
}

function createWoodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new CanvasTexture(canvas);
  }

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, "#2a1b13");
  gradient.addColorStop(0.5, "#3d2618");
  gradient.addColorStop(1, "#24160f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 28; i += 1) {
    ctx.fillStyle = `rgba(18, 10, 6, ${0.05 + Math.random() * 0.1})`;
    ctx.fillRect(0, i * 9, 256, 1 + Math.random() * 3);
  }

  paintNoise(ctx, 256, 256, 0.06);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

function createPaperTexture(tint = "#d8c4a6") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new CanvasTexture(canvas);
  }

  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 128, 128);
  paintNoise(ctx, 128, 128, 0.12);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createCorkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new CanvasTexture(canvas);
  }

  ctx.fillStyle = "#7a5a38";
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 80; i += 1) {
    ctx.fillStyle = `rgba(40, 24, 10, ${0.08 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  paintNoise(ctx, 128, 128, 0.1);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

function createFolderLabel() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new CanvasTexture(canvas);
  }

  ctx.fillStyle = "#e6d7bf";
  ctx.fillRect(0, 0, 256, 128);
  paintNoise(ctx, 256, 128, 0.08);
  ctx.fillStyle = "#3a2418";
  ctx.font = "600 22px 'Times New Roman', serif";
  ctx.fillText("CASE 001", 28, 54);
  ctx.font = "16px 'Times New Roman', serif";
  ctx.fillStyle = "#5c2430";
  ctx.fillText("BLACKWOOD MANOR", 28, 86);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function useArchiveTextures() {
  const textures = useMemo(
    () => ({
      wood: createWoodTexture(),
      paper: createPaperTexture(),
      photo: createPaperTexture("#c2b094"),
      cork: createCorkTexture(),
      label: createFolderLabel(),
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((texture) => texture.dispose());
    };
  }, [textures]);

  return textures;
}
