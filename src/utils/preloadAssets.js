import { useGLTF } from '@react-three/drei';

/**
 * Warm GPU assets during loader — reduces first-frame hitch.
 * Only preload assets if they are actually available on the server to avoid
 * throwing errors during module import when files are missing (dev server
 * may return HTML for missing files which breaks the GLTF parser).
 */
const assets = ['/models/chip.glb', '/models/tunnel.glb'];
assets.forEach((url) => {
	// Fire-and-forget: check existence then preload if present
	(async () => {
		try {
			const res = await fetch(url, { method: 'HEAD' });
			if (res.ok) {
				useGLTF.preload(url);
			}
		} catch (e) {
			// ignore network errors — we'll fallback to the canvas 2D or legacy scene
		}
	})();
});
