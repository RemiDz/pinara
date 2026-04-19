"use client";

/**
 * BiometricContext — React surface over the live biometric streams.
 *
 * Lifecycle is explicit: streams attach when the consumer calls
 * `startCamera` / `startMic` / `startPosture`, detach on the matching
 * stop or unmount. Capability-gated: on devices without `mediaDevices`
 * the camera/mic start methods become no-ops; posture works without
 * mediaDevices but needs DeviceMotion.
 *
 * Phase 2.1: BreathMic and VoiceAnalyser share one MediaStream + one
 * AudioContext so the platform doesn't fight us over the microphone.
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
  requestMotion,
  type PermissionRecord,
} from "@/lib/permissions";
import { HRVCamera, type HRVReading } from "./HRVCamera";
import { BreathMic, type BreathReading } from "./BreathMic";
import { VoiceAnalyser, type VoiceReading } from "./VoiceAnalyser";
import { PostureSensor, type PostureReading } from "./PostureSensor";
import {
  computeCoherence,
  type CoherenceOutput,
} from "./CoherenceLoop";

type Status = "idle" | "starting" | "running" | "denied" | "unsupported";

export type BiometricState = {
  capabilities: Capabilities | null;
  cameraPermission: PermissionRecord;
  micPermission: PermissionRecord;
  motionPermission: PermissionRecord;
  hrv: HRVReading | null;
  breath: BreathReading | null;
  voice: VoiceReading | null;
  posture: PostureReading | null;
  coherence: CoherenceOutput;
  cameraStatus: Status;
  micStatus: Status;
  postureStatus: Status;
};

type BiometricContextValue = BiometricState & {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  startMic: () => Promise<void>;
  stopMic: () => void;
  startPosture: () => Promise<void>;
  stopPosture: () => void;
  setTargetBreathBpm: (bpm: number) => void;
};

const ZERO_COHERENCE: CoherenceOutput = { coherence: 0, depth: 0, drift: 0 };
const NULL_PERMISSION: PermissionRecord = { state: "unknown", decidedAt: null };

const BioCtx = createContext<BiometricContextValue | null>(null);

export function BiometricProvider({ children }: { children: ReactNode }) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [cameraPermission, setCameraPermission] = useState<PermissionRecord>(NULL_PERMISSION);
  const [micPermission, setMicPermission] = useState<PermissionRecord>(NULL_PERMISSION);
  const [motionPermission, setMotionPermission] = useState<PermissionRecord>(NULL_PERMISSION);
  const [hrv, setHrv] = useState<HRVReading | null>(null);
  const [breath, setBreath] = useState<BreathReading | null>(null);
  const [voice, setVoice] = useState<VoiceReading | null>(null);
  const [posture, setPosture] = useState<PostureReading | null>(null);
  const [cameraStatus, setCameraStatus] = useState<Status>("idle");
  const [micStatus, setMicStatus] = useState<Status>("idle");
  const [postureStatus, setPostureStatus] = useState<Status>("idle");
  const [targetBreathBpm, setTargetBreathBpm] = useState(6);

  const hrvRef = useRef<HRVCamera | null>(null);
  const breathRef = useRef<BreathMic | null>(null);
  const voiceRef = useRef<VoiceAnalyser | null>(null);
  const postureRef = useRef<PostureSensor | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const caps = detectCapabilities();
    setCapabilities(caps);
    setCameraPermission(getPermission("camera"));
    setMicPermission(getPermission("microphone"));
    setMotionPermission(getPermission("motion"));
    if (!caps.hasMediaDevices) {
      setCameraStatus("unsupported");
      setMicStatus("unsupported");
    }
    if (!caps.deviceMotion) setPostureStatus("unsupported");
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
    cam.subscribe(setHrv);
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
    micStreamRef.current = stream;

    // Single shared AudioContext so both analysers cooperate.
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) {
      setMicStatus("unsupported");
      return;
    }
    const ctx = new Ctor();
    micCtxRef.current = ctx;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* fall through */
      }
    }

    const breathInst = new BreathMic();
    const voiceInst = new VoiceAnalyser();
    breathRef.current = breathInst;
    voiceRef.current = voiceInst;
    breathInst.subscribe(setBreath);
    voiceInst.subscribe(setVoice);

    try {
      await breathInst.start(stream, ctx);
      // Voice worklet load can fail if the worklet file is missing —
      // tolerate that without nuking breath capture.
      try {
        await voiceInst.start(stream, ctx);
      } catch {
        voiceInst.stop();
        voiceRef.current = null;
      }
      setMicStatus("running");
    } catch {
      breathInst.stop();
      voiceInst.stop();
      breathRef.current = null;
      voiceRef.current = null;
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* */
      }
      micStreamRef.current = null;
      void ctx.close().catch(() => {});
      micCtxRef.current = null;
      setMicStatus("denied");
    }
  }, [capabilities, micStatus]);

  const stopMic = useCallback(() => {
    breathRef.current?.stop();
    voiceRef.current?.stop();
    breathRef.current = null;
    voiceRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (micCtxRef.current) {
      void micCtxRef.current.close().catch(() => {});
      micCtxRef.current = null;
    }
    setBreath(null);
    setVoice(null);
    setMicStatus("idle");
  }, []);

  const startPosture = useCallback(async () => {
    if (!capabilities?.deviceMotion) {
      setPostureStatus("unsupported");
      return;
    }
    if (postureStatus === "running" || postureStatus === "starting") return;
    setPostureStatus("starting");
    const granted = await requestMotion();
    setMotionPermission(getPermission("motion"));
    if (!granted) {
      setPostureStatus("denied");
      return;
    }
    const sensor = new PostureSensor();
    postureRef.current = sensor;
    sensor.subscribe(setPosture);
    sensor.start();
    setPostureStatus("running");
  }, [capabilities, postureStatus]);

  const stopPosture = useCallback(() => {
    postureRef.current?.stop();
    postureRef.current = null;
    setPosture(null);
    setPostureStatus("idle");
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      hrvRef.current?.stop();
      breathRef.current?.stop();
      voiceRef.current?.stop();
      postureRef.current?.stop();
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (micCtxRef.current) {
        void micCtxRef.current.close().catch(() => {});
        micCtxRef.current = null;
      }
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
      motionPermission,
      hrv,
      breath,
      voice,
      posture,
      coherence,
      cameraStatus,
      micStatus,
      postureStatus,
      startCamera,
      stopCamera,
      startMic,
      stopMic,
      startPosture,
      stopPosture,
      setTargetBreathBpm,
    }),
    [
      capabilities,
      cameraPermission,
      micPermission,
      motionPermission,
      hrv,
      breath,
      voice,
      posture,
      coherence,
      cameraStatus,
      micStatus,
      postureStatus,
      startCamera,
      stopCamera,
      startMic,
      stopMic,
      startPosture,
      stopPosture,
    ],
  );

  return <BioCtx.Provider value={value}>{children}</BioCtx.Provider>;
}

export function useBiometrics(): BiometricContextValue | null {
  return useContext(BioCtx);
}
