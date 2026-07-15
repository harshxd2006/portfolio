import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bounds, Center, useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AURORA_HEX } from '../constants/auroraTheme';
import { pickAnimationClip } from '../utils/pickAnimationClip';
import { getGraphicsProfile } from '../utils/graphicsPerf';
import ChipSceneLegacy from './ChipSceneLegacy';

const CHIP_URL = '/models/chip.glb';

// Note: we avoid calling useGLTF at module evaluation time if the file might be
// missing (dev server may return HTML which breaks the GLTF parser). We still
// preload where possible, but ChipGLBScene will check availability before
// attempting to render the GLTF-powered canvas.
// useGLTF.preload(CHIP_URL);

function applyAuroraChipMaterials(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;

    const source = child.material;
    const map = source?.map ?? null;
    const normalMap = source?.normalMap ?? null;

    child.material = new THREE.MeshStandardMaterial({
      color: AURORA_HEX.chipDie,
      map,
      normalMap,
      metalness: 0.48,
      roughness: 0.58,
      emissive: new THREE.Color(0x0d3028),
      emissiveIntensity: 0.35,
    });
    child.castShadow = false;
    child.receiveShadow = false;
  });
}

function AnimatedChipModel({ pausedRef }) {
  const rootRef = useRef();
  const { scene, animations } = useGLTF(CHIP_URL);
  const { actions } = useAnimations(animations, rootRef);
  const clipNameRef = useRef(null);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    applyAuroraChipMaterials(clone);
    return clone;
  }, [scene]);

  useEffect(() => {
    if (!actions || !animations?.length) {
      if (import.meta.env.DEV) {
        console.info('[ChipGLB] No animations in chip.glb — static model only.');
      }
      return undefined;
    }

    if (import.meta.env.DEV) {
      console.info('[ChipGLB] Available clips:', animations.map((c) => c.name));
    }

    const clipName = pickAnimationClip(actions, animations);
    clipNameRef.current = clipName;
    const action = clipName ? actions[clipName] : null;

    if (!action) return undefined;

    action.reset().fadeIn(0.4).play();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;

    return () => {
      Object.values(actions).forEach((a) => a?.stop());
    };
  }, [actions, animations]);

  // Invalidate on each frame to keep demand-mode rendering
  useFrame(({ invalidate }) => {
    if (!pausedRef.current) invalidate();
  });

  return (
    <group ref={rootRef}>
      <Center>
        <primitive object={model} scale={1} />
      </Center>
    </group>
  );
}

function ChipCamera({ pausedRef }) {
  const angle = useRef(0);

  useFrame((state, delta) => {
    if (pausedRef.current) return;
    state.invalidate();
    angle.current += delta * 0.12;
    const { camera } = state;
    camera.position.set(
      Math.sin(angle.current) * 2.4,
      1.2 + Math.sin(angle.current * 0.7) * 0.2,
      5.5 + Math.cos(angle.current * 0.8) * 0.6,
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function ChipLights() {
  return (
    <>
      <ambientLight intensity={0.35} color={AURORA_HEX.ambient} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} color={AURORA_HEX.key} />
      <directionalLight position={[-4, 3, -2]} intensity={0.55} color={AURORA_HEX.rim} />
    </>
  );
}

function ChipCanvas({ pausedRef, perf }) {
  return (
    <Canvas
      className="h-full w-full"
      dpr={[0.75, perf.lowPower ? 1 : 1.25]}
      camera={{ position: [0, 1.2, 6], fov: 42, near: 0.1, far: 100 }}
      gl={{
        antialias: perf.antialias,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      frameloop="demand"
      performance={{ min: 0.5, debounce: 200 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 1);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 12, 40]} />
      <ChipLights />
      <Bounds fit clip observe margin={1.35}>
        <Suspense fallback={null}>
          <AnimatedChipModel pausedRef={pausedRef} />
        </Suspense>
      </Bounds>
      <ChipCamera pausedRef={pausedRef} />
    </Canvas>
  );
}

export default function ChipGLBScene(props) {
  const { active = true } = props;
  const pausedRef = useRef(!active);
  const perf = useMemo(() => getGraphicsProfile(), []);
  const [available, setAvailable] = useState(null); // null = checking, false = missing

  useEffect(() => {
    pausedRef.current = !active;
  }, [active]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(CHIP_URL, { method: 'HEAD' });
        if (!canceled) {
          const contentType = res.headers.get('content-type') || '';
          const isHtml = contentType.includes('text/html');
          setAvailable(res.ok && !isHtml);
        }
      } catch (e) {
        if (!canceled) setAvailable(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  // While checking availability or if not active, render the legacy/2D fallback
  if (!active || available !== true) {
    if (active && available === false) {
      return <ChipSceneLegacy {...props} />;
    }
    return <div className="background-canvas-host" aria-hidden="true"><Suspense fallback={null}><></></Suspense><ChipCanvasFallback /></div>;
  }

  return (
    <div className="background-canvas-host" aria-hidden="true">
      <ChipCanvas pausedRef={pausedRef} perf={perf} />
    </div>
  );
}

// Minimal fallback that mirrors the legacy component structure without importing it
function ChipCanvasFallback() {
  // Render nothing; ChipSceneLegacy will be used by the error boundary if needed.
  return null;
}
