import { useEffect, useRef } from 'react';
import { clamp, drawGlowStroke, lerp, project3D } from '../utils/tunnelMath';

const DEPTH = 2200;
const BASE_FLOW = 4.2;
const BOOST_FLOW = 12;
const BOOST_MS = 900;

function createStreaks(count, spread, phaseOffset = 0) {
  return Array.from({ length: count }, (_, i) => ({
    lane: (i / (count - 1 || 1)) * 2 - 1,
    spread,
    phase: phaseOffset + i * 1.37,
    speed: 0.7 + (i % 5) * 0.11,
    width: spread > 1 ? 1 : 0.55 + (i % 3) * 0.15,
    offset: (Math.random() - 0.5) * 0.4,
  }));
}

function buildStreakPath3D(streak, travel, time, mouse, width, height) {
  const points = [];
  const mousePullX = mouse.active ? (mouse.x - width * 0.5) * 0.0001 : 0;
  const mousePullY = mouse.active ? (mouse.y - height * 0.5) * 0.00008 : 0;

  for (let i = 0; i < 9; i += 1) {
    const u = i / 8;
    let z = u * DEPTH + streak.offset * 200;
    z = ((z - travel * streak.speed) % DEPTH + DEPTH) % DEPTH;

    const depthFactor = 1 - z / DEPTH;
    const converge = u * u;
    const radius = width * (0.12 + streak.spread * 0.09) * lerp(0.9, 0.25, converge);
    const angle =
      streak.phase + time * 0.22 * streak.speed + u * 4.2 + Math.sin(time * 0.35 + streak.lane * 2) * 0.55;
    const wave =
      Math.sin(time * 0.28 + u * 6 + streak.phase) * radius * 0.22 +
      Math.cos(time * 0.19 + streak.lane * 3) * radius * 0.1;

    const x = Math.cos(angle) * radius + wave + streak.lane * width * 0.06 + mousePullX * depthFactor * 60;
    const y =
      Math.sin(angle * 0.85) * radius * 0.42 +
      Math.sin(time * 0.31 + u * 3) * radius * 0.08 +
      mousePullY * depthFactor * 50;

    points.push({ x, y, z, depthFactor });
  }

  return points;
}

export default function TunnelCanvas2D({ scrollRef, activeSectionId }) {
  const canvasRef = useRef(null);
  const apiRef = useRef(null);
  const prevSectionRef = useRef(activeSectionId);

  useEffect(() => {
    if (prevSectionRef.current !== activeSectionId) {
      apiRef.current?.triggerWarp();
      prevSectionRef.current = activeSectionId;
    }
  }, [activeSectionId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let raf = 0;

    const state = {
      travel: 0,
      flow: BASE_FLOW,
      targetFlow: BASE_FLOW,
      boostUntil: 0,
      time: 0,
      mouse: { x: 0, y: 0, active: false },
      smoothMouse: { x: 0, y: 0 },
      primary: createStreaks(10, 1.1, 0),
      secondary: createStreaks(14, 1.7, 4),
    };

    apiRef.current = {
      triggerWarp: () => {
        state.boostUntil = performance.now() + BOOST_MS;
        state.targetFlow = BOOST_FLOW;
      },
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.smoothMouse = { x: w / 2, y: h / 2 };
    };

    const render = () => {
      state.time += 0.004;
      const now = performance.now();
      state.targetFlow = now < state.boostUntil ? BOOST_FLOW : BASE_FLOW;
      state.flow = lerp(state.flow, state.targetFlow, 0.04);
      state.travel = (state.travel + state.flow) % DEPTH;

      state.smoothMouse.x = lerp(state.smoothMouse.x, state.mouse.x, 0.06);
      state.smoothMouse.y = lerp(state.smoothMouse.y, state.mouse.y, 0.06);
      const mouse = { ...state.smoothMouse, active: state.mouse.active };

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      const all = [
        ...state.secondary.map((s) => ({ streak: s, dim: true })),
        ...state.primary.map((s) => ({ streak: s, dim: false })),
      ]
        .map(({ streak, dim }) => {
          const path3d = buildStreakPath3D(streak, state.travel, state.time, mouse, w, h);
          const projected = path3d.map((p) => {
            const pr = project3D(p.x, p.y, p.z, w, h);
            return { x: pr.x, y: pr.y };
          });
          const avg = path3d.reduce((s, p) => s + p.depthFactor, 0) / (path3d.length || 1);
          return { projected, avg, dim, width: streak.width };
        })
        .sort((a, b) => a.avg - b.avg);

      ctx.globalCompositeOperation = 'lighter';
      all.forEach(({ projected, avg, dim, width: sw }) => {
        if (projected.length < 2) return;
        ctx.strokeStyle = dim ? 'rgba(90,143,173,0.5)' : 'rgba(142,202,230,0.7)';
        drawGlowStroke(ctx, projected, avg, dim ? 0.4 * sw : 0.85 * sw);
      });
      ctx.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(render);
    };

    const onScroll = () => apiRef.current?.triggerWarp();
    const onMouseMove = (e) => {
      state.mouse = { x: e.clientX, y: e.clientY, active: true };
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    scrollRef?.current?.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      scrollRef?.current?.removeEventListener('scroll', onScroll);
    };
  }, [scrollRef]);

  return (
    <canvas
      ref={canvasRef}
      className="tunnel-canvas-host"
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
