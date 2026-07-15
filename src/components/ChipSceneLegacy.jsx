import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createFpsGate, debounce, getGraphicsProfile, shouldRenderGraphics } from '../utils/graphicsPerf';

function createMarkTexture(letter = 'H') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2e3238';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#08090a';
  ctx.font = 'bold 320px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 256, 275);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function buildChipTargets(lowPower = false) {
  const targets = [];
  const dieStep = lowPower ? 0.16 : 0.12;
  const baseStep = lowPower ? 0.24 : 0.18;
  const pinStep = lowPower ? 0.5 : 0.35;
  const traceCount = lowPower ? 14 : 20;

  for (let x = -2; x <= 2; x += dieStep) {
    for (let z = -2; z <= 2; z += dieStep) {
      targets.push(new THREE.Vector3(x, 0.18, z));
    }
  }

  for (let x = -3.2; x <= 3.2; x += baseStep) {
    for (let z = -3.2; z <= 3.2; z += baseStep) {
      targets.push(new THREE.Vector3(x, 0, z));
    }
  }

  for (let i = -3; i <= 3; i += pinStep) {
    targets.push(new THREE.Vector3(i, -0.1, 3.4));
    targets.push(new THREE.Vector3(i, -0.1, -3.4));
    targets.push(new THREE.Vector3(3.4, -0.1, i));
    targets.push(new THREE.Vector3(-3.4, -0.1, i));
  }

  const traceLines = [
    ...Array.from({ length: traceCount }, (_, i) => new THREE.Vector3(-3 + i * 0.3, 0.02, 1.5)),
    ...Array.from({ length: traceCount }, (_, i) => new THREE.Vector3(-3 + i * 0.3, 0.02, -1.5)),
    ...Array.from({ length: traceCount }, (_, i) => new THREE.Vector3(1.5, 0.02, -3 + i * 0.3)),
    ...Array.from({ length: traceCount }, (_, i) => new THREE.Vector3(-1.5, 0.02, -3 + i * 0.3)),
  ];
  targets.push(...traceLines);

  return targets;
}

function buildSolidChip(disposables) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d22,
    roughness: 0.72,
    metalness: 0.42,
    transparent: true,
    opacity: 0,
  });
  const dieMat = new THREE.MeshStandardMaterial({
    color: 0x323840,
    roughness: 0.58,
    metalness: 0.52,
    transparent: true,
    opacity: 0,
  });
  const markTex = createMarkTexture('H');
  disposables.push(markTex);
  const dieTopMat = new THREE.MeshStandardMaterial({
    map: markTex,
    roughness: 0.65,
    metalness: 0.45,
    transparent: true,
    opacity: 0,
  });

  const track = (mesh) => {
    disposables.push(mesh.geometry, mesh.material);
    group.add(mesh);
    return mesh;
  };

  track(new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.18, 13.5), bodyMat)).position.y = -0.12;
  track(new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.42, 5.2), dieMat)).position.y = 0.22;
  const dieMark = track(new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), dieTopMat));
  dieMark.rotation.x = -Math.PI / 2;
  dieMark.position.y = 0.44;

  return { group, materials: [bodyMat, dieMat, dieTopMat] };
}

