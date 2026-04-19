/**
 * Capability detection — runtime feature matrix.
 *
 * Used by GlandContainer to choose the WebGPU vs WebGL render path,
 * by AudioEngine to choose AudioWorklet vs ScriptProcessor, and by
 * CapabilityBanner to show users which streams are active on their device.
 *
 * Detection is intentionally synchronous + cheap. Heavier probes
 * (e.g. requesting a GPUAdapter) live in async `probe*` helpers.
 */

export type Capabilities = {
  webgpu: boolean;
  webgl2: boolean;
  webaudio: boolean;
  audioWorklet: boolean;
  deviceOrientation: boolean;
  deviceMotion: boolean;
  ambientLightSensor: boolean;
  wakeLock: boolean;
  vibration: boolean;
  webBluetooth: boolean;
  webMidi: boolean;
  webNfc: boolean;
  webXr: boolean;
  serviceWorker: boolean;
  pushApi: boolean;
  notifications: boolean;
  badging: boolean;
  pictureInPicture: boolean;
  speechRecognition: boolean;
  paymentRequest: boolean;
  fileSystemAccess: boolean;
  hasMediaDevices: boolean;
  hasTorch: "unknown" | "likely" | "no";
  isStandalonePwa: boolean;
  isIos: boolean;
  isAndroid: boolean;
  isSafari: boolean;
};

const FALSE_MATRIX: Capabilities = {
  webgpu: false,
  webgl2: false,
  webaudio: false,
  audioWorklet: false,
  deviceOrientation: false,
  deviceMotion: false,
  ambientLightSensor: false,
  wakeLock: false,
  vibration: false,
  webBluetooth: false,
  webMidi: false,
  webNfc: false,
  webXr: false,
  serviceWorker: false,
  pushApi: false,
  notifications: false,
  badging: false,
  pictureInPicture: false,
  speechRecognition: false,
  paymentRequest: false,
  fileSystemAccess: false,
  hasMediaDevices: false,
  hasTorch: "unknown",
  isStandalonePwa: false,
  isIos: false,
  isAndroid: false,
  isSafari: false,
};

export function detectCapabilities(): Capabilities {
  if (typeof window === "undefined") return { ...FALSE_MATRIX };

  const nav = window.navigator;
  const ua = nav.userAgent ?? "";

  const isIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  const isAndroid = /Android/.test(ua);
  const isSafari =
    /^((?!chrome|android).)*safari/i.test(ua) ||
    (isIos && /AppleWebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua));

  const isStandalonePwa =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari special property
    (nav as unknown as { standalone?: boolean }).standalone === true;

  const webgl2 = (() => {
    try {
      const c = document.createElement("canvas");
      return !!c.getContext("webgl2");
    } catch {
      return false;
    }
  })();

  const webaudio = typeof window.AudioContext !== "undefined" ||
    typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !== "undefined";

  const audioWorklet = (() => {
    if (!webaudio) return false;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;
    return typeof Ctor.prototype.audioWorklet !== "undefined" ||
      "audioWorklet" in (Ctor.prototype as unknown as Record<string, unknown>);
  })();

  // Web Bluetooth, MIDI, NFC are Chromium-only; iOS Safari returns undefined.
  const webBluetooth = "bluetooth" in nav;
  const webMidi = typeof (nav as unknown as { requestMIDIAccess?: unknown }).requestMIDIAccess === "function";
  const webNfc = "NDEFReader" in window;
  const webXr = "xr" in nav;

  const ambientLightSensor = "AmbientLightSensor" in window;

  return {
    webgpu: "gpu" in nav,
    webgl2,
    webaudio,
    audioWorklet,
    deviceOrientation: "DeviceOrientationEvent" in window,
    deviceMotion: "DeviceMotionEvent" in window,
    ambientLightSensor,
    wakeLock: "wakeLock" in nav,
    vibration: typeof nav.vibrate === "function",
    webBluetooth,
    webMidi,
    webNfc,
    webXr,
    serviceWorker: "serviceWorker" in nav,
    pushApi: "PushManager" in window,
    notifications: "Notification" in window,
    badging: "setAppBadge" in nav,
    pictureInPicture: "pictureInPictureEnabled" in document,
    speechRecognition:
      "SpeechRecognition" in window ||
      "webkitSpeechRecognition" in window,
    paymentRequest: "PaymentRequest" in window,
    fileSystemAccess: "showOpenFilePicker" in window,
    hasMediaDevices: !!nav.mediaDevices?.getUserMedia,
    hasTorch: isAndroid ? "likely" : isIos ? "no" : "unknown",
    isStandalonePwa,
    isIos,
    isAndroid,
    isSafari,
  };
}

// Minimal structural type for what we actually use of WebGPU. Avoids
// pulling in @webgpu/types as a dependency for a single boolean probe.
type MinimalGPU = {
  requestAdapter: (opts?: { powerPreference?: "low-power" | "high-performance" }) => Promise<unknown | null>;
};

/**
 * Async WebGPU probe — only call when you actually need the adapter.
 * Returns true only when an adapter is genuinely obtainable; the
 * `gpu` property has historically returned a defined object on browsers
 * that then cannot acquire any adapter (e.g. early Safari WebGPU).
 */
export async function probeWebGPUAdapter(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return false;
  try {
    const gpu = (navigator as Navigator & { gpu?: MinimalGPU }).gpu;
    if (!gpu) return false;
    const adapter = await gpu.requestAdapter({ powerPreference: "low-power" });
    return adapter !== null && adapter !== undefined;
  } catch {
    return false;
  }
}

/**
 * Choose the gland render path. WebGPU is preferred only when an adapter
 * is actually obtainable — feature detection alone has produced false
 * positives historically (e.g. Safari on iOS 17.4 reports `gpu` exists
 * but adapter requests fail).
 */
export async function chooseGlandPath(): Promise<"webgpu" | "webgl2" | "none"> {
  const caps = detectCapabilities();
  if (caps.webgpu) {
    const ok = await probeWebGPUAdapter();
    if (ok) return "webgpu";
  }
  return caps.webgl2 ? "webgl2" : "none";
}
