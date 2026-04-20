"use client";

/**
 * InnerSky — Phase 4. Procedural starfield rendered inside a
 * semi-transparent gland. A user's natal chart (via Astrara JSON
 * upload) refines the positions in Phase 4.1; for now we ship a
 * deterministic procedural sky seeded from the user's locale + a
 * persisted seed.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 220;

const VERT = /* glsl */ `
  uniform float uTime;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float s = aSeed * 6.2831853;
    p.x += 0.04 * sin(uTime * 0.05 + s);
    p.y += 0.04 * cos(uTime * 0.07 + s * 1.1);
    p.z += 0.04 * sin(uTime * 0.06 + s * 0.9);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 1.5 + 1.5 * fract(aSeed * 17.0);
    vAlpha = 0.4 + 0.5 * fract(aSeed * 11.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = length(d);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.0, r) * vAlpha;
    gl_FragColor = vec4(0.95, 0.92, 1.0, a);
  }
`;

export function InnerSky({ seed = 1, intensity = 1 }: { seed?: number; intensity?: number }) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    let s = seed * 9301 + 49297;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < COUNT; i++) {
      const u = rand();
      const v = rand();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 0.7;
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      seeds[i] = rand();
    }
    return { positions, seeds };
  }, [seed]);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.opacity = intensity;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 } }}
      />
    </points>
  );
}
