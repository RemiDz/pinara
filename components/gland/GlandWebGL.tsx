"use client";

/**
 * GlandWebGL — the Phase 1 shipping floor.
 *
 * Sphere with light noise displacement (recomputed approx normals),
 * custom shader for fresnel rim + fake SSS + inner glow modulated by
 * breath / pulse / Schumann amplitude. Targets 60fps on iPhone 12.
 *
 * The WebGPU path will replace this only after the floor is stable
 * across the device matrix.
 */

import { Canvas, extend, useFrame, type ThreeElements } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import vert from "./shaders/gland.vert.glsl";
import frag from "./shaders/gland.frag.glsl";
import { useCosmic } from "@/components/cosmic/CosmicContext";
import { useBiometrics } from "@/components/biometrics/BiometricContext";
import { ParticleField } from "./ParticleField";
import type { IntentDefinition } from "@/lib/intent";

type GlandUniforms = {
  uTime: number;
  uBreath: number;
  uPulse: number;
  uIntensity: number;
  uDisplace: number;
  uSchumannAmp: number;
  uRim: THREE.Color;
  uInner: THREE.Color;
  uAccent: THREE.Color;
};

const GlandMaterial = shaderMaterial(
  {
    uTime: 0,
    uBreath: 0,
    uPulse: 0,
    uIntensity: 1,
    uDisplace: 1,
    uSchumannAmp: 0.5,
    uRim: new THREE.Color("#E8B86D"),
    uInner: new THREE.Color("#3A2A14"),
    uAccent: new THREE.Color("#F0D49B"),
  } as GlandUniforms,
  vert,
  frag,
);

extend({ GlandMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    glandMaterial: ThreeElements["shaderMaterial"] & Partial<GlandUniforms>;
  }
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export type GlandWebGLProps = {
  intent: IntentDefinition;
  /** 0..1 — dimmer for darkness mode */
  intensity: number;
  /** Whether a session is active (changes pulse rate) */
  inSession: boolean;
};

function GlandMesh({ intent, intensity, inSession }: GlandWebGLProps) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const { schumann } = useCosmic();
  const bio = useBiometrics();

  const colors = useMemo(
    () => ({
      rim: new THREE.Color(intent.palette.rim),
      inner: new THREE.Color(intent.palette.inner),
      accent: new THREE.Color(intent.palette.accent),
    }),
    [intent.palette.rim, intent.palette.inner, intent.palette.accent],
  );

  useFrame((state, delta) => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms as Record<keyof GlandUniforms, { value: unknown }>;
    const t = state.clock.elapsedTime;
    u.uTime.value = t;

    // Breath: prefer measured rate when biometrics are live, otherwise
    // synthesise idle 12 BPM / session 6 BPM.
    const measuredBreathBpm = bio?.breath?.bpm ?? null;
    const breathBpm = measuredBreathBpm ?? (inSession ? 6 : 12);
    const breath = 0.5 + 0.5 * Math.sin((2 * Math.PI * breathBpm * t) / 60);
    u.uBreath.value = breath;

    // Heart pulse: prefer measured HRV BPM (clamped to a sane range)
    // when the camera stream is delivering signal, otherwise the
    // synthetic resting/session pulse.
    const measuredHrvBpm =
      bio?.hrv?.bpm != null && bio.hrv.signalQuality > 0.3
        ? clamp(bio.hrv.bpm, 40, 180)
        : null;
    const pulseBpm = measuredHrvBpm ?? (inSession ? 50 : 60);
    const pulse = Math.max(0, Math.sin((2 * Math.PI * pulseBpm * t) / 60));
    u.uPulse.value = Math.pow(pulse, 4);

    u.uIntensity.value = intensity;
    u.uDisplace.value = inSession ? 1.0 : 0.7;
    u.uSchumannAmp.value = schumann?.amplitude ?? 0.5;

    (u.uRim.value as THREE.Color).copy(colors.rim);
    (u.uInner.value as THREE.Color).copy(colors.inner);
    (u.uAccent.value as THREE.Color).copy(colors.accent);

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 6]} />
      <glandMaterial ref={matRef as never} />
    </mesh>
  );
}

export function GlandWebGL(props: GlandWebGLProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3.2], fov: 38 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ambientLight intensity={0.04} />
      <GlandMesh {...props} />
      <ParticleField intent={props.intent} intensity={props.intensity} />
    </Canvas>
  );
}
