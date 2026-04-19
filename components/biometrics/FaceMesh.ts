/**
 * FaceMesh — Streams 4–6 (face landmarks + eye + pupil).
 *
 * Wraps MediaPipe Face Landmarker. The package is dynamically
 * imported on first start so / and /lt don't pull ~600 KB of
 * MediaPipe JS into the initial bundle. Model + WASM are fetched
 * from Google CDN on first start (~3 MB model, ~600 KB WASM
 * runtime); Phase 2.3 will add Service Worker caching.
 *
 * Camera: front-facing. Conflicts with HRVCamera (rear) on mobile
 * where only one camera can be open at once — BiometricContext
 * enforces mutual exclusion.
 */

import {
  averageEAR,
  averageGaze,
  EAR_BLINK_THRESHOLD,
  type Landmark,
} from "./eye";
import { averageRelativePupil } from "./pupil";

export type FaceReading = {
  /** True when MediaPipe found a face in the latest frame */
  facePresent: boolean;
  /** Approximate confidence — 1.0 when present, 0 otherwise */
  confidence: number;
};

export type EyeReading = {
  /** Eye Aspect Ratio averaged across both eyes; ~0.30 open, <0.20 closed */
  ear: number;
  eyesClosed: boolean;
  /** Blinks per minute over the last ~minute */
  blinkRate: number | null;
  /** Gaze direction: x in [-1,1] (left/right), y in [-1,1] (up/down) */
  gaze: { x: number; y: number } | null;
};

export type PupilReading = {
  /** Iris diameter / eye width; typical resting 0.42–0.50 */
  relativeSize: number | null;
};

export type FaceFrame = {
  face: FaceReading;
  eye: EyeReading;
  pupil: PupilReading;
};

const BLINK_HISTORY_MS = 60_000; // count blinks over the last minute
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";

type Listener = (frame: FaceFrame) => void;

type LandmarkerLike = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => { faceLandmarks?: Landmark[][] };
  close?: () => void;
};

export class FaceMesh {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private landmarker: LandmarkerLike | null = null;
  private rafId: number | null = null;
  private blinkTimes: number[] = [];
  private earRecent: number[] = [];
  private wasOpen = true;
  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  async start(stream: MediaStream): Promise<void> {
    this.stop();
    this.stream = stream;

    // Dynamic import so the MediaPipe bundle only ships when face
    // mesh is actually requested.
    const mp = await import("@mediapipe/tasks-vision");
    const fileset = await mp.FilesetResolver.forVisionTasks(WASM_BASE);
    this.landmarker = (await mp.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFacialTransformationMatrixes: false,
      outputFaceBlendshapes: false,
    })) as unknown as LandmarkerLike;

    this.video = document.createElement("video");
    this.video.srcObject = stream;
    this.video.muted = true;
    this.video.playsInline = true;
    await this.video.play();

    const tick = () => {
      this.frame();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.landmarker?.close?.();
    this.landmarker = null;
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.blinkTimes = [];
    this.earRecent = [];
    this.wasOpen = true;
  }

  private frame(): void {
    if (!this.landmarker || !this.video || this.video.readyState < 2) return;
    const ts = performance.now();
    const result = this.landmarker.detectForVideo(this.video, ts);
    const landmarks = result.faceLandmarks?.[0];

    if (!landmarks || landmarks.length === 0) {
      this.emit({
        face: { facePresent: false, confidence: 0 },
        eye: { ear: 0, eyesClosed: false, blinkRate: null, gaze: null },
        pupil: { relativeSize: null },
      });
      return;
    }

    const ear = averageEAR(landmarks);
    const closed = ear < EAR_BLINK_THRESHOLD;
    if (this.wasOpen && closed) {
      this.blinkTimes.push(ts);
      const cutoff = ts - BLINK_HISTORY_MS;
      while (this.blinkTimes.length > 0 && this.blinkTimes[0] < cutoff) {
        this.blinkTimes.shift();
      }
    }
    this.wasOpen = !closed;

    this.earRecent.push(ear);
    if (this.earRecent.length > 30) this.earRecent.shift();

    const blinkRate =
      this.blinkTimes.length > 0
        ? (this.blinkTimes.length / BLINK_HISTORY_MS) * 60_000
        : null;

    const gaze = averageGaze(landmarks);
    const relativeSize = averageRelativePupil(landmarks);

    this.emit({
      face: { facePresent: true, confidence: 1 },
      eye: {
        ear: Math.round(ear * 1000) / 1000,
        eyesClosed: closed,
        blinkRate: blinkRate != null ? Math.round(blinkRate * 10) / 10 : null,
        gaze: gaze ? { x: round3(gaze.x), y: round3(gaze.y) } : null,
      },
      pupil: {
        relativeSize: relativeSize != null ? Math.round(relativeSize * 1000) / 1000 : null,
      },
    });
  }

  private emit(frame: FaceFrame): void {
    this.listeners.forEach((fn) => fn(frame));
  }
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
