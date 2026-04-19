"use client";

/**
 * GlandWebGPU — Phase 1 placeholder.
 *
 * The mega spec routes here when WebGPU is available; the Phase 1 ship
 * floor is the WebGL2 fallback. This component currently delegates to
 * GlandWebGL so device capability detection can already exercise the
 * routing surface end-to-end. Phase 3 will replace the body with a
 * WGSL ray-marched SDF gland.
 */

import { GlandWebGL, type GlandWebGLProps } from "./GlandWebGL";

export type GlandWebGPUProps = GlandWebGLProps;

export function GlandWebGPU(props: GlandWebGPUProps) {
  return <GlandWebGL {...props} />;
}
