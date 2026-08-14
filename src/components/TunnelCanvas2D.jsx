import { useEffect, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { AURORA_RGB, lerpAuroraRgb } from '../constants/auroraTheme';
import { createFpsGate, getGraphicsProfile, shouldRenderGraphics } from '../utils/graphicsPerf';

const TUNNEL_LENGTH = 480;
const SCROLL_DEPTH_MULTIPLIER = 2.4;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

export default function TunnelCanvas2D({ scrollYProgress, scrollRef }) {
  const canvasRef = useRef(null);
  const scrollDepthRef = useRef(0);
  const lastProgressRef = useRef(0);
  const warpRef = useRef(0);
  const warpUntilRef = useRef(0);

  const updateScrollDepth = (nextProgress) => {
    const delta = nextProgress - lastProgressRef.current;
    scrollDepthRef.current = nextProgress;
    lastProgressRef.current = nextProgress;
    const absDelta = Math.abs(delta);
    if (absDelta > 0.0005) {
      warpRef.current = Math.min(1.2, warpRef.current + absDelta * 14);
      warpUntilRef.current = performance.now() + 500;
    }
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: false });
    let raf = 0;
    const perf = getGraphicsProfile();
    const shouldRenderFrame = createFpsGate(perf.targetFps);

    const state = {
      travel: 0,
      rotation: 0,
      mouse: { x: 0, y: 0, active: false },
      smoothMouse: { x: 0, y: 0 },
    };

    const particles = [];
    const ringPointCount = perf.lowPower ? 16 : 24;
    const ringStep = perf.lowPower ? 20 : 16;
    for (let z = 0; z >= -TUNNEL_LENGTH; z -= ringStep) {
      const rBase = 12 + Math.random() * 6;
      for (let i = 0; i < ringPointCount; i++) {
        const angle = (i / ringPointCount) * Math.PI * 2;
        const r = rBase + (Math.random() - 0.5) * 1.5;
        particles.push({ r, angle, zBase: z, offset: 0 });
      }
    }
    const scatterCount = perf.lowPower ? 120 : 200;
    for (let i = 0; i < scatterCount; i++) {
      const r = Math.random() * 11;
      const angle = Math.random() * Math.PI * 2;
      const z = -Math.random() * TUNNEL_LENGTH;
      particles.push({ r, angle, zBase: z, offset: Math.random() * TUNNEL_LENGTH });
    }

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.smoothMouse = { x: w / 2, y: h / 2 };
    };

    let w = 0;
    let h = 0;
    let last = performance.now();

    const render = (now) => {
      if (!shouldRenderGraphics()) {
        raf = requestAnimationFrame(render);
        return;
      }

      if (!shouldRenderFrame(now)) {
        raf = requestAnimationFrame(render);
        return;
      }

      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      const scrollDepth = scrollDepthRef.current ?? 0;

      if (now > warpUntilRef.current) {
        warpRef.current = lerp(warpRef.current, 0, Math.min(1, delta * 6));
      }

      const scrollTravel = scrollDepth * TUNNEL_LENGTH * SCROLL_DEPTH_MULTIPLIER;
      const warpBoost = warpRef.current * 120;
      const targetTravel = scrollTravel + warpBoost;
      const travelDamp = 1 - Math.exp(-12 * delta);
      state.travel = lerp(state.travel, targetTravel, travelDamp);

      if (scrollDepth < 0.02) {
        state.travel += delta * 18;
      }

      const snakeX = Math.sin(state.travel * 0.055) * 65;
      const snakeY = Math.cos(state.travel * 0.042) * 45;
      const snakeRoll = Math.sin(state.travel * 0.055) * 0.015;

      state.rotation += delta * (0.002 + scrollDepth * 0.006) * 60 + snakeRoll;

      state.smoothMouse.x = lerp(state.smoothMouse.x, state.mouse.x, 0.05);
      state.smoothMouse.y = lerp(state.smoothMouse.y, state.mouse.y, 0.05);
      const mouseActive = state.mouse.active;

      const depthSway = 1 - scrollDepth * 0.4;
      const mouseXShift = mouseActive ? (state.smoothMouse.x - w / 2) * 0.8 * depthSway : 0;
      const mouseYShift = mouseActive ? (state.smoothMouse.y - h / 2) * 0.8 * depthSway : 0;

      const shiftX = mouseXShift - snakeX * depthSway;
      const shiftY = mouseYShift - snakeY * depthSway;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      const cx = w / 2;
      const cy = h / 2;
      const uWarp = warpRef.current;

      particles.forEach((p) => {
        const traveled = mod(p.zBase + state.travel + p.offset, TUNNEL_LENGTH) - TUNNEL_LENGTH * 0.5;

        if (traveled >= 8) return;

        const zDist = 8 - traveled;
        if (zDist < 0.1) return;

        const vDepth = 1.0 - Math.abs(traveled) / (TUNNEL_LENGTH * 0.5);
        if (vDepth <= 0) return;

        const totalAngle = p.angle + state.rotation;
        const px = Math.cos(totalAngle) * p.r;
        const py = Math.sin(totalAngle) * p.r;

        const vEdge = clamp((p.r - 10.0) / 8.0, 0, 1);

        const inner = { r: 230, g: 255, b: 248 };
        const outer = AURORA_RGB.mint;
        const edgeRgb = lerpAuroraRgb(inner, outer, vEdge);
        const tint = uWarp * 0.5 + scrollDepth * 0.25;
        const warpRgb = lerpAuroraRgb(edgeRgb, AURORA_RGB.violet, tint);
        const fr = warpRgb.r;
        const fg = warpRgb.g;
        const fb = warpRgb.b;

        const scale = (300 + scrollDepth * 80) / zDist;
        const size2d = Math.max(0.5, 3.5 * scale * 0.05);
        const alpha = vDepth * 0.9;

        const depthFactor = clamp(1.0 - zDist / (TUNNEL_LENGTH * 0.5), 0, 1);
        const screenX = cx - shiftX * depthFactor + px * scale;
        const screenY = cy - shiftY * depthFactor + py * scale;

        if (screenX < -size2d || screenX > w + size2d || screenY < -size2d || screenY > h + size2d) return;

        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = `rgb(${fr}, ${fg}, ${fb})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size2d, 0, Math.PI * 2);
        ctx.fill();

        if (size2d > 1) {
          ctx.globalAlpha = alpha * 0.6;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(screenX, screenY, size2d * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const ringCount = perf.lowPower ? 8 : 14;
      ctx.strokeStyle = `rgba(52, 180, 140, ${0.18 + scrollDepth * 0.12})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < ringCount; i++) {
        const zOffset = (i / ringCount) * TUNNEL_LENGTH;
        const ringZ = mod(zOffset + state.travel, TUNNEL_LENGTH) - TUNNEL_LENGTH * 0.5;

        const zDist = 8 - ringZ;
        if (zDist < 0.1 || ringZ >= 8) continue;

        const scale = (300 + scrollDepth * 80) / zDist;
        const radius2d = 14.0 * scale;
        const depthFactor = clamp(1.0 - zDist / (TUNNEL_LENGTH * 0.5), 0, 1);

        const screenX = cx - shiftX * depthFactor;
        const screenY = cy - shiftY * depthFactor;

        ctx.beginPath();
        ctx.arc(screenX, screenY, radius2d, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(render);
    };

    let mouseRaf = 0;
    let nextMouse = null;
    const onMouseMove = (e) => {
      nextMouse = { x: e.clientX, y: e.clientY, active: true };
      if (mouseRaf) return;
      mouseRaf = requestAnimationFrame(() => {
        mouseRaf = 0;
        if (nextMouse) state.mouse = nextMouse;
      });
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      if (mouseRaf) cancelAnimationFrame(mouseRaf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [scrollRef, scrollYProgress]);

  return (
    <canvas
      ref={canvasRef}
      className="tunnel-canvas-host"
      style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
}
