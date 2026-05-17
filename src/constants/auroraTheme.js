/** Northern-lights palette shared by tunnel + chip background scenes */

export const AURORA_RGB = {
  mint: { r: 52, g: 255, b: 168 },
  teal: { r: 45, g: 212, b: 191 },
  cyan: { r: 34, g: 211, b: 238 },
  violet: { r: 139, g: 92, b: 246 },
  magenta: { r: 232, g: 121, b: 249 },
  indigo: { r: 99, g: 102, b: 241 },
};

export const AURORA_HEX = {
  ring: 0x2a4a3e,
  ringAlt: 0x3d2a6e,
  chipBody: 0x0a1420,
  chipDie: 0x142a38,
  chipMarkBg: '#1a2e3a',
  chipMarkFg: '#061018',
  star: 0x6ee7b7,
  scan: 0x22d3ee,
  floor: 0x030810,
  ambient: 0x1e3a32,
  key: 0xa7f3d0,
  rim: 0xc4b5fd,
  under: 0x064e3b,
};

/** GLSL vec3 (0–1) */
export const AURORA_GLSL = {
  tunnelEdge: 'vec3(0.12, 0.92, 0.62)',
  tunnelWarp: 'vec3(0.72, 0.38, 1.0)',
  tunnelBokehEdge: 'vec3(0.28, 0.55, 0.95)',
  chipSilver: 'vec3(0.45, 0.98, 0.82)',
  chipObsidian: 'vec3(0.03, 0.07, 0.11)',
  chipGlow: 'vec3(0.85, 0.45, 1.0)',
};

export function auroraRgba({ r, g, b }, alpha) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function lerpChannel(a, b, t) {
  return Math.round(a + (b - a) * t);
}

export function lerpAuroraRgb(from, to, t) {
  return {
    r: lerpChannel(from.r, to.r, t),
    g: lerpChannel(from.g, to.g, t),
    b: lerpChannel(from.b, to.b, t),
  };
}
