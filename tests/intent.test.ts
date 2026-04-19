import { describe, expect, it } from "vitest";
import { INTENTS, SESSION_LENGTHS, getIntent } from "@/lib/intent";

describe("intent", () => {
  it("ships exactly the six locked archetypes", () => {
    expect(INTENTS.map((i) => i.id)).toEqual([
      "clear",
      "open",
      "see",
      "remember",
      "release",
      "rest",
    ]);
  });

  it("each intent has bilingual labels and a complete audio profile", () => {
    for (const intent of INTENTS) {
      expect(intent.label.en.length).toBeGreaterThan(0);
      expect(intent.label.lt.length).toBeGreaterThan(0);
      expect(intent.description.en.length).toBeGreaterThan(0);
      expect(intent.description.lt.length).toBeGreaterThan(0);
      expect(intent.audio.binauralCarrierHz).toBeGreaterThan(0);
      expect(intent.audio.binauralOffsetHz).toBeGreaterThan(0);
      expect(intent.audio.droneHz).toBeGreaterThan(0);
      expect(intent.audio.overtoneHz).toBeGreaterThan(0);
      expect(intent.audio.targetBreathBpm).toBeGreaterThan(0);
    }
  });

  it("six intents produce six audibly distinct binaural offsets", () => {
    const offsets = INTENTS.map((i) => i.audio.binauralOffsetHz);
    const unique = new Set(offsets);
    expect(unique.size).toBe(6);
  });

  it("locks session lengths at 11/22/33 free + 55/66 Pro", () => {
    expect(SESSION_LENGTHS.free).toEqual([11, 22, 33]);
    expect(SESSION_LENGTHS.pro).toEqual([11, 22, 33, 55, 66]);
  });

  it("getIntent returns the right one and throws for unknowns", () => {
    expect(getIntent("clear").id).toBe("clear");
    expect(() => getIntent("nope" as never)).toThrow();
  });
});
