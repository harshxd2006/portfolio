import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { AURORA_HEX } from '../constants/auroraTheme';
import { getGraphicsProfile, shouldRenderGraphics } from '../utils/graphicsPerf';

useTexture.preload('/textures/tunnel-lines-min.jpg');

const TUNNEL_LENGTH = 120;
const TUNNEL_RADIUS = 14;
const SCROLL_TRAVEL_RANGE = 320;

function createLinesMaterial(linesTex) {
  linesTex.colorSpace = THREE.SRGBColorSpace;
  linesTex.wrapS = THREE.RepeatWrapping;
  linesTex.wrapT = THREE.RepeatWrapping;
  linesTex.repeat.set(4, 24);
  linesTex.anisotropy = 2;

  return new THREE.MeshStandardMaterial({
    map: linesTex,
    emissiveMap: linesTex,
    emissive: new THREE.Color(0x34ffa8),
    emissiveIntensity: 1.85,
    color: new THREE.Color(0x03060a),
    metalness: 0.08,
    roughness: 0.92,
    side: THREE.BackSide,
    transparent: true,
    opacity: 1,
  });
}

function AuroraTunnelTube({ linesTex, scrollDepthRef, warpRef, warpDecayRef }) {
  const tubeRef = useRef();
  const ringsRef = useRef();
  const emissiveRef = useRef(new THREE.Color(0x34ffa8));
  const hueRef = useRef(0);
  const travelRef = useRef(0);
  const perf = getGraphicsProfile();

  const { tubeGeo, ringGeos } = useMemo(() => {
    const segments = perf.lowPower ? 32 : 48;
    const tube = new THREE.CylinderGeometry(
      TUNNEL_RADIUS,
      TUNNEL_RADIUS,
      TUNNEL_LENGTH,
      segments,
      1,
      true,
    );
    tube.rotateX(Math.PI / 2);
    tube.translate(0, 0, -TUNNEL_LENGTH / 2);

    const ringCount = perf.lowPower ? 4 : 6;
    const torusSegments = perf.lowPower ? 36 : 48;
    const rings = [];
    for (let i = 0; i < ringCount; i += 1) {
      const ring = new THREE.TorusGeometry(TUNNEL_RADIUS, 0.04, 6, torusSegments);
      ring.rotateX(Math.PI / 2);
      rings.push(ring);
    }

    return { tubeGeo: tube, ringGeos: rings };
  }, [perf.lowPower]);

  const tubeMat = useMemo(() => createLinesMaterial(linesTex), [linesTex]);

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: AURORA_HEX.ring,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state, delta) => {
    const { invalidate, camera } = state;

    if (!shouldRenderGraphics()) return;

    invalidate();

    const scrollDepth = scrollDepthRef.current ?? 0;
    const warp = warpRef.current;

    if (performance.now() > warpDecayRef.current) {
      warpRef.current = THREE.MathUtils.lerp(warp, 0, 0.06);
    }

    const scrollTravel = scrollDepth * SCROLL_TRAVEL_RANGE;
    const warpBoost = warpRef.current * 55;
    const targetTravel = scrollTravel + warpBoost;
    travelRef.current = THREE.MathUtils.lerp(travelRef.current, targetTravel, 0.16);

    if (scrollDepth < 0.02) {
      travelRef.current += delta * 1.2;
    }

    linesTex.offset.y = travelRef.current * 0.02;

    hueRef.current = (hueRef.current + delta * (0.18 + scrollDepth * 0.35)) % 1;
    const t = hueRef.current;
    emissiveRef.current.setRGB(
      THREE.MathUtils.lerp(0.2, 0.72, t),
      THREE.MathUtils.lerp(1.0, 0.38, t),
      THREE.MathUtils.lerp(0.66, 1.0, t),
    );
    tubeMat.emissive.copy(emissiveRef.current);
    tubeMat.emissiveIntensity = THREE.MathUtils.lerp(1.5, 2.6, warpRef.current + scrollDepth * 0.35);

    if (tubeRef.current) {
      tubeRef.current.rotation.z += delta * (0.01 + scrollDepth * 0.025) * (1 + warpRef.current * 0.5);
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const z = -((travelRef.current * 1.4 + i * (TUNNEL_LENGTH / ringGeos.length)) % TUNNEL_LENGTH);
        ring.position.z = z;
      });
      ringMat.opacity = 0.18 + warpRef.current * 0.22 + scrollDepth * 0.12;
    }

    camera.position.z = THREE.MathUtils.lerp(camera.position.z, scrollDepth * 2.4 + warpRef.current * 0.2, 0.08);
    camera.fov = THREE.MathUtils.lerp(camera.fov, 68 + scrollDepth * 10 + warpRef.current * 5, 0.06);
    camera.updateProjectionMatrix();
  });

  return (
    <group ref={tubeRef}>
      <mesh geometry={tubeGeo} material={tubeMat} frustumCulled={false} />
      <group ref={ringsRef}>
        {ringGeos.map((geo, i) => (
          <mesh key={i} geometry={geo} material={ringMat} frustumCulled={false} />
        ))}
      </group>
    </group>
  );
}

