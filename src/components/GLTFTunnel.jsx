import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { AURORA_HEX } from '../constants/auroraTheme';
import { getGraphicsProfile, shouldRenderGraphics } from '../utils/graphicsPerf';

const TUNNEL_LENGTH = 240;
const TUNNEL_RADIUS = 12;
const SCROLL_TRAVEL_RANGE = 380;

function createProceduralTunnelTexture(isLowPower) {
  const size = isLowPower ? 384 : 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#02060a';
  ctx.fillRect(0, 0, size, size);

  const numCols = isLowPower ? 16 : 20;
  const numRows = isLowPower ? 36 : 48;
  const colW = size / numCols;
  const rowH = size / numRows;

  // Render metallic panel shading
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const x = c * colW;
      const y = r * rowH;
      ctx.fillStyle = (c % 2 === 0) ? '#040d12' : '#02070a';
      ctx.fillRect(x + 1, y + 1, colW - 2, rowH - 2);
    }
  }

  // Render longitudinal energy rib lines
  for (let i = 0; i < numCols; i++) {
    const x = i * colW;

    ctx.strokeStyle = 'rgba(52, 255, 200, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();

    ctx.strokeStyle = '#34ffa8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  // Render horizontal pipe joint rings
  for (let j = 0; j < numRows; j++) {
    const y = j * rowH;
    ctx.strokeStyle = 'rgba(52, 255, 180, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

function createLinesMaterial(linesTex) {
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
  const instancedRingsRef = useRef();
  const perf = getGraphicsProfile();
  const dummyMat = useMemo(() => new THREE.Matrix4(), []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isLowPowerTier = perf.lowPower || isMobile || perf.isIntegratedGpu;
  const ringCount = isLowPowerTier ? 6 : 12;

  const { tubeGeo, ringGeo } = useMemo(() => {
    const segments = isLowPowerTier ? 14 : 24;
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

    const torusSegments = isLowPowerTier ? 14 : 24;
    const ring = new THREE.TorusGeometry(TUNNEL_RADIUS, 0.1, 4, torusSegments);
    ring.rotateX(Math.PI / 2);

    return { tubeGeo: tube, ringGeo: ring };
  }, [isLowPowerTier]);

  const tubeMat = useMemo(() => createLinesMaterial(linesTex), [linesTex]);

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: AURORA_HEX.ring,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state, delta) => {
    if (!shouldRenderGraphics()) return;

    const isMobile = state.size.width <= 768;
    const dampSpeed = isMobile ? 12 : 8;

    const scrollDepth = scrollDepthRef.current ?? 0;
    const targetTravel = scrollDepth * SCROLL_TRAVEL_RANGE;
    travelRef.current = THREE.MathUtils.damp(travelRef.current, targetTravel, dampSpeed, delta);

    if (scrollDepth < 0.02) {
      travelRef.current += delta * 2.5;
    }

    linesTex.offset.y = travelRef.current * 0.015;

    if (tubeRef.current) {
      tubeRef.current.rotation.z += delta * (0.012 + scrollDepth * 0.025);
    }

    if (instancedRingsRef.current) {
      const spacing = TUNNEL_LENGTH / ringCount;
      for (let i = 0; i < ringCount; i += 1) {
        const rawZ = i * spacing - (travelRef.current * 1.5 % TUNNEL_LENGTH);
        const z = -((rawZ % TUNNEL_LENGTH + TUNNEL_LENGTH) % TUNNEL_LENGTH);
        const ringTravel = travelRef.current + Math.abs(z);
        const x = Math.sin(ringTravel * 0.05) * 2.2;
        const y = Math.cos(ringTravel * 0.038) * 1.5;

        dummyMat.setPosition(x, y, z);
        instancedRingsRef.current.setMatrixAt(i, dummyMat);
      }
      instancedRingsRef.current.instanceMatrix.needsUpdate = true;
      ringMat.opacity = 0.25 + scrollDepth * 0.2;
    }

    const targetCamZ = scrollDepth * 2.4;
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetCamZ, dampSpeed, delta);
    const baseFov = isMobile ? 74 : 68;
    const targetFov = baseFov + scrollDepth * 8;
    state.camera.fov = THREE.MathUtils.damp(state.camera.fov, targetFov, dampSpeed, delta);
    state.camera.updateProjectionMatrix();
  });

  return (
    <group ref={tubeRef}>
      <mesh geometry={tubeGeo} material={tubeMat} frustumCulled={false} />
      <instancedMesh
        ref={instancedRingsRef}
        args={[ringGeo, ringMat, ringCount]}
        frustumCulled={false}
      />
    </group>
  );
}

function TunnelScene({ scrollDepthRef, travelRef }) {
  const perf = getGraphicsProfile();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isLowPowerTier = perf.lowPower || isMobile || perf.isIntegratedGpu;
  const linesTex = useMemo(() => createProceduralTunnelTexture(isLowPowerTier), [isLowPowerTier]);
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
    const isMobile = state.size.width <= 768;
    const dampSpeed = isMobile ? 12 : 8;

    const depth = scrollDepthRef.current ?? 0;
    const travel = travelRef.current ?? 0;
    const sway = 1 - depth * 0.35;

    // Fast, fluid serpentine snake curve inside the infinite pipe
    const snakeX = Math.sin(travel * 0.05) * 3.8;
    const snakeY = Math.cos(travel * 0.038) * 2.4;

    const targetX = snakeX + mouse.current.x * 0.8 * sway;
    const targetY = snakeY + mouse.current.y * 0.45 * sway;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, dampSpeed, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, dampSpeed, delta);

    // Look ahead down the pipe curve
    const aheadTravel = travel + 18;
    const aheadX = Math.sin(aheadTravel * 0.05) * 4.4 + mouse.current.x * 0.8 * sway;
    const aheadY = Math.cos(aheadTravel * 0.038) * 2.8 + mouse.current.y * 0.45 * sway;
    const targetLookZ = -40 - depth * 30;

    lookAtRef.current.x = THREE.MathUtils.damp(lookAtRef.current.x, aheadX, dampSpeed, delta);
    lookAtRef.current.y = THREE.MathUtils.damp(lookAtRef.current.y, aheadY, dampSpeed, delta);
    lookAtRef.current.z = THREE.MathUtils.damp(lookAtRef.current.z, targetLookZ, dampSpeed, delta);

    // Bank angle applied cleanly via camera.up with persistent rollRef
    const targetRoll = -Math.cos(travel * 0.05) * 0.14;
    rollRef.current = THREE.MathUtils.damp(rollRef.current, targetRoll, dampSpeed, delta);
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

  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 768;
  const targetDpr = isMobileViewport ? [0.5, 0.75] : [0.75, 1.0];

  return (
    <>
      <div className="tunnel-canvas-host" aria-hidden="true">
        <Canvas
          className="h-full w-full"
          dpr={targetDpr}
          frameloop="always"
          performance={{ min: 0.5, max: 1 }}
          camera={{ position: [0, 0, 0], fov: 68, near: 0.1, far: 300 }}
          gl={{
            antialias: false,
            alpha: false,
            depth: true,
            stencil: false,
            powerPreference: 'high-performance',
            precision: 'mediump',
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 1);
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
          }}
        >
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 30, 200]} />
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