function initChipScene(mount, formationRef, isDisposed) {
  const w = mount.clientWidth || window.innerWidth;
  const h = mount.clientHeight || window.innerHeight;
  if (w < 2 || h < 2) return null;

  const perf = getGraphicsProfile();
  const prefersReducedMotion = perf.reducedMotion;
  const shouldRenderFrame = createFpsGate(perf.targetFps);
  const disposables = [];
  let pauseTimer = 0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.014);

  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200);

  const renderer = new THREE.WebGLRenderer({
    antialias: perf.antialias,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(perf.pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  mount.appendChild(renderer.domElement);

  const bloomW = Math.max(1, Math.floor(w * perf.bloomScale));
  const bloomH = Math.max(1, Math.floor(h * perf.bloomScale));
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(bloomW, bloomH), 0.55, 0.35, 0.5);
  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  const starCount = perf.lowPower ? 400 : 500;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = THREE.MathUtils.randFloatSpread(100);
    starPositions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(60);
    starPositions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(100);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0x99aabb,
    size: 0.05,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  disposables.push(starGeo, starMat);
  scene.add(new THREE.Points(starGeo, starMat));

  const chipTargets = buildChipTargets(perf.lowPower);
  const particleCount = chipTargets.length;
  const positions = new Float32Array(particleCount * 3);
  const targetPositions = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);
  const particlePhase = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 18 + Math.random() * 22;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 4;
    positions[i * 3 + 2] = r * Math.cos(phi);

    const t = chipTargets[i];
    targetPositions[i * 3] = t.x;
    targetPositions[i * 3 + 1] = t.y;
    targetPositions[i * 3 + 2] = t.z;

    particleSizes[i] = Math.random() * 1.4 + 0.5;
    particlePhase[i] = Math.random();
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('aTargetPosition', new THREE.BufferAttribute(targetPositions, 3));
  particleGeo.setAttribute('aSize', new THREE.BufferAttribute(particleSizes, 1));
  particleGeo.setAttribute('aPhase', new THREE.BufferAttribute(particlePhase, 1));

  const particleMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFormation: { value: 0 },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 aTargetPosition;
      uniform float uTime;
      uniform float uFormation;
      varying float vBrightness;
      varying float vFormed;

      void main() {
        float pf = smoothstep(aPhase * 0.25, aPhase * 0.25 + 0.75, uFormation);
        vFormed = pf;

        vec3 drift = vec3(
          sin(uTime * 0.2 + aPhase * 6.28) * 1.2,
          cos(uTime * 0.16 + aPhase * 3.14) * 0.9,
          sin(uTime * 0.22 + aPhase * 9.42) * 1.0
        ) * (1.0 - pf);

        vec3 startPos = position + drift;
        vec3 pos = mix(startPos, aTargetPosition, pf);
        vBrightness = 0.35 + pf * 0.65;

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (mix(0.35, 1.0, pf)) * (380.0 / max(-mvPos.z, 0.1));
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying float vBrightness;
      varying float vFormed;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float strength = smoothstep(0.5, 0.0, d);
        vec3 silver = vec3(0.88, 0.9, 0.94);
        vec3 obsidian = vec3(0.1, 0.11, 0.14);
        vec3 col = mix(obsidian, silver, vBrightness);
        col += vec3(1.0) * smoothstep(0.92, 1.0, vBrightness) * 0.35;
        gl_FragColor = vec4(col, strength * (0.25 + vFormed * 0.75));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(particleGeo, particleMat);
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  const { group: solidChip, materials: solidMats } = buildSolidChip(disposables);
  scene.add(solidChip);

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x050608,
    roughness: 0.15,
    metalness: 0.92,
    transparent: true,
    opacity: 0,
  });
  disposables.push(floorMat);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.22;
  scene.add(floor);
  disposables.push(floor.geometry);

  const scanMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const scanBeam = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 12), scanMat);
  scanBeam.rotation.x = -Math.PI / 2;
  scanBeam.position.y = 0.5;
  scene.add(scanBeam);
  disposables.push(scanBeam.geometry, scanMat);

  scene.add(new THREE.AmbientLight(0x334455, 0.2));
  const keyLight = new THREE.DirectionalLight(0xeef4ff, 2.8);
  keyLight.position.set(4, 14, 6);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
  rimLight.position.set(-7, 9, -5);
  scene.add(rimLight);
  const underLight = new THREE.PointLight(0x223344, 1.2, 30);
  underLight.position.set(0, -2, 2);
  scene.add(underLight);

  const useAutoFormation = !formationRef;
  let autoFormation = 0;
  let autoDir = prefersReducedMotion ? 0 : 1;
  let holdTimer = 0;

  let orbitAngle = 0;
  let scanX = -5;
  let lastTime = performance.now();
  let animationId = 0;

  const resetAutoFormation = () => {
    if (prefersReducedMotion) {
      autoFormation = 1;
      autoDir = 0;
    } else {
      autoFormation = 0;
      autoDir = 1;
    }
    holdTimer = 0;
  };
  resetAutoFormation();

  const resize = () => {
    const rw = mount.clientWidth || window.innerWidth;
    const rh = mount.clientHeight || window.innerHeight;
    if (rw < 2 || rh < 2) return;
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    renderer.setSize(rw, rh, false);
    composer.setSize(rw, rh);
    bloomPass.resolution?.set(
      Math.max(1, Math.floor(rw * perf.bloomScale)),
      Math.max(1, Math.floor(rh * perf.bloomScale)),
    );
  };

  const debouncedResize = debounce(resize, 200);
  const ro = new ResizeObserver(debouncedResize);
  ro.observe(mount);
  window.addEventListener('resize', debouncedResize);

  const animate = (now) => {
    if (isDisposed()) return;

    if (!shouldRenderGraphics()) {
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

    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const time = now * 0.001;

    let formation;
    if (useAutoFormation) {
      if (!prefersReducedMotion) {
        if (autoDir === 1) {
          autoFormation = Math.min(1, autoFormation + delta * 0.22);
          if (autoFormation >= 1) {
            autoFormation = 1;
            autoDir = 0;
            holdTimer = 0;
          }
        } else if (autoDir === 0) {
          holdTimer += delta;
          if (holdTimer > 6) autoDir = -1;
        } else {
          autoFormation = Math.max(0, autoFormation - delta * 0.32);
          if (autoFormation <= 0) {
            autoFormation = 0;
            autoDir = 1;
          }
        }
      } else {
        autoFormation = 1;
      }
      formation = autoFormation;
    } else {
      formation = prefersReducedMotion
        ? 1
        : Math.max(0, Math.min(1, formationRef?.current ?? 0));
    }

    particleMat.uniforms.uTime.value = time;
    particleMat.uniforms.uFormation.value = formation;

    const solidOpacity = THREE.MathUtils.smoothstep(formation, 0.82, 1);
    solidMats.forEach((m) => {
      m.opacity = solidOpacity * 0.95;
    });
    particles.visible = formation < 0.98;

    floorMat.opacity = THREE.MathUtils.smoothstep(formation, 0.35, 0.75) * 0.85;

    const formed = formation >= 0.98;
    scanMat.opacity = formed ? 0.85 : 0;

    if (formed && !prefersReducedMotion) {
      scanX += delta * 2.8;
      if (scanX > 5) scanX = -5;
      scanBeam.position.x = scanX;
      orbitAngle += delta * 0.1;
      camera.position.x = Math.sin(orbitAngle) * 2.2;
      camera.position.z = 9 + Math.cos(orbitAngle * 0.8) * 0.8;
      camera.position.y = 9.5 + Math.sin(orbitAngle * 0.5) * 0.4;
    } else {
      const t = THREE.MathUtils.smoothstep(formation, 0, 1);
      camera.position.set(
        Math.sin(time * 0.3) * 0.5,
        THREE.MathUtils.lerp(16, 10, t),
        THREE.MathUtils.lerp(14, 9, t),
      );
    }
    camera.lookAt(0, THREE.MathUtils.lerp(0, 0.2, formation), 0);

    try {
      composer.render();
    } catch {
      renderer.render(scene, camera);
    }
  };

  animationId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationId);
    clearTimeout(pauseTimer);
    ro.disconnect();
    window.removeEventListener('resize', debouncedResize);
    composer.dispose();
    disposables.forEach((item) => item.dispose?.());
    renderer.dispose();
    if (renderer.domElement.parentNode === mount) {
      mount.removeChild(renderer.domElement);
    }
  };
}

export default function ChipScene({ formationRef = null, active = true }) {
  const mountRef = useRef(null);
  const activeRef = useRef(active);
  const formationRefStable = useRef(formationRef);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    formationRefStable.current = formationRef;
  }, [formationRef]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let disposed = false;
    let teardown = null;

    const boot = () => {
      if (disposed || !activeRef.current) {
        if (!disposed && activeRef.current) requestAnimationFrame(boot);
        return;
      }
      teardown = initChipScene(mount, formationRefStable.current, () => disposed || !activeRef.current);
      if (!teardown) requestAnimationFrame(boot);
    };

    if (active) boot();

    return () => {
      disposed = true;
      teardown?.();
    };
  }, [active]);

  return <div ref={mountRef} className="background-canvas-host" aria-hidden="true" />;
}
