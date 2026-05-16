import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const TUNNEL_DEPTH = 480;
const SEGMENT_LENGTH = 40;
const BASE_SPEED = 22;
const WARP_SPEED = 58;
const WARP_MS = 900;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function buildCurve(laneIndex, laneCount, phase, segmentOffset, time) {
  const points = [];
  const laneAngle = (laneIndex / laneCount) * Math.PI * 2;
  const steps = 40;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const z = -segmentOffset - t * SEGMENT_LENGTH;

    const converge = Math.pow(t, 0.85);
    const radius =
      lerp(20, 4, converge) +
      Math.sin(t * 6 + phase + time * 0.4) * 1.8 +
      Math.cos(t * 3.5 + laneAngle) * 0.9;

    const angle =
      laneAngle +
      Math.sin(t * Math.PI) * 0.2 +
      Math.sin(t * 4.5 + phase + time * 0.25) * 0.32;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.5 + Math.sin(t * 2.5 + phase) * 0.5;

    points.push(new THREE.Vector3(x, y, z));
  }

  return new THREE.CatmullRomCurve3(points);
}

export default function TunnelWebGL({ scrollRef, activeSectionId }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const prevSectionRef = useRef(activeSectionId);

  useEffect(() => {
    if (prevSectionRef.current !== activeSectionId) {
      apiRef.current?.triggerWarp();
      prevSectionRef.current = activeSectionId;
    }
  }, [activeSectionId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;
    let animationId = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 30, 420);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.38, 0.12);
    composer.addPass(bloomPass);

    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x8ecae6,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lineMatDim = new THREE.MeshBasicMaterial({
      color: 0x5a8fad,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6a9fbe,
      transparent: true,
      opacity: 0.14,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const tunnel = new THREE.Group();
    scene.add(tunnel);

    const STREAK_COUNT = 16;
    const streaks = [];

    for (let i = 0; i < STREAK_COUNT; i += 1) {
      const phase = i * 0.78;
      const curve = buildCurve(i, STREAK_COUNT, phase, 0, 0);
      const geo = new THREE.TubeGeometry(curve, 64, 0.035, 6, false);
      const mesh = new THREE.Mesh(geo, i % 2 === 0 ? lineMat : lineMatDim);
      mesh.userData = { lane: i, phase, tubeR: 0.028 + (i % 4) * 0.008 };
      tunnel.add(mesh);
      streaks.push(mesh);
    }

    const RING_COUNT = Math.ceil(TUNNEL_DEPTH / 34);
    const rings = [];
    for (let i = 0; i < RING_COUNT; i += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(16, 0.02, 6, 64), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.z = -i * 34;
      ring.userData.baseRadius = 16;
      tunnel.add(ring);
      rings.push(ring);
    }

    const state = {
      offset: 0,
      speed: BASE_SPEED,
      targetSpeed: BASE_SPEED,
      time: 0,
      frame: 0,
      warpUntil: 0,
      mouse: { x: 0, y: 0 },
      smoothMouse: { x: 0, y: 0 },
    };

    apiRef.current = {
      triggerWarp: () => {
        state.warpUntil = performance.now() + WARP_MS;
        state.targetSpeed = WARP_SPEED;
      },
    };

    const resize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    };

    const onScroll = () => apiRef.current?.triggerWarp();
    const onMouseMove = (e) => {
      state.mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
      state.mouse.y = -(e.clientY / window.innerHeight - 0.5) * 0.4;
    };

    let last = performance.now();

    const animate = (now) => {
      if (disposed) return;
      animationId = requestAnimationFrame(animate);

      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      state.targetSpeed = now < state.warpUntil ? WARP_SPEED : BASE_SPEED;
      state.speed = lerp(state.speed, state.targetSpeed, 0.04);
      state.time += delta;
      state.frame += 1;
      state.offset = (state.offset + state.speed * delta) % TUNNEL_DEPTH;

      state.smoothMouse.x = lerp(state.smoothMouse.x, state.mouse.x, 0.05);
      state.smoothMouse.y = lerp(state.smoothMouse.y, state.mouse.y, 0.05);
      camera.position.x = state.smoothMouse.x * 1.2;
      camera.position.y = state.smoothMouse.y * 0.8;
      camera.lookAt(state.smoothMouse.x * 0.4, state.smoothMouse.y * 0.2, -80);

      tunnel.position.z = state.offset;

      if (state.frame % 6 === 0) {
        const seg = Math.floor(state.offset / SEGMENT_LENGTH) * SEGMENT_LENGTH;
        streaks.forEach((mesh) => {
          const curve = buildCurve(
            mesh.userData.lane,
            STREAK_COUNT,
            mesh.userData.phase,
            seg,
            state.time,
          );
          mesh.geometry.dispose();
          mesh.geometry = new THREE.TubeGeometry(curve, 56, mesh.userData.tubeR, 5, false);
        });
      }

      rings.forEach((ring, i) => {
        const worldZ = tunnel.position.z - i * 34;
        const depth = clamp((8 - worldZ) / 400, 0, 1);
        const scale = lerp(1.15, 0.18, depth);
        ring.scale.set(scale, scale, 1);
        ring.rotation.z += delta * 0.04 * (i % 2 === 0 ? 1 : -1);
      });

      try {
        composer.render();
      } catch {
        renderer.render(scene, camera);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    scrollRef?.current?.addEventListener('scroll', onScroll, { passive: true });

    animationId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      scrollRef?.current?.removeEventListener('scroll', onScroll);
      streaks.forEach((m) => m.geometry.dispose());
      rings.forEach((r) => r.geometry.dispose());
      lineMat.dispose();
      lineMatDim.dispose();
      ringMat.dispose();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      apiRef.current = null;
    };
  }, [scrollRef]);

  return (
    <>
      <div ref={containerRef} className="tunnel-canvas-host" aria-hidden="true" />
      <div className="tunnel-edge-vignette pointer-events-none fixed inset-0 z-[1]" aria-hidden="true" />
    </>
  );
}
