import { beforeEach, describe, expect, it } from "vitest";
import { currentTier, isPractitioner, isPro, readLicense, setTier } from "@/lib/license";

beforeEach(() => {
  window.localStorage.clear();
});

describe("license", () => {
  it("defaults to free", () => {
    expect(readLicense().tier).toBe("free");
    expect(currentTier()).toBe("free");
    expect(isPro()).toBe(false);
    expect(isPractitioner()).toBe(false);
  });

  it("sets pro and reports it as Pro", () => {
    setTier("pro", "ORDER-1");
    expect(currentTier()).toBe("pro");
    expect(isPro()).toBe(true);
    expect(isPractitioner()).toBe(false);
  });

  it("practitioner implies pro", () => {
    setTier("practitioner");
    expect(isPro()).toBe(true);
    expect(isPractitioner()).toBe(true);
  });

  it("offline grace expires after 30 days and downgrades to free", () => {
    setTier("pro");
    const stored = JSON.parse(window.localStorage.getItem("pinara.license") ?? "{}");
    stored.validatedAt = Date.now() - 31 * 86_400_000;
    window.localStorage.setItem("pinara.license", JSON.stringify(stored));
    expect(currentTier()).toBe("free");
  });
});
