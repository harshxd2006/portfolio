import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { AURORA_HEX } from '../constants/auroraTheme';
import TunnelPostFX from './TunnelPostFX';
import { getGraphicsProfile, shouldRenderGraphics } from '../utils/graphicsPerf';

useTexture.preload('/textures/tunnel-lines-min.jpg');

const TUNNEL_LENGTH = 120;
const TUNNEL_RADIUS = 14;

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

function AuroraTunnelTube({ linesTex, pausedRef, warpRef }) {
  const tubeRef = useRef();
  const ringsRef = useRef();
  const emissiveRef = useRef(new THREE.Color(0x34ffa8));
  const hueRef = useRef(0);
  const travelRef = useRef(0);

  const { tubeGeo, ringGeos } = useMemo(() => {
    const tube = new THREE.CylinderGeometry(
      TUNNEL_RADIUS,
      TUNNEL_RADIUS,
      TUNNEL_LENGTH,
      64,
      1,
      true,
    );
    tube.rotateX(Math.PI / 2);
    tube.translate(0, 0, -TUNNEL_LENGTH / 2);

    const rings = [];
    for (let i = 0; i < 8; i += 1) {
      const ring = new THREE.TorusGeometry(TUNNEL_RADIUS, 0.04, 8, 72);
      ring.rotateX(Math.PI / 2);
      rings.push(ring);
    }

    return { tubeGeo: tube, ringGeos: rings };
  }, []);

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
    if (pausedRef.current || !shouldRenderGraphics()) return;

    const warp = warpRef.current;
    const speed = THREE.MathUtils.lerp(0.35, 3.2, warp);
    travelRef.current += delta * speed * 18;
    linesTex.offset.y = travelRef.current * 0.02;

    hueRef.current = (hueRef.current + delta * 0.28) % 1;
    const t = hueRef.current;
    emissiveRef.current.setRGB(
      THREE.MathUtils.lerp(0.2, 0.72, t),
      THREE.MathUtils.lerp(1.0, 0.38, t),
      THREE.MathUtils.lerp(0.66, 1.0, t),
    );
    tubeMat.emissive.copy(emissiveRef.current);
    tubeMat.emissiveIntensity = THREE.MathUtils.lerp(1.5, 2.4, warp);

    if (tubeRef.current) {
      tubeRef.current.rotation.z += delta * 0.012 * (1 + warp * 0.5);
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const z = -((travelRef.current * 1.4 + i * (TUNNEL_LENGTH / 8)) % TUNNEL_LENGTH);
        ring.position.z = z;
      });
      // Update single material opacity instead of 8 clones
      ringMat.opacity = 0.18 + warp * 0.22;
    }

    const { camera } = state;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, warp * 0.15, 0.04);
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

function TunnelScene({ pausedRef, warpRef }) {
  const linesTex = useTexture('/textures/tunnel-lines-min.jpg');
  return <AuroraTunnelTube linesTex={linesTex} pausedRef={pausedRef} warpRef={warpRef} />;
}

function CameraRig({ pausedRef }) {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame((state) => {
    if (pausedRef.current) return;
    const { camera } = state;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 0.9, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.current.y * 0.5, 0.05);
    camera.lookAt(camera.position.x, camera.position.y, -40);
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

export default function GLTFTunnel({ scrollRef, activeSectionId, paused = false }) {
  const pausedRef = useRef(paused);
  const warpRef = useRef(0);
  const warpDecayRef = useRef(0);
  const prevSectionRef = useRef(activeSectionId);
  const perf = getGraphicsProfile();

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const triggerWarp = () => {
    warpRef.current = 1;
    warpDecayRef.current = performance.now() + 900;
  };

  useEffect(() => {
    if (prevSectionRef.current !== activeSectionId) {
      triggerWarp();
      prevSectionRef.current = activeSectionId;
    }
  }, [activeSectionId]);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return undefined;
    const onScroll = () => triggerWarp();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (performance.now() > warpDecayRef.current) {
        warpRef.current = THREE.MathUtils.lerp(warpRef.current, 0, 0.06);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div className="tunnel-canvas-host" aria-hidden="true">
        <Canvas
          className="h-full w-full"
          dpr={perf.pixelRatio}
          performance={{ min: 0.5, max: 1 }}
          camera={{ position: [0, 0, 0], fov: 68, near: 0.1, far: 300 }}
          gl={{
            antialias: perf.antialias,
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
          <fog attach="fog" args={['#000000', 18, 95]} />
          <TunnelLights />
          <Suspense fallback={null}>
            <TunnelScene pausedRef={pausedRef} warpRef={warpRef} />
          </Suspense>
          <CameraRig pausedRef={pausedRef} />
          {!perf.lowPower && <TunnelPostFX pausedRef={pausedRef} />}
        </Canvas>
      </div>
      <div className="tunnel-edge-vignette pointer-events-none fixed inset-0 z-[1]" aria-hidden="true" />
    </>
  );
}
