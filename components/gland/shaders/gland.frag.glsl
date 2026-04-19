// Pinara — gland fragment shader (WebGL2 fallback path)
// Bioluminescent rim + fake SSS via fresnel + inner radial light.

precision highp float;

uniform float uTime;
uniform float uBreath;
uniform float uPulse;
uniform float uIntensity;     // 0..1, dimmable for darkness mode
uniform vec3 uRim;             // bioluminescent rim colour (intent)
uniform vec3 uInner;           // inner light colour (intent)
uniform vec3 uAccent;          // micro-noise accent
uniform float uSchumannAmp;    // 0..1, modulates inner glow rate

varying vec3 vNormalW;
varying vec3 vViewDirW;
varying vec3 vWorldPos;
varying vec3 vObjectPos;

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

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(vViewDirW);

  // Fresnel rim — strong on grazing angles.
  float fresnel = pow(1.0 - max(0.0, dot(N, V)), 2.5);

  // Fake SSS: brighten faces pointing away from camera (back-lit feel).
  float backLit = pow(max(0.0, -dot(N, V)) * 0.5 + 0.5, 1.6);

  // Inner light: radial gradient from object centre, modulated by noise
  // and by Schumann amplitude / breath.
  float r = length(vObjectPos);
  float innerGlow = smoothstep(1.05, 0.0, r);
  float t = uTime * (0.3 + 0.6 * uSchumannAmp);
  float n = vnoise(vObjectPos * 3.5 + vec3(t, t * 0.6, t * 1.3));
  innerGlow *= 0.6 + 0.4 * n;
  innerGlow *= 0.8 + 0.2 * uBreath + 0.15 * uPulse;

  // Chromatic noise — "living tissue" texture, very subtle.
  float micro = vnoise(vObjectPos * 18.0 + uTime * 0.4) * 0.06;

  vec3 col = uInner * (0.55 * backLit + 0.6 * innerGlow);
  col += uRim * fresnel * (0.85 + 0.15 * uPulse);
  col += uAccent * micro;

  col *= uIntensity;

  // Tone-map gently for OLED black backgrounds.
  col = col / (1.0 + col);

  gl_FragColor = vec4(col, 1.0);
}
