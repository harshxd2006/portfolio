/** Shared caps for WebGL / canvas — keeps visuals, lowers GPU load. */

let _cachedProfile = null;

export function getGraphicsProfile() {
  if (_cachedProfile) return _cachedProfile;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  const isMobile =
    window.matchMedia('(max-width: 768px)').matches ||
    (window.matchMedia('(pointer: coarse)').matches && window.innerWidth <= 1024);
  const lowPower = reducedMotion || cores <= 4 || lowMemory || isMobile;

  _cachedProfile = {
    reducedMotion,
    lowPower,
    isMobile,
    /** Use Canvas 2D tunnel instead of WebGL — much lighter on phones/tablets. */
    prefer2DTunnel: isMobile || lowMemory || cores <= 2,
    pixelRatio: Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.25),
    targetFps: lowPower ? 45 : 60,
    antialias: !lowPower,
    bloomScale: lowPower ? 0.3 : 0.4,
    enableLut: false,
    enableBloom: !lowPower,
  };
  return _cachedProfile;
}

/**
 * Self-tuning FPS gate.
 * Starts at `targetFps` and auto-drops if the GPU can't keep up,
 * then recovers when headroom returns.
 */
export function createFpsGate(targetFps) {
  let interval = 1000 / targetFps;
  let last = 0;
  let currentTarget = targetFps;

  const samples = new Float32Array(10);
  let sampleIdx = 0;
  let sampleCount = 0;
  let checkCounter = 0;

  return (now) => {
    const delta = now - last;
    if (delta < interval) return false;

    samples[sampleIdx] = delta;
    sampleIdx = (sampleIdx + 1) % samples.length;
    if (sampleCount < samples.length) sampleCount++;
    checkCounter++;

    if (checkCounter >= 30 && sampleCount >= 10) {
      checkCounter = 0;
      let sum = 0;
      for (let i = 0; i < sampleCount; i++) sum += samples[i];
      const avg = sum / sampleCount;

      if (avg > interval * 1.5 && currentTarget > 15) {
        currentTarget = Math.max(15, currentTarget - 5);
        interval = 1000 / currentTarget;
      } else if (avg < interval * 0.85 && currentTarget < targetFps) {
        currentTarget = Math.min(targetFps, currentTarget + 2);
        interval = 1000 / currentTarget;
      }
    }

    last = now;
    return true;
  };
}

/** Visibility check — skip rendering when tab is hidden. */
export function shouldRenderGraphics() {
  return !document.hidden;
}

/** Debounce helper for resize handlers. */
export function debounce(fn, ms) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
}

/** Throttle to at most once per rAF (for mousemove etc.) */
export function rafThrottle(fn) {
  let queued = false;
  let lastArgs = null;
  return (...args) => {
    lastArgs = args;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn(...lastArgs);
    });
  };
}
