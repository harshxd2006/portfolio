import * as THREE from 'three';

/**
 * Parse Adobe .cube LUT text into a Data3DTexture for THREE.LUTPass.
 */
export function parseCubeLut(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  let size = 0;
  const rgb = [];

  for (const line of lines) {
    if (line.startsWith('LUT_3D_SIZE')) {
      size = Number.parseInt(line.split(/\s+/)[1], 10);
      continue;
    }
    if (
      line.startsWith('TITLE') ||
      line.startsWith('DOMAIN_') ||
      line.startsWith('LUT_1D')
    ) {
      continue;
    }

    const parts = line.split(/\s+/).map(Number);
    if (parts.length >= 3 && parts.every((n) => Number.isFinite(n))) {
      rgb.push(parts[0], parts[1], parts[2]);
    }
  }

  if (!size || size < 2) {
    throw new Error('Invalid .cube LUT: missing LUT_3D_SIZE');
  }

  const expected = size * size * size * 3;
  if (rgb.length < expected) {
    throw new Error(`Invalid .cube LUT: expected ${expected} values, got ${rgb.length}`);
  }

  const data = new Float32Array(size * size * size * 4);
  for (let i = 0; i < size * size * size; i += 1) {
    data[i * 4] = rgb[i * 3];
    data[i * 4 + 1] = rgb[i * 3 + 1];
    data[i * 4 + 2] = rgb[i * 3 + 2];
    data[i * 4 + 3] = 1;
  }

  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.FloatType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  texture.flipY = false;

  return texture;
}

export async function loadCubeLut(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load LUT: ${url} (${response.status})`);
  }
  return parseCubeLut(await response.text());
}
