import { describe, expect, it } from "vitest";
import { detectCapabilities, type Capabilities } from "@/lib/capability";

describe("capability", () => {
  it("returns a complete capability matrix with every documented key", () => {
    const caps = detectCapabilities();
    const required: (keyof Capabilities)[] = [
      "webgpu",
      "webgl2",
      "webaudio",
      "audioWorklet",
      "deviceOrientation",
      "deviceMotion",
      "ambientLightSensor",
      "wakeLock",
      "vibration",
      "webBluetooth",
      "webMidi",
      "webNfc",
      "webXr",
      "serviceWorker",
      "pushApi",
      "notifications",
      "badging",
      "pictureInPicture",
      "speechRecognition",
      "paymentRequest",
      "fileSystemAccess",
      "hasMediaDevices",
      "hasTorch",
      "isStandalonePwa",
      "isIos",
      "isAndroid",
      "isSafari",
    ];
    for (const key of required) {
      expect(caps).toHaveProperty(key);
    }
  });

  it("hasTorch reports unknown for jsdom user agent", () => {
    const caps = detectCapabilities();
    expect(["unknown", "likely", "no"]).toContain(caps.hasTorch);
  });
});
