import { describe, expect, it } from "vitest";
import { LOCALES, STRINGS, missingKeys, resolveLocale, t } from "@/lib/i18n";

describe("i18n", () => {
  it("has both en and lt locales", () => {
    expect(LOCALES).toEqual(["en", "lt"]);
    expect(STRINGS.en).toBeTruthy();
    expect(STRINGS.lt).toBeTruthy();
  });

  it("has full key parity between en and lt — no English fallbacks visible in LT", () => {
    expect(missingKeys()).toEqual([]);
  });

  it("falls back to English when a key is unknown", () => {
    expect(t("en", "this.does.not.exist")).toBe("this.does.not.exist");
    expect(t("lt", "this.does.not.exist")).toBe("this.does.not.exist");
  });

  it("resolves /lt prefix as Lithuanian", () => {
    expect(resolveLocale("/lt")).toBe("lt");
    expect(resolveLocale("/lt/")).toBe("lt");
    expect(resolveLocale("/")).toBe("en");
    expect(resolveLocale("/anything-else")).toBe("en");
  });
});
