import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const TUNNEL_LENGTH = 480;

function lerp(a, b, t) {
  return a + (b - a) * t;
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
    scene.fog = new THREE.FogExp2(0x000000, 0.008);

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
    
    // Performance improvement: Run Bloom pass at half resolution to significantly reduce lag
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 
      1.4, 0.5, 0.08
    );
    composer.addPass(bloomPass);

    const tunnel = new THREE.Group();
    scene.add(tunnel);

    // Geometry Generation
    const positions = [];
    const offsets = [];

    // Rings
    for (let z = 0; z >= -TUNNEL_LENGTH; z -= 8) {
      const rBase = 12 + Math.random() * 6;
      for (let i = 0; i < 48; i++) {
        const angle = (i / 48) * Math.PI * 2;
        const r = rBase + (Math.random() - 0.5) * 1.5;
        positions.push(Math.cos(angle) * r, Math.sin(angle) * r, z);
        offsets.push(0);
      }
    }

    // Interior random particles
    for (let i = 0; i < 800; i++) {
      const r = Math.random() * 11;
      const angle = Math.random() * Math.PI * 2;
      const z = -Math.random() * TUNNEL_LENGTH;
      positions.push(Math.cos(angle) * r, Math.sin(angle) * r, z);
      offsets.push(Math.random() * TUNNEL_LENGTH);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aOffset', new THREE.Float32BufferAttribute(offsets, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0 },
        uTunnelLength: { value: TUNNEL_LENGTH },
        uWarp: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSpeed;
        uniform float uTunnelLength;
        attribute float aOffset;
        varying float vDepth;
        varying float vEdge;

        void main() {
          vec3 pos = position;
          float traveled = mod(pos.z + uTime * uSpeed + aOffset, uTunnelLength) - uTunnelLength * 0.5;
          pos.z = traveled;
          vDepth = 1.0 - abs(traveled) / (uTunnelLength * 0.5);
          float r = length(pos.xy);
          vEdge = smoothstep(10.0, 18.0, r);
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          // Clamp Z to avoid negative point size crashes on particles behind the camera
          gl_PointSize = (3.5 / max(-mvPosition.z, 0.001)) * 300.0;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uWarp;
        varying float vDepth;
        varying float vEdge;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if(d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d) * vDepth * 0.9;
          vec3 core = vec3(1.0, 1.0, 1.0);
          vec3 edge = vec3(0.05, 0.22, 0.45);
          vec3 col = mix(core, edge, vEdge);
          col = mix(col, vec3(0.55, 0.82, 0.95), uWarp * 0.4);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    // Disable frustum culling to ensure geometry bounding box issues don't hide particles
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
        bloomPass.resolution.set(w / 2, h / 2);
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
      particleMaterial.uniforms.uTime.value = state.actualSpeed > 0 ? (state.travel / state.actualSpeed) : 0;
      particleMaterial.uniforms.uSpeed.value = state.actualSpeed; 
      particleMaterial.uniforms.uWarp.value = uWarp;

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
      ro.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      scrollRef?.current?.removeEventListener('scroll', onScroll);
      
      geometry.dispose();
      particleMaterial.dispose();
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
