/**
 * WebRTC helpers — Phase 6.
 *
 * Phase 6.0 ships a manual-signalling 1:N star topology where the
 * facilitator's tablet hosts and participant devices join via a
 * 6-character room code displayed as text + QR. There is no
 * dedicated signalling server; instead, the room code is encoded
 * into the URL and the SDP offer/answer pair is exchanged via copy-
 * paste in the harness. A relay (Cloudflare Durable Object or
 * similar) lands in Phase 6.1 along with auto-discovery.
 */

const ROOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // unambiguous

const STUN_URLS = (process.env.WEBRTC_STUN_URLS || "stun:stun.l.google.com:19302")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function generateRoomCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
  return s;
}

export function defaultIceServers(): RTCIceServer[] {
  return [{ urls: STUN_URLS }];
}

export type FieldMessage =
  | { kind: "tick"; t: number }
  | { kind: "pulse"; bpm: number; at: number }
  | { kind: "silence"; durationSec: number; at: number }
  | { kind: "intent"; intent: string }
  | { kind: "join"; deviceName: string }
  | { kind: "leave"; deviceName: string };

export async function createOffer(pc: RTCPeerConnection): Promise<string> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceGathering(pc);
  return JSON.stringify(pc.localDescription);
}

export async function acceptOffer(pc: RTCPeerConnection, offerJson: string): Promise<string> {
  const offer = JSON.parse(offerJson) as RTCSessionDescriptionInit;
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForIceGathering(pc);
  return JSON.stringify(pc.localDescription);
}

export async function applyAnswer(pc: RTCPeerConnection, answerJson: string): Promise<void> {
  const answer = JSON.parse(answerJson) as RTCSessionDescriptionInit;
  await pc.setRemoteDescription(answer);
}

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const onChange = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", onChange);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", onChange);
    // Safety timeout so we don't hang forever on a bad network.
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    }, 5000);
  });
}
