import { useEffect, useRef } from 'react';
import { AURORA_RGB, lerpAuroraRgb } from '../constants/auroraTheme';

const TUNNEL_LENGTH = 480;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function mod(n, m) {
  return ((n % m) + m) % m;
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

    const ctx = canvas.getContext('2d', { alpha: false });
    let w = 0;
    let h = 0;
    let raf = 0;

    const state = {
      actualSpeed: 0.25,
      targetSpeed: 0.25,
      warpUntil: 0,
      time: 0,
      mouse: { x: 0, y: 0, active: false },
      smoothMouse: { x: 0, y: 0 },
      rotation: 0,
    };

    apiRef.current = {
      triggerWarp: () => {
        state.warpUntil = performance.now() + 900;
        state.targetSpeed = 2.2;
        state.actualSpeed = 2.2; // spike immediately
      },
    };

    // Performance improvement: significantly reduced particle count for Canvas 2D fallback 
    // to guarantee smooth 60fps even on weak integrated graphics.
    const particles = [];
    for (let z = 0; z >= -TUNNEL_LENGTH; z -= 16) {
      const rBase = 12 + Math.random() * 6;
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const r = rBase + (Math.random() - 0.5) * 1.5;
        particles.push({ r, angle, zBase: z, offset: 0 });
      }
    }
    for (let i = 0; i < 300; i++) {
      const r = Math.random() * 11;
      const angle = Math.random() * Math.PI * 2;
      const z = -Math.random() * TUNNEL_LENGTH;
      particles.push({ r, angle, zBase: z, offset: Math.random() * TUNNEL_LENGTH });
    }

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

    let last = performance.now();

    const render = (now) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (now > state.warpUntil) {
        state.targetSpeed = 0.25;
      }
      state.actualSpeed = lerp(state.actualSpeed, state.targetSpeed, delta * 3.0);
      const uWarp = Math.max(0, Math.min(1, (state.actualSpeed - 0.25) / (2.2 - 0.25)));

      state.time += delta * state.actualSpeed * 60.0;
      state.rotation += delta * 0.002 * 60.0; // Slower rotation

      state.smoothMouse.x = lerp(state.smoothMouse.x, state.mouse.x, 0.05);
      state.smoothMouse.y = lerp(state.smoothMouse.y, state.mouse.y, 0.05);
      const mouseActive = state.mouse.active;

      const shiftX = mouseActive ? (state.smoothMouse.x - w/2) * 0.8 : 0;
      const shiftY = mouseActive ? (state.smoothMouse.y - h/2) * 0.8 : 0;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      const cx = w / 2;
      const cy = h / 2;

      particles.forEach(p => {
        const traveled = mod(p.zBase + state.time + p.offset, TUNNEL_LENGTH) - TUNNEL_LENGTH * 0.5;
        
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
        const tint = uWarp * 0.5;
        const warpRgb = lerpAuroraRgb(edgeRgb, AURORA_RGB.violet, tint);
        const fr = warpRgb.r;
        const fg = warpRgb.g;
        const fb = warpRgb.b;

        const scale = 300.0 / zDist;
        const size2d = Math.max(0.5, 3.5 * scale * 0.05);
        const alpha = vDepth * 0.9;

        const depthFactor = clamp(1.0 - zDist / (TUNNEL_LENGTH * 0.5), 0, 1);
        const screenX = cx - shiftX * depthFactor + px * scale;
        const screenY = cy - shiftY * depthFactor + py * scale;

        const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size2d);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
        grad.addColorStop(0.25, `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.75})`);
        grad.addColorStop(0.55, `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.25})`);
        grad.addColorStop(1, `rgba(${fr}, ${fg}, ${fb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size2d, 0, Math.PI * 2);
        ctx.fill();
      });

      // RINGS (14 evenly spaced LineLoop rings from the shader)
      ctx.strokeStyle = 'rgba(52, 180, 140, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        const zOffset = (i / 14) * TUNNEL_LENGTH;
        const ringZ = mod(zOffset + state.time, TUNNEL_LENGTH) - TUNNEL_LENGTH * 0.5;
        
        const zDist = 8 - ringZ;
        if (zDist < 0.1 || ringZ >= 8) continue;
        
        const scale = 300.0 / zDist;
        const radius2d = 14.0 * scale;
        const depthFactor = clamp(1.0 - zDist / (TUNNEL_LENGTH * 0.5), 0, 1);
        
        const screenX = cx - shiftX * depthFactor;
        const screenY = cy - shiftY * depthFactor;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius2d, 0, Math.PI * 2);
        ctx.stroke();
      }

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
      style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
}
