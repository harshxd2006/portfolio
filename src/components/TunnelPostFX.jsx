import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { LUTPass } from 'three/examples/jsm/postprocessing/LUTPass.js';
import { loadCubeLut } from '../utils/loadCubeLut';

const LUT_URL = '/luts/lut-R04.cube';
const LUT_INTENSITY = 0.88;

export default function TunnelPostFX({ pausedRef, enabled = true }) {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef(null);
  const lutPassRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const lutPass = new LUTPass({ intensity: LUT_INTENSITY });
    composer.addPass(lutPass);
    composerRef.current = composer;
    lutPassRef.current = lutPass;

    let disposed = false;
    loadCubeLut(LUT_URL)
      .then((texture) => {
        if (!disposed && lutPassRef.current) {
          lutPassRef.current.lut = texture;
        }
      })
      .catch((err) => {
        console.warn('[TunnelPostFX] LUT load failed:', err);
      });

    return () => {
      disposed = true;
      const lut = lutPassRef.current?.lut;
      lut?.dispose?.();
      composer.dispose();
      composerRef.current = null;
      lutPassRef.current = null;
    };
  }, [enabled, gl, scene, camera]);

  useEffect(() => {
    composerRef.current?.setSize(size.width, size.height);
  }, [size]);

  useFrame(() => {
    if (!enabled || pausedRef.current || !composerRef.current) return;
    gl.clear();
    composerRef.current.render();
  }, 1);

  return null;
}
