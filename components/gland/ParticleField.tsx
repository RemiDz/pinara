"use client";

/**
 * ParticleField — drifting motes around the gland.
 *
 * Phase 1: 320 motes with pseudo-Brownian drift in vertex shader,
 * density modulated by Schumann amplitude. Mobile-friendly: small
 * additive points, no depth writes.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useCosmic } from "@/components/cosmic/CosmicContext";
import type { IntentDefinition } from "@/lib/intent";

const COUNT = 320;

type Props = {
  intent: IntentDefinition;
  intensity: number;
};

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uDensity;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float s = aSeed * 6.2831853;
    p.x += 0.07 * sin(uTime * 0.18 + s);
    p.y += 0.06 * cos(uTime * 0.22 + s * 1.3);
    p.z += 0.05 * sin(uTime * 0.16 + s * 0.7);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mix(1.5, 3.5, fract(aSeed * 13.0));
    gl_PointSize = size * uIntensity * (300.0 / -mv.z);
    vAlpha = (0.35 + 0.5 * fract(aSeed * 7.0)) * uIntensity * uDensity;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = length(d);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.0, r) * vAlpha;
    gl_FragColor = vec4(uColor, a);
  }
`;

export function ParticleField({ intent, intensity }: Props) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const { schumann } = useCosmic();

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // Spherical shell from r=1.4 to r=2.4
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.4 + Math.random() * 1.0;
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, []);

  const accentColor = useMemo(() => new THREE.Color(intent.palette.accent), [intent.palette.accent]);

  useFrame((state) => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uIntensity.value = intensity;
    u.uDensity.value = 0.6 + 0.7 * (schumann?.amplitude ?? 0.5);
    (u.uColor.value as THREE.Color).copy(accentColor);
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
        uniforms={{
          uTime: { value: 0 },
          uIntensity: { value: intensity },
          uDensity: { value: 1 },
          uColor: { value: accentColor.clone() },
        }}
      />
    </points>
  );
}
