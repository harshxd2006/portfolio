import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createFpsGate, getGraphicsProfile, shouldRenderGraphics } from '../utils/graphicsPerf';

const TUNNEL_LENGTH = 480;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function createSoftParticleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const body = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
  body.addColorStop(0, 'rgba(255, 255, 255, 1)');
  body.addColorStop(0.15, 'rgba(240, 248, 255, 0.95)');
  body.addColorStop(0.38, 'rgba(120, 170, 220, 0.35)');
  body.addColorStop(0.62, 'rgba(40, 80, 140, 0.12)');
  body.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, size, size);

  const spec = ctx.createRadialGradient(size * 0.34, size * 0.3, 0, size * 0.34, size * 0.3, size * 0.22);
  spec.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  spec.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = spec;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createBokehTexture() {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const glow = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  glow.addColorStop(0.18, 'rgba(220, 238, 255, 0.45)');
  glow.addColorStop(0.45, 'rgba(140, 185, 235, 0.12)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createTunnelParticleMaterial(texture, isBokeh = false) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 0 },
      uTunnelLength: { value: TUNNEL_LENGTH },
      uWarp: { value: 0 },
      uParticleTex: { value: texture },
      uBokeh: { value: isBokeh ? 1 : 0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uTunnelLength;
      uniform float uBokeh;
      attribute float aOffset;
      attribute float aSize;
      varying float vDepth;
      varying float vEdge;
      varying float vSize;

      void main() {
        vec3 pos = position;
        float traveled = mod(pos.z + uTime * uSpeed + aOffset, uTunnelLength) - uTunnelLength * 0.5;
        pos.z = traveled;
        vDepth = 1.0 - abs(traveled) / (uTunnelLength * 0.5);
        float r = length(pos.xy);
        vEdge = smoothstep(10.0, 18.0, r);
        vSize = aSize;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float depthSize = (2.8 / max(-mvPosition.z, 0.001)) * 280.0;
        float bokehScale = mix(1.0, 2.4, step(0.5, uBokeh));
        gl_PointSize = depthSize * aSize * bokehScale * (0.65 + vDepth * 0.55);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uWarp;
      uniform float uBokeh;
      uniform sampler2D uParticleTex;
      varying float vDepth;
      varying float vEdge;
      varying float vSize;

      void main() {
        vec4 tex = texture2D(uParticleTex, gl_PointCoord);
        if (tex.a < 0.02) discard;

        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float sphere = sqrt(max(0.0, 1.0 - d * d * 4.0));
        float isBokeh = step(0.5, uBokeh);
        float alpha = tex.a * vDepth * mix(0.5 + sphere * 0.5, 0.18 + sphere * 0.12, isBokeh);

        vec3 core = vec3(1.0, 1.0, 1.0);
        vec3 edge = vec3(0.06, 0.24, 0.48);
        vec3 col = mix(edge, core, sphere);
        col *= mix(0.7, 1.0, vDepth);
        col += tex.rgb * sphere * mix(0.35, 0.55, isBokeh);
        col = mix(col, vec3(0.55, 0.85, 0.98), uWarp * 0.45);
        col += vec3(1.0) * pow(sphere, 3.0) * mix(0.25, 0.12, isBokeh) * vSize;

        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export default function TunnelWebGL({ scrollRef, activeSectionId, paused = false }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const pausedRef = useRef(paused);
  const prevSectionRef = useRef(activeSectionId);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

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
    let pauseTimer = 0;
    const perf = getGraphicsProfile();
    const shouldRenderFrame = createFpsGate(perf.targetFps);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.008);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      antialias: perf.antialias,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(perf.pixelRatio);
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    // Performance improvement: Run Bloom pass at half resolution to significantly reduce lag
    const bloomW = Math.floor(window.innerWidth * perf.bloomScale);
    const bloomH = Math.floor(window.innerHeight * perf.bloomScale);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(bloomW, bloomH), 1.35, 0.48, 0.085);
    composer.addPass(bloomPass);

    const tunnel = new THREE.Group();
    scene.add(tunnel);

    // Geometry Generation
    const positions = [];
    const offsets = [];
    const sizes = [];

    const ringStep = perf.lowPower ? 10 : 8;
    const ringPointCount = perf.lowPower ? 36 : 44;
    for (let z = 0; z >= -TUNNEL_LENGTH; z -= ringStep) {
      const rBase = 12 + Math.random() * 6;
      for (let i = 0; i < ringPointCount; i++) {
        const angle = (i / ringPointCount) * Math.PI * 2;
        const r = rBase + (Math.random() - 0.5) * 1.5;
        positions.push(Math.cos(angle) * r, Math.sin(angle) * r, z);
        offsets.push(0);
        sizes.push(0.75 + Math.random() * 0.55);
      }
    }

    for (let i = 0; i < (perf.lowPower ? 420 : 620); i++) {
      const r = Math.random() * 11;
      const angle = Math.random() * Math.PI * 2;
      const z = -Math.random() * TUNNEL_LENGTH;
      positions.push(Math.cos(angle) * r, Math.sin(angle) * r, z);
      offsets.push(Math.random() * TUNNEL_LENGTH);
      sizes.push(0.45 + Math.random() * 0.9);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aOffset', new THREE.Float32BufferAttribute(offsets, 1));
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));

    const particleTexture = createSoftParticleTexture();
    const bokehTexture = createBokehTexture();

    const bokehCount = perf.lowPower ? 48 : 80;
    const bokehPos = [];
    const bokehOff = [];
    const bokehSizes = [];
    for (let i = 0; i < bokehCount; i++) {
      const r = Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;
      const z = -Math.random() * TUNNEL_LENGTH;
      bokehPos.push(Math.cos(angle) * r, Math.sin(angle) * r, z);
      bokehOff.push(Math.random() * TUNNEL_LENGTH);
      bokehSizes.push(1.2 + Math.random() * 1.8);
    }
    const bokehGeo = new THREE.BufferGeometry();
    bokehGeo.setAttribute('position', new THREE.Float32BufferAttribute(bokehPos, 3));
    bokehGeo.setAttribute('aOffset', new THREE.Float32BufferAttribute(bokehOff, 1));
    bokehGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(bokehSizes, 1));

    const bokehMaterial = createTunnelParticleMaterial(bokehTexture, true);
    const bokehParticles = new THREE.Points(bokehGeo, bokehMaterial);
    bokehParticles.frustumCulled = false;
    tunnel.add(bokehParticles);

    const particleMaterial = createTunnelParticleMaterial(particleTexture, false);
    const particles = new THREE.Points(geometry, particleMaterial);
    particles.frustumCulled = false;
    tunnel.add(particles);

    // 14 THREE.LineLoop rings at evenly spaced Z depths
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x1a3a5c,
      opacity: 0.18,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    
    const ringGeo = new THREE.BufferGeometry();
    const ringPoints = [];
    for (let i = 0; i <= 64; i += 1) {
      const theta = (i / 64) * Math.PI * 2;
      ringPoints.push(Math.cos(theta) * 14.0, Math.sin(theta) * 14.0, 0);
    }
    ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(ringPoints, 3));

    const rings = [];
    for (let i = 0; i < 14; i += 1) {
      const ring = new THREE.LineLoop(ringGeo, ringMat);
      ring.frustumCulled = false;
      // Evenly spaced Z depths inside the active tunnel range (-TUNNEL_LENGTH/2 to TUNNEL_LENGTH/2)
      ring.userData.zOffset = (i / 14) * TUNNEL_LENGTH;
      tunnel.add(ring);
      rings.push(ring);
    }

    const state = {
      travel: 0,
      actualSpeed: 0.25,
      targetSpeed: 0.25,
      warpUntil: 0,
      mouse: { x: 0, y: 0 },
    };

    apiRef.current = {
      triggerWarp: () => {
        state.warpUntil = performance.now() + 900;
        state.targetSpeed = 2.2;
        state.actualSpeed = 2.2; // Spike immediately
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
      if (bloomPass.resolution) {
        // Keep bloom at half resolution for performance
        bloomPass.resolution.set(
          Math.max(1, Math.floor(w * perf.bloomScale)),
          Math.max(1, Math.floor(h * perf.bloomScale)),
        );
      }
    };

    const onScroll = () => apiRef.current?.triggerWarp();
    const onMouseMove = (e) => {
      state.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      state.mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    let last = performance.now();

    const animate = (now) => {
      if (disposed) return;

      if (pausedRef.current || !shouldRenderGraphics()) {
        pauseTimer = window.setTimeout(() => {
          animationId = requestAnimationFrame(animate);
        }, 250);
        return;
      }

      if (!shouldRenderFrame(now)) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      animationId = requestAnimationFrame(animate);

      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Speed lerp back to 0.25 over 900ms
      if (now > state.warpUntil) {
        state.targetSpeed = 0.25;
      }
      state.actualSpeed = lerp(state.actualSpeed, state.targetSpeed, delta * 3.0);
      
      const uWarp = Math.max(0, Math.min(1, (state.actualSpeed - 0.25) / (2.2 - 0.25)));
      
      // Integrate travel distance securely to prevent massive jumping when speed fluctuates
      state.travel += delta * state.actualSpeed * 60.0;
      
      // We pass uTime as travel / actualSpeed so that uTime * uSpeed exactly equals state.travel
      const uTimeVal = state.actualSpeed > 0 ? state.travel / state.actualSpeed : 0;
      particleMaterial.uniforms.uTime.value = uTimeVal;
      particleMaterial.uniforms.uSpeed.value = state.actualSpeed;
      particleMaterial.uniforms.uWarp.value = uWarp;
      bokehMaterial.uniforms.uTime.value = uTimeVal;
      bokehMaterial.uniforms.uSpeed.value = state.actualSpeed;
      bokehMaterial.uniforms.uWarp.value = uWarp;

      tunnel.rotation.z += delta * 0.002 * 60.0; // Slower rotation

      camera.position.x = lerp(camera.position.x, state.mouse.x * 1.8, 0.05);
      camera.position.y = lerp(camera.position.y, state.mouse.y * 1.2, 0.05);
      camera.lookAt(0, 0, -60);

      // Rings rush toward camera smoothly
      rings.forEach((ring) => {
        let z = mod(ring.userData.zOffset + state.travel, TUNNEL_LENGTH) - TUNNEL_LENGTH * 0.5;
        ring.position.z = z;
      });

      try {
        composer.render();
      } catch {
        renderer.render(scene, camera);
      }
    };

    function mod(n, m) {
      return ((n % m) + m) % m;
    }

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
      clearTimeout(pauseTimer);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      scrollRef?.current?.removeEventListener('scroll', onScroll);
      
      geometry.dispose();
      bokehGeo.dispose();
      particleMaterial.dispose();
      bokehMaterial.dispose();
      particleTexture.dispose();
      bokehTexture.dispose();
      ringGeo.dispose();
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
      <div 
        ref={containerRef} 
        className="tunnel-canvas-host" 
        style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh' }}
        aria-hidden="true" 
      />
      <div className="tunnel-edge-vignette pointer-events-none fixed inset-0 z-[1]" aria-hidden="true" />
    </>
  );
}
