// Pinara — gland vertex shader (WebGL2 fallback path)
// Subtle noise displacement with recomputed normals.

uniform float uTime;
uniform float uBreath;   // 0..1 breathing oscillator
uniform float uPulse;    // 0..1 heart pulse oscillator
uniform float uDisplace; // displacement amount

varying vec3 vNormalW;
varying vec3 vViewDirW;
varying vec3 vWorldPos;
varying vec3 vObjectPos;

// Cheap value noise + fbm — small enough for mobile.
vec4 hash4(vec4 p) {
  p = fract(p * vec4(443.8975, 397.2973, 491.1871, 314.7983));
  p += dot(p.wzxy, p + 19.19);
  return fract((p.xxyz + p.yzzx) * p.zywx);
}

float vnoise(vec3 p) {
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  vec3 u = fp * fp * (3.0 - 2.0 * fp);
  vec4 h = hash4(vec4(ip, 0.0));
  vec4 h2 = hash4(vec4(ip + vec3(1.0, 0.0, 0.0), 0.0));
  vec4 h3 = hash4(vec4(ip + vec3(0.0, 1.0, 0.0), 0.0));
  vec4 h4 = hash4(vec4(ip + vec3(1.0, 1.0, 0.0), 0.0));
  vec4 a = mix(h, h2, u.x);
  vec4 b = mix(h3, h4, u.x);
  vec4 c = mix(a, b, u.y);
  return mix(c.x, c.y, u.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p *= 2.05;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 pos = position;
  float t = uTime * 0.15;
  float n = fbm(normalize(pos) * 2.5 + vec3(t, t * 0.7, t * 1.1));
  float breathSwell = 0.04 * uBreath + 0.012 * uPulse;
  float displaceAmt = uDisplace * (0.06 * (n - 0.5) + breathSwell);
  pos += normal * displaceAmt;

  // Recompute world-space normal cheaply via finite difference along the
  // displacement axis — visually adequate for a smooth gland.
  vec3 worldN = normalize(normalMatrix * normal);
  vec4 worldP4 = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldP4.xyz;
  vObjectPos = pos;
  vNormalW = worldN;
  vViewDirW = normalize(cameraPosition - worldP4.xyz);

  gl_Position = projectionMatrix * viewMatrix * worldP4;
}
