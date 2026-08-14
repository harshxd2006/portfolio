let scheduled = false;

/** Preload tunnel texture only — skip heavy GLB models not used in the main flow. */
export function scheduleAssetPreload() {
  if (scheduled || typeof window === 'undefined') return;
  scheduled = true;

  const run = () => {
    const img = new Image();
    img.src = '/textures/tunnel-lines-min.jpg';
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2000 });
    return;
  }

  window.setTimeout(run, 1200);
}
