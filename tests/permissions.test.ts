import { beforeEach, describe, expect, it } from "vitest";
import {
  getPermission,
  promptKey,
  setPermission,
  localiseStateLabel,
} from "@/lib/permissions";

describe("permissions storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reports unknown state for a never-asked resource", () => {
    const rec = getPermission("camera");
    expect(rec.state).toBe("unknown");
    expect(rec.decidedAt).toBeNull();
  });

  it("persists explicit choice across reads", () => {
    setPermission("camera", "granted");
    expect(getPermission("camera").state).toBe("granted");
  });

  it("does not bleed one resource's state into another", () => {
    setPermission("camera", "granted");
    setPermission("microphone", "denied");
    expect(getPermission("camera").state).toBe("granted");
    expect(getPermission("microphone").state).toBe("denied");
    expect(getPermission("motion").state).toBe("unknown");
  });

  it("produces the canonical i18n prompt key per resource", () => {
    expect(promptKey("camera")).toBe("permission.camera.prompt");
    expect(promptKey("microphone")).toBe("permission.microphone.prompt");
    expect(promptKey("notifications")).toBe("permission.notifications.prompt");
  });

  it("localises state labels in both locales", () => {
    expect(localiseStateLabel("granted", "en")).toBe("Granted");
    expect(localiseStateLabel("granted", "lt")).toBe("Suteikta");
    expect(localiseStateLabel("denied", "lt")).toBe("Atmesta");
  });
});
