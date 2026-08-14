import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { AURORA_HEX } from '../constants/auroraTheme';
import { getGraphicsProfile, shouldRenderGraphics } from '../utils/graphicsPerf';

useTexture.preload('/textures/tunnel-lines-min.jpg');

const TUNNEL_LENGTH = 200;
const TUNNEL_RADIUS = 14;
const SCROLL_TRAVEL_RANGE = 360;

function createLinesMaterial(linesTex) {
  linesTex.colorSpace = THREE.SRGBColorSpace;
  linesTex.wrapS = THREE.RepeatWrapping;
  linesTex.wrapT = THREE.RepeatWrapping;
  linesTex.repeat.set(5, 32);
  linesTex.anisotropy = 1;

  return new THREE.MeshBasicMaterial({
    map: linesTex,
    color: new THREE.Color(0x34ffa8),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.95,
  });
}

function AuroraTunnelTube({ linesTex, scrollDepthRef, travelRef }) {
  const tubeRef = useRef();
  const ringsRef = useRef();
  const perf = getGraphicsProfile();

  const { tubeGeo, ringGeos } = useMemo(() => {
    const segments = perf.lowPower ? 24 : 32;
    const tube = new THREE.CylinderGeometry(
      TUNNEL_RADIUS,
      TUNNEL_RADIUS,
      TUNNEL_LENGTH * 1.5,
      segments,
      1,
      true,
    );
    tube.rotateX(Math.PI / 2);
    tube.translate(0, 0, -TUNNEL_LENGTH * 0.65);

    const ringCount = perf.lowPower ? 8 : 12;
    const torusSegments = perf.lowPower ? 24 : 32;
    const rings = [];
    for (let i = 0; i < ringCount; i += 1) {
      const ring = new THREE.TorusGeometry(TUNNEL_RADIUS, 0.06, 6, torusSegments);
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
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state, delta) => {
    if (!shouldRenderGraphics()) return;

    const scrollDepth = scrollDepthRef.current ?? 0;
    const targetTravel = scrollDepth * SCROLL_TRAVEL_RANGE;
    travelRef.current = THREE.MathUtils.damp(travelRef.current, targetTravel, 8, delta);

    if (scrollDepth < 0.02) {
      travelRef.current += delta * 2.5;
    }

    linesTex.offset.y = travelRef.current * 0.02;

    if (tubeRef.current) {
      tubeRef.current.rotation.z += delta * (0.015 + scrollDepth * 0.03);
    }

    if (ringsRef.current) {
      const spacing = TUNNEL_LENGTH / ringGeos.length;
      ringsRef.current.children.forEach((ring, i) => {
        const rawZ = i * spacing - (travelRef.current * 1.5 % TUNNEL_LENGTH);
        const z = -((rawZ % TUNNEL_LENGTH + TUNNEL_LENGTH) % TUNNEL_LENGTH);
        ring.position.z = z;
        const ringTravel = travelRef.current + Math.abs(z);
        ring.position.x = Math.sin(ringTravel * 0.05) * 2.2;
        ring.position.y = Math.cos(ringTravel * 0.038) * 1.5;
      });
      ringMat.opacity = 0.2 + scrollDepth * 0.15;
    }

    const targetCamZ = scrollDepth * 2.4;
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetCamZ, 8, delta);
    const isMobile = state.size.width <= 768;
    const baseFov = isMobile ? 74 : 68;
    const targetFov = baseFov + scrollDepth * 8;
    state.camera.fov = THREE.MathUtils.damp(state.camera.fov, targetFov, 8, delta);
    state.camera.updateProjectionMatrix();
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

function TunnelScene({ scrollDepthRef, travelRef }) {
  const linesTex = useTexture('/textures/tunnel-lines-min.jpg');
  return (
    <AuroraTunnelTube
      linesTex={linesTex}
      scrollDepthRef={scrollDepthRef}
      travelRef={travelRef}
    />
  );
}

function CameraRig({ scrollDepthRef, travelRef }) {
  const mouse = useRef({ x: 0, y: 0 });
  const lookAtRef = useRef(new THREE.Vector3(0, 0, -40));
  const rollRef = useRef(0);
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

  useFrame((state, delta) => {
    const { camera } = state;
    const depth = scrollDepthRef.current ?? 0;
    const travel = travelRef.current ?? 0;
    const sway = 1 - depth * 0.35;

    // Fast, fluid serpentine snake curve inside the infinite pipe
    const snakeX = Math.sin(travel * 0.05) * 3.8;
    const snakeY = Math.cos(travel * 0.038) * 2.4;

    const targetX = snakeX + mouse.current.x * 0.8 * sway;
    const targetY = snakeY + mouse.current.y * 0.45 * sway;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 8, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 8, delta);

    // Look ahead down the pipe curve
    const aheadTravel = travel + 18;
    const aheadX = Math.sin(aheadTravel * 0.05) * 4.4 + mouse.current.x * 0.8 * sway;
    const aheadY = Math.cos(aheadTravel * 0.038) * 2.8 + mouse.current.y * 0.45 * sway;
    const targetLookZ = -40 - depth * 30;

    lookAtRef.current.x = THREE.MathUtils.damp(lookAtRef.current.x, aheadX, 8, delta);
    lookAtRef.current.y = THREE.MathUtils.damp(lookAtRef.current.y, aheadY, 8, delta);
    lookAtRef.current.z = THREE.MathUtils.damp(lookAtRef.current.z, targetLookZ, 8, delta);

    // Bank angle applied cleanly via camera.up with persistent rollRef
    const targetRoll = -Math.cos(travel * 0.05) * 0.14;
    rollRef.current = THREE.MathUtils.damp(rollRef.current, targetRoll, 8, delta);
    camera.up.set(Math.sin(rollRef.current), Math.cos(rollRef.current), 0);

    camera.lookAt(lookAtRef.current);
  });

  return null;
}

export default function GLTFTunnel({ scrollYProgress, scrollRef }) {
  const scrollDepthRef = useRef(0);
  const travelRef = useRef(0);

  const updateScrollDepth = (nextProgress) => {
    scrollDepthRef.current = nextProgress;
  };

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    updateScrollDepth(latest);
  });

  useEffect(() => {
    if (scrollYProgress) return undefined;

    const el = scrollRef?.current;
    if (!el) return undefined;

    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const next = max > 0 ? el.scrollTop / max : 0;
      updateScrollDepth(next);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, scrollYProgress]);

  return (
    <>
      <div className="tunnel-canvas-host" aria-hidden="true">
        <Canvas
          className="h-full w-full"
          dpr={[0.75, 1.0]}
          frameloop="always"
          performance={{ min: 0.5, max: 1 }}
          camera={{ position: [0, 0, 0], fov: 68, near: 0.1, far: 300 }}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 1);
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
          }}
        >
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 25, 170]} />
          <Suspense fallback={null}>
            <TunnelScene scrollDepthRef={scrollDepthRef} travelRef={travelRef} />
          </Suspense>
          <CameraRig scrollDepthRef={scrollDepthRef} travelRef={travelRef} />
        </Canvas>
      </div>
      <div className="tunnel-edge-vignette pointer-events-none fixed inset-0 z-[1]" aria-hidden="true" />
    </>
  );
}
