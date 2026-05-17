/** Shared caps for WebGL / canvas — keeps visuals, lowers GPU load. */
export function getGraphicsProfile() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  const lowPower = reducedMotion || cores <= 4 || lowMemory;

  return {
    reducedMotion,
    lowPower,
    pixelRatio: Math.min(window.devicePixelRatio || 1, lowPower ? 1.2 : 1.5),
    targetFps: lowPower ? 30 : 48,
    antialias: !lowPower,
    bloomScale: lowPower ? 0.4 : 0.5,
  };
}

export function createFpsGate(targetFps) {
  const interval = 1000 / targetFps;
  let last = 0;
  return (now) => {
    if (now - last < interval) return false;
    last = now;
    return true;
  };
}

export function shouldRenderGraphics() {
  return !document.hidden;
}