function TunnelScene({ scrollDepthRef, warpRef, warpDecayRef }) {
  const linesTex = useTexture('/textures/tunnel-lines-min.jpg');
  return (
    <AuroraTunnelTube
      linesTex={linesTex}
      scrollDepthRef={scrollDepthRef}
      warpRef={warpRef}
      warpDecayRef={warpDecayRef}
    />
  );
}

function CameraRig({ scrollDepthRef }) {
  const mouse = useRef({ x: 0, y: 0 });
  const rafQueued = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (rafQueued.current) {
        mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
        return;
      }
      rafQueued.current = true;
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
      requestAnimationFrame(() => { rafQueued.current = false; });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame((state) => {
    const { camera, invalidate } = state;
    const depth = scrollDepthRef.current ?? 0;
    const sway = 1 - depth * 0.35;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 0.9 * sway, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.current.y * 0.5 * sway, 0.05);
    camera.lookAt(camera.position.x, camera.position.y, -40 - depth * 30);
    invalidate();
  });

  return null;
}

function TunnelLights() {
  return (
    <>
      <ambientLight intensity={0.4} color={AURORA_HEX.ambient} />
      <directionalLight position={[0, 4, 2]} intensity={1.2} color={AURORA_HEX.key} />
      <directionalLight position={[-5, 1, -8]} intensity={0.7} color={AURORA_HEX.rim} />
      <pointLight position={[0, 0, -10]} intensity={0.6} color={AURORA_HEX.scan} distance={80} />
    </>
  );
}

export default function GLTFTunnel({ scrollYProgress, scrollRef }) {
  const scrollDepthRef = useRef(0);
  const lastProgressRef = useRef(0);
  const warpRef = useRef(0);
  const warpDecayRef = useRef(0);
  const invalidateRef = useRef(() => {});
  const perf = getGraphicsProfile();

  const triggerWarp = () => {
    warpRef.current = 1;
    warpDecayRef.current = performance.now() + 700;
    invalidateRef.current();
  };

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const delta = latest - lastProgressRef.current;
    scrollDepthRef.current = latest;
    lastProgressRef.current = latest;
    invalidateRef.current();

    if (delta > 0.001) {
      triggerWarp();
    }
  });

  useEffect(() => {
    if (scrollYProgress) return undefined;

    const el = scrollRef?.current;
    if (!el) return undefined;

    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const next = max > 0 ? el.scrollTop / max : 0;
      const delta = next - lastProgressRef.current;
      scrollDepthRef.current = next;
      lastProgressRef.current = next;
      invalidateRef.current();
      if (delta > 0.001) triggerWarp();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, scrollYProgress]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (scrollDepthRef.current < 0.98) invalidateRef.current();
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div className="tunnel-canvas-host" aria-hidden="true">
        <Canvas
          className="h-full w-full"
          dpr={[0.75, perf.lowPower ? 1 : 1.25]}
          frameloop="demand"
          performance={{ min: 0.5, max: 1 }}
          camera={{ position: [0, 0, 0], fov: 68, near: 0.1, far: 300 }}
          gl={{
            antialias: perf.antialias,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl, invalidate }) => {
            gl.setClearColor(0x000000, 1);
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
            invalidateRef.current = invalidate;
          }}
        >
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 18, 95]} />
          <TunnelLights />
          <Suspense fallback={null}>
            <TunnelScene scrollDepthRef={scrollDepthRef} warpRef={warpRef} warpDecayRef={warpDecayRef} />
          </Suspense>
          <CameraRig scrollDepthRef={scrollDepthRef} />
        </Canvas>
      </div>
      <div className="tunnel-edge-vignette pointer-events-none fixed inset-0 z-[1]" aria-hidden="true" />
    </>
  );
}
