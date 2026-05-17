import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AURORA_RGB } from '../constants/auroraTheme';
import { createFpsGate, getGraphicsProfile, shouldRenderGraphics } from '../utils/graphicsPerf';
import HexagonCard from '../components/HexagonCard';
import Marquee from '../components/Marquee';
import { RevealWords } from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';

function NeonStreaks({ isActive }) {
  const canvasRef = useRef(null);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let streaks = [];
    let animationFrameId;
    let pauseTimer = 0;
    const perf = getGraphicsProfile();
    const prefersReducedMotion = perf.reducedMotion;
    const shouldRenderFrame = createFpsGate(perf.targetFps);

    const angle = 35 * (Math.PI / 180);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const createStreak = (initial = false) => {
      const isAurora = Math.random() > 0.5;
      const auroraColor = isAurora ? AURORA_RGB.mint : AURORA_RGB.violet;
      return {
        x: initial ? Math.random() * width : (Math.random() > 0.5 ? Math.random() * width : -200),
        y: initial ? Math.random() * height : (Math.random() > 0.5 ? -200 : Math.random() * height),
        length: Math.random() * 120 + 80,
        speed: Math.random() * 4 + 2,
        color: `rgba(${auroraColor.r},${auroraColor.g},${auroraColor.b}`,
        maxOpacity: isAurora ? 0.65 : 0.5,
      };
    };

    const initStreaks = () => {
      streaks = [];
      const numStreaks = perf.lowPower
        ? Math.floor(Math.random() * 3) + 10
        : Math.floor(Math.random() * 4) + 14;
      for (let i = 0; i < numStreaks; i++) {
        streaks.push(createStreak(true));
      }
    };

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      const dpr = perf.pixelRatio;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initStreaks();
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(canvas);
    resize();

    const render = (now) => {
      if (!isActiveRef.current) {
        pauseTimer = window.setTimeout(() => {
          animationFrameId = requestAnimationFrame(render);
        }, 400);
        return;
      }

      if (!shouldRenderGraphics()) {
        pauseTimer = window.setTimeout(() => {
          animationFrameId = requestAnimationFrame(render);
        }, 300);
        return;
      }

      if (!shouldRenderFrame(now)) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      streaks.forEach((streak) => {
        if (!prefersReducedMotion) {
          streak.x += streak.speed * cosA;
          streak.y += streak.speed * sinA;
        }

        if (streak.x - streak.length * cosA > width || streak.y - streak.length * sinA > height) {
          Object.assign(streak, createStreak(false));
        }

        const tailX = streak.x - streak.length * cosA;
        const tailY = streak.y - streak.length * sinA;

        const grad = ctx.createLinearGradient(tailX, tailY, streak.x, streak.y);
        grad.addColorStop(0, `${streak.color},0)`);
        grad.addColorStop(0.5, `${streak.color},${streak.maxOpacity})`);
        grad.addColorStop(1, `${streak.color},0)`);

        ctx.lineCap = 'round';
        ctx.strokeStyle = grad;

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(streak.x, streak.y);

        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.3;
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.stroke();
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      clearTimeout(pauseTimer);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-streak-canvas opacity-35" aria-hidden="true" />;
}

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.2, delayChildren: 0 },
  },
};

export default function HeroSection({ onNavigate, isActive = true }) {
  return (
    <SectionShell id="hero" align="start">
      <NeonStreaks isActive={isActive} />
      <div className="relative z-10 flex min-h-[70vh] flex-col justify-center w-full">
        <motion.div className="max-w-3xl" variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <SectionHeading
              label="Engineering Physics · NIT Hamirpur"
              headline={
                <>
                  Building things
                  <br />
                  at the edge of
                  <br />
                  physics &amp; code.
                </>
              }
              headlineClassName="leading-[1.02]"
            />
          </motion.div>

          <motion.div
            variants={item}
            className="mt-8 max-w-[480px] font-dm text-sm font-light leading-relaxed text-white/80"
          >
            <RevealWords>
              AI systems, full-stack platforms &amp; robotics — from hackathon podiums to
              production.
            </RevealWords>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.('projects');
              }}
              className="bg-white px-6 py-3 font-dm text-xs font-normal tracking-wide text-black transition-opacity hover:opacity-90"
            >
              See My Work →
            </a>
            <a
              href="https://github.com/harshxd2006"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/50 px-6 py-3 font-dm text-xs tracking-wide text-white transition-colors hover:bg-white/[0.04]"
            >
              GitHub ↗
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute -right-20 -top-10 opacity-25 md:-right-10 md:top-0 md:opacity-40 lg:right-0 lg:top-8 lg:opacity-100"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.8 }}
        >
          <HexagonCard />
        </motion.div>
      </div>

      <Marquee className="pointer-events-auto absolute bottom-20 left-0 right-0 z-10" />
    </SectionShell>
  );
}
