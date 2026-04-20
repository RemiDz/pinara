import { describe, expect, it } from "vitest";
import { defaultIceServers, generateRoomCode } from "@/lib/webrtc";

describe("webrtc helpers", () => {
  it("generates a 6-character room code from the unambiguous alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    }
  });

  it("returns at least one ICE server", () => {
    const servers = defaultIceServers();
    expect(servers.length).toBeGreaterThan(0);
    expect(servers[0].urls).toBeTruthy();
  });
});
