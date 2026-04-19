/**
 * Permission infrastructure — typed state per resource, persisted
 * locally so we never re-prompt within one device.
 *
 * Browsers expose two permission APIs: the Permissions API
 * (`navigator.permissions.query`), which is read-only and partial
 * across vendors, and the gesture-driven request methods
 * (`getUserMedia`, `Notification.requestPermission`, etc.). Pinara
 * tracks both: the live browser state and the user's most recent
 * explicit choice inside the app.
 */

import type { Locale } from "./i18n";

export type PermissionResource =
  | "camera"
  | "microphone"
  | "motion"
  | "geolocation"
  | "notifications";

export type PermissionState =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied"
  | "dismissed";

export type PermissionRecord = {
  state: PermissionState;
  /** Unix ms */
  decidedAt: number | null;
};

const LS_KEY = "pinara.permissions";

const DEFAULT: Record<PermissionResource, PermissionRecord> = {
  camera: { state: "unknown", decidedAt: null },
  microphone: { state: "unknown", decidedAt: null },
  motion: { state: "unknown", decidedAt: null },
  geolocation: { state: "unknown", decidedAt: null },
  notifications: { state: "unknown", decidedAt: null },
};

function read(): Record<PermissionResource, PermissionRecord> {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<
      Record<PermissionResource, PermissionRecord>
    >;
    return { ...DEFAULT, ...parsed };
  } catch {
    return { ...DEFAULT };
  }
}

function write(records: Record<PermissionResource, PermissionRecord>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(records));
  } catch {
    // quota exceeded / private mode — silent
  }
}

export function getPermission(resource: PermissionResource): PermissionRecord {
  return read()[resource];
}

export function setPermission(
  resource: PermissionResource,
  state: PermissionState,
): PermissionRecord {
  const records = read();
  const next: PermissionRecord = { state, decidedAt: Date.now() };
  records[resource] = next;
  write(records);
  return next;
}

/**
 * Request camera + (optionally) torch. Resolves with the MediaStream
 * on success or null on failure / user denial. Persists the resulting
 * state.
 */
export async function requestCamera(opts?: {
  facingMode?: "user" | "environment";
  torch?: boolean;
}): Promise<MediaStream | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    setPermission("camera", "denied");
    return null;
  }
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: opts?.facingMode ?? "environment",
      width: { ideal: 320 },
      height: { ideal: 240 },
      frameRate: { ideal: 30, max: 60 },
      ...(opts?.torch
        ? // Torch is exposed via `advanced` constraints; not honoured
          // by every browser, but harmless when ignored.
          ({ advanced: [{ torch: true } as MediaTrackConstraintSet] } as MediaTrackConstraints)
        : {}),
    },
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setPermission("camera", "granted");
    return stream;
  } catch (err) {
    const name = (err as Error).name;
    setPermission(
      "camera",
      name === "NotAllowedError" || name === "PermissionDeniedError"
        ? "denied"
        : "dismissed",
    );
    return null;
  }
}

/**
 * Request the front-facing camera (no torch). Used by FaceMesh.
 * Returns null on failure / denial. Mutually exclusive with
 * `requestCamera({ facingMode: 'environment' })` on mobile because
 * the platform can only open one camera at a time.
 */
export async function requestCameraFront(): Promise<MediaStream | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    setPermission("camera", "denied");
    return null;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
      },
    });
    setPermission("camera", "granted");
    return stream;
  } catch (err) {
    const name = (err as Error).name;
    setPermission(
      "camera",
      name === "NotAllowedError" || name === "PermissionDeniedError"
        ? "denied"
        : "dismissed",
    );
    return null;
  }
}

/**
 * Request microphone. Constraints minimise echo cancellation /
 * gain control because we want raw envelope information.
 */
export async function requestMicrophone(): Promise<MediaStream | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    setPermission("microphone", "denied");
    return null;
  }
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
      channelCount: 1,
      sampleRate: 48000,
    },
    video: false,
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setPermission("microphone", "granted");
    return stream;
  } catch (err) {
    const name = (err as Error).name;
    setPermission(
      "microphone",
      name === "NotAllowedError" ? "denied" : "dismissed",
    );
    return null;
  }
}

/**
 * iOS 13+ requires an explicit user-gesture-driven request for
 * DeviceMotion / DeviceOrientation. Other platforms grant by default.
 */
export async function requestMotion(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const Ctor = (window as unknown as {
    DeviceMotionEvent?: { requestPermission?: () => Promise<"granted" | "denied"> };
  }).DeviceMotionEvent;
  if (Ctor?.requestPermission) {
    try {
      const result = await Ctor.requestPermission();
      const granted = result === "granted";
      setPermission("motion", granted ? "granted" : "denied");
      return granted;
    } catch {
      setPermission("motion", "dismissed");
      return false;
    }
  }
  setPermission("motion", "granted");
  return true;
}

/**
 * Standard i18n key shape for prompt copy.
 * `permission.<resource>.prompt` resolves to a sentence beginning with
 * "Pinara uses..." and ending with "Data never leaves your device."
 */
export function promptKey(resource: PermissionResource): string {
  return `permission.${resource}.prompt`;
}

export function localiseStateLabel(state: PermissionState, locale: Locale): string {
  const map: Record<Locale, Record<PermissionState, string>> = {
    en: {
      unknown: "Not asked",
      prompt: "Awaiting choice",
      granted: "Granted",
      denied: "Denied",
      dismissed: "Dismissed",
    },
    lt: {
      unknown: "Neprašyta",
      prompt: "Laukiama pasirinkimo",
      granted: "Suteikta",
      denied: "Atmesta",
      dismissed: "Atidėta",
    },
  };
  return map[locale][state];
}
