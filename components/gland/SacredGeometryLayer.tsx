"use client";

/**
 * SacredGeometryLayer — Phase 4. Procedural mandala / Sri Yantra /
 * Flower of Life rendered as a translucent overlay around the gland.
 * One of three patterns chosen by the active intent's id; rotates
 * very slowly.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Pattern = "flower_of_life" | "sri_yantra" | "metatron";

function patternForIntent(intentId: string): Pattern {
  switch (intentId) {
    case "see":
    case "remember":
      return "sri_yantra";
    case "open":
    case "release":
      return "flower_of_life";
    default:
      return "metatron";
  }
}

function buildGeometry(pattern: Pattern): THREE.BufferGeometry {
  const points: number[] = [];

  if (pattern === "flower_of_life") {
    const r = 0.5;
    const ringRadii = [0, r, r * 2];
    for (const ringR of ringRadii) {
      const n = ringR === 0 ? 1 : Math.round((ringR / r) * 6);
      for (let i = 0; i < n; i++) {
        const angle = (i / Math.max(1, n)) * Math.PI * 2;
        const cx = Math.cos(angle) * ringR;
        const cy = Math.sin(angle) * ringR;
        const segs = 64;
        for (let s = 0; s < segs; s++) {
          const a = (s / segs) * Math.PI * 2;
          const a2 = ((s + 1) / segs) * Math.PI * 2;
          points.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0);
          points.push(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, 0);
        }
      }
    }
  } else if (pattern === "sri_yantra") {
    // Nine interlocking triangles approximated as 9 outlines at scaled radii.
    for (let i = 0; i < 9; i++) {
      const r = 0.4 + (i % 5) * 0.18;
      const flip = i % 2 === 0 ? 1 : -1;
      const a0 = (Math.PI / 2) * flip;
      for (let v = 0; v < 3; v++) {
        const a = a0 + (v / 3) * Math.PI * 2;
        const a2 = a0 + ((v + 1) / 3) * Math.PI * 2;
        points.push(Math.cos(a) * r, Math.sin(a) * r, 0);
        points.push(Math.cos(a2) * r, Math.sin(a2) * r, 0);
      }
    }
  } else {
    // Metatron's Cube: 13 circle centres + lines between them.
    const centres: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    for (let r = 1; r <= 2; r++) {
      for (let i = 0; i < 6 * r; i++) {
        const angle = (i / (6 * r)) * Math.PI * 2;
        centres.push({ x: Math.cos(angle) * 0.5 * r, y: Math.sin(angle) * 0.5 * r });
      }
    }
    for (let i = 0; i < centres.length; i++) {
      for (let j = i + 1; j < centres.length; j++) {
        points.push(centres[i].x, centres[i].y, 0);
        points.push(centres[j].x, centres[j].y, 0);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

export function SacredGeometryLayer({
  intentId,
  intensity = 0.4,
  rotateSpeed = 0.02,
}: {
  intentId: string;
  intensity?: number;
  rotateSpeed?: number;
}) {
  const ref = useRef<THREE.LineSegments | null>(null);
  const pattern = patternForIntent(intentId);
  const geometry = useMemo(() => buildGeometry(pattern), [pattern]);
  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color: 0xe8b86d, transparent: true, opacity: intensity, depthWrite: false }),
    [intensity],
  );

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * rotateSpeed;
  });

  return <lineSegments ref={ref} geometry={geometry} material={material} scale={[1.5, 1.5, 1.5]} />;
}
