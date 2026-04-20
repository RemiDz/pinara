import * as Tone from "tone";

/**
 * SpatialLayer — thin wrapper over Tone.Panner3D / Web Audio's
 * PannerNode in HRTF mode. Each gainable audio layer can be wrapped
 * in one to give it a fixed position in 3D space; the AudioEngine's
 * listener orientation is updated by DeviceOrientation when the user
 * opts in to head tracking (Phase 3.1).
 *
 * Position convention (right-handed, listener at origin facing -Z):
 *   binaural   — front centre, slightly close
 *   drone      — overhead dome
 *   harmonic   — front centre, far
 *   schumann   — surround (radius 4)
 *   isochronic — front centre
 */

export type Vec3 = { x: number; y: number; z: number };

export class SpatialLayer {
  private panner: Tone.Panner3D;

  constructor(position: Vec3) {
    this.panner = new Tone.Panner3D({
      panningModel: "HRTF",
      distanceModel: "inverse",
      refDistance: 1,
      maxDistance: 100,
      rolloffFactor: 1,
      positionX: position.x,
      positionY: position.y,
      positionZ: position.z,
    });
  }

  /** Use as the destination for a layer's start(). */
  get input(): Tone.ToneAudioNode {
    return this.panner;
  }

  connect(dest: Tone.ToneAudioNode): void {
    this.panner.connect(dest);
  }

  setPosition(p: Vec3): void {
    const t = Tone.now();
    this.panner.positionX.rampTo(p.x, 0.1, t);
    this.panner.positionY.rampTo(p.y, 0.1, t);
    this.panner.positionZ.rampTo(p.z, 0.1, t);
  }

  dispose(): void {
    this.panner.dispose();
  }
}

/** Default positions per layer name (used when spatial mode is on). */
export const DEFAULT_POSITIONS: Record<string, Vec3> = {
  binaural: { x: 0, y: 0, z: -1.0 },
  drone: { x: 0, y: 1.5, z: 0 },
  harmonic: { x: 0, y: 0, z: -3 },
  schumann: { x: 0, y: 0.5, z: 2 },
  isochronic: { x: 0, y: 0, z: -1.5 },
};
