const assets = ['/models/chip.glb', '/models/tunnel.glb'];
let scheduled = false;

/**
 * Warm GPU assets after the loader without pulling drei/three into the loader
 * chunk. Missing files are ignored because the runtime has visual fallbacks.
 */
export function scheduleAssetPreload() {
  if (scheduled || typeof window === 'undefined') return;
  scheduled = true;

  const preload = async () => {
    const { useGLTF } = await import('@react-three/drei');

    await Promise.allSettled(
      assets.map(async (url) => {
        const res = await fetch(url, { method: 'HEAD' });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && !contentType.includes('text/html')) {
          useGLTF.preload(url);
        }
      }),
    );
  };

  const run = () => {
    preload().catch(() => {
      // Scene components already include fallbacks for unavailable assets.
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 1800 });
    return;
  }

  window.setTimeout(run, 900);
}
