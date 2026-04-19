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

/** Defensive boolean probe — never throws, even if a Web API is misbehaving. */
function safeBool(probe: () => boolean): boolean {
  try {
    return !!probe();
  } catch {
    return false;
  }
}

export function detectCapabilities(): Capabilities {
  if (typeof window === "undefined") return { ...FALSE_MATRIX };

  try {
    const nav = window.navigator;
    const ua = nav.userAgent ?? "";

    const isIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isAndroid = /Android/.test(ua);
    const isSafari =
      /^((?!chrome|android).)*safari/i.test(ua) ||
      (isIos && /AppleWebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua));

    const isStandalonePwa = safeBool(() => {
      const mm = window.matchMedia?.bind(window);
      const standalone = mm ? mm("(display-mode: standalone)").matches : false;
      const iosStandalone =
        (nav as unknown as { standalone?: boolean }).standalone === true;
      return standalone || iosStandalone;
    });

    const webgl2 = safeBool(() => {
      const c = document.createElement("canvas");
      return !!c.getContext("webgl2");
    });

    const webaudio =
      typeof window.AudioContext !== "undefined" ||
      typeof (window as unknown as { webkitAudioContext?: unknown })
        .webkitAudioContext !== "undefined";

    // BaseAudioContext.prototype.audioWorklet is a WebIDL getter that
    // throws "Illegal invocation" when accessed without a real instance.
    // Use the `in` operator only — it inspects the property descriptor
    // without invoking the getter.
    const audioWorklet = safeBool(() => {
      if (!webaudio) return false;
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      return !!Ctor && "audioWorklet" in Ctor.prototype;
    });

    return {
      webgpu: safeBool(() => "gpu" in nav),
      webgl2,
      webaudio,
      audioWorklet,
      deviceOrientation: safeBool(() => "DeviceOrientationEvent" in window),
      deviceMotion: safeBool(() => "DeviceMotionEvent" in window),
      ambientLightSensor: safeBool(() => "AmbientLightSensor" in window),
      wakeLock: safeBool(() => "wakeLock" in nav),
      vibration: safeBool(() => typeof nav.vibrate === "function"),
      webBluetooth: safeBool(() => "bluetooth" in nav),
      webMidi: safeBool(
        () =>
          typeof (nav as unknown as { requestMIDIAccess?: unknown })
            .requestMIDIAccess === "function",
      ),
      webNfc: safeBool(() => "NDEFReader" in window),
      webXr: safeBool(() => "xr" in nav),
      serviceWorker: safeBool(() => "serviceWorker" in nav),
      pushApi: safeBool(() => "PushManager" in window),
      notifications: safeBool(() => "Notification" in window),
      badging: safeBool(() => "setAppBadge" in nav),
      pictureInPicture: safeBool(() => "pictureInPictureEnabled" in document),
      speechRecognition: safeBool(
        () =>
          "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
      ),
      paymentRequest: safeBool(() => "PaymentRequest" in window),
      fileSystemAccess: safeBool(() => "showOpenFilePicker" in window),
      hasMediaDevices: safeBool(() => !!nav.mediaDevices?.getUserMedia),
      hasTorch: isAndroid ? "likely" : isIos ? "no" : "unknown",
      isStandalonePwa,
      isIos,
      isAndroid,
      isSafari,
    };
  } catch {
    // If anything goes catastrophically wrong, return a safe matrix
    // rather than letting the capability probe take down the gland.
    return { ...FALSE_MATRIX };
  }
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
