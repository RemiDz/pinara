"use client";

/**
 * BiometricContext — React surface over the live biometric streams.
 *
 * Lifecycle is explicit: streams attach when the consumer calls
 * `startCamera` / `startMic`, detach on `stopCamera` / `stopMic` or
 * unmount. Capability-gated: on devices without `mediaDevices` the
 * start methods become no-ops and the provider exposes that fact.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { detectCapabilities, type Capabilities } from "@/lib/capability";
import {
  getPermission,
  requestCamera,
  requestMicrophone,
  type PermissionRecord,
} from "@/lib/permissions";
import { HRVCamera, type HRVReading } from "./HRVCamera";
import { BreathMic, type BreathReading } from "./BreathMic";
import {
  computeCoherence,
  type CoherenceOutput,
} from "./CoherenceLoop";

type Status = "idle" | "starting" | "running" | "denied" | "unsupported";

export type BiometricState = {
  capabilities: Capabilities | null;
  cameraPermission: PermissionRecord;
  micPermission: PermissionRecord;
  hrv: HRVReading | null;
  breath: BreathReading | null;
  coherence: CoherenceOutput;
  cameraStatus: Status;
  micStatus: Status;
};

type BiometricContextValue = BiometricState & {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  startMic: () => Promise<void>;
  stopMic: () => void;
  /** Override the breath target the coherence calc uses. */
  setTargetBreathBpm: (bpm: number) => void;
};

const ZERO_COHERENCE: CoherenceOutput = { coherence: 0, depth: 0, drift: 0 };

const BioCtx = createContext<BiometricContextValue | null>(null);

const NULL_PERMISSION: PermissionRecord = { state: "unknown", decidedAt: null };

export function BiometricProvider({ children }: { children: ReactNode }) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [cameraPermission, setCameraPermission] =
    useState<PermissionRecord>(NULL_PERMISSION);
  const [micPermission, setMicPermission] =
    useState<PermissionRecord>(NULL_PERMISSION);
  const [hrv, setHrv] = useState<HRVReading | null>(null);
  const [breath, setBreath] = useState<BreathReading | null>(null);
  const [cameraStatus, setCameraStatus] = useState<Status>("idle");
  const [micStatus, setMicStatus] = useState<Status>("idle");
  const [targetBreathBpm, setTargetBreathBpm] = useState(6);

  const hrvRef = useRef<HRVCamera | null>(null);
  const breathRef = useRef<BreathMic | null>(null);

  // Detect capabilities + read persisted permission state on mount.
  useEffect(() => {
    const caps = detectCapabilities();
    setCapabilities(caps);
    setCameraPermission(getPermission("camera"));
    setMicPermission(getPermission("microphone"));
    if (!caps.hasMediaDevices) {
      setCameraStatus("unsupported");
      setMicStatus("unsupported");
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!capabilities?.hasMediaDevices) {
      setCameraStatus("unsupported");
      return;
    }
    if (cameraStatus === "running" || cameraStatus === "starting") return;
    setCameraStatus("starting");
    const stream = await requestCamera({ facingMode: "environment", torch: true });
    setCameraPermission(getPermission("camera"));
    if (!stream) {
      setCameraStatus("denied");
      return;
    }
    const cam = new HRVCamera();
    hrvRef.current = cam;
    cam.subscribe((reading) => setHrv(reading));
    try {
      await cam.start(stream);
      setCameraStatus("running");
    } catch {
      cam.stop();
      hrvRef.current = null;
      setCameraStatus("denied");
    }
  }, [capabilities, cameraStatus]);

  const stopCamera = useCallback(() => {
    hrvRef.current?.stop();
    hrvRef.current = null;
    setHrv(null);
    setCameraStatus("idle");
  }, []);

  const startMic = useCallback(async () => {
    if (!capabilities?.hasMediaDevices || !capabilities.webaudio) {
      setMicStatus("unsupported");
      return;
    }
    if (micStatus === "running" || micStatus === "starting") return;
    setMicStatus("starting");
    const stream = await requestMicrophone();
    setMicPermission(getPermission("microphone"));
    if (!stream) {
      setMicStatus("denied");
      return;
    }
    const mic = new BreathMic();
    breathRef.current = mic;
    mic.subscribe((reading) => setBreath(reading));
    try {
      await mic.start(stream);
      setMicStatus("running");
    } catch {
      mic.stop();
      breathRef.current = null;
      setMicStatus("denied");
    }
  }, [capabilities, micStatus]);

  const stopMic = useCallback(() => {
    breathRef.current?.stop();
    breathRef.current = null;
    setBreath(null);
    setMicStatus("idle");
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      hrvRef.current?.stop();
      breathRef.current?.stop();
    };
  }, []);

  const coherence = useMemo<CoherenceOutput>(() => {
    if (!hrv && !breath) return ZERO_COHERENCE;
    return computeCoherence({ hrv, breath, targetBreathBpm });
  }, [hrv, breath, targetBreathBpm]);

  const value = useMemo<BiometricContextValue>(
    () => ({
      capabilities,
      cameraPermission,
      micPermission,
      hrv,
      breath,
      coherence,
      cameraStatus,
      micStatus,
      startCamera,
      stopCamera,
      startMic,
      stopMic,
      setTargetBreathBpm,
    }),
    [
      capabilities,
      cameraPermission,
      micPermission,
      hrv,
      breath,
      coherence,
      cameraStatus,
      micStatus,
      startCamera,
      stopCamera,
      startMic,
      stopMic,
    ],
  );

  return <BioCtx.Provider value={value}>{children}</BioCtx.Provider>;
}

/**
 * Hook returning the live biometric state. Returns null when used
 * outside a BiometricProvider — call sites should fall back to a
 * synthetic baseline rather than throw.
 */
export function useBiometrics(): BiometricContextValue | null {
  return useContext(BioCtx);
}
