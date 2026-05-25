import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import { AURORA_RGB } from '../constants/auroraTheme';
import { createFpsGate, getGraphicsProfile, shouldRenderGraphics } from '../utils/graphicsPerf';
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

    const angle = 68 * (Math.PI / 180);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const createStreak = (initial = false) => {
      const isAurora = Math.random() > 0.5;
      const auroraColor = isAurora ? AURORA_RGB.mint : AURORA_RGB.violet;
      return {
        x: initial ? Math.random() * width : Math.random() > 0.5 ? Math.random() * width : -200,
        y: initial ? Math.random() * height : Math.random() > 0.5 ? -200 : Math.random() * height,
        length: Math.random() * 260 + 160,
        speed: Math.random() * 7 + 4,
        color: `rgba(${auroraColor.r},${auroraColor.g},${auroraColor.b}`,
        maxOpacity: isAurora ? 0.82 : 0.64,
        width: Math.random() * 2.2 + 0.8,
      };
    };

    const initStreaks = () => {
      streaks = [];
      const numStreaks = perf.lowPower
        ? Math.floor(Math.random() * 4) + 16
        : Math.floor(Math.random() * 8) + 28;
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

        ctx.lineWidth = streak.width * 4;
        ctx.globalAlpha = 0.3;
        ctx.stroke();

        ctx.lineWidth = streak.width * 2;
        ctx.globalAlpha = 0.6;
        ctx.stroke();

        ctx.lineWidth = streak.width;
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

  return <canvas ref={canvasRef} className="hero-streak-canvas opacity-70" aria-hidden="true" />;
}

function HeroSculptureMesh() {
  const groupRef = useRef(null);
  const slashRef = useRef(null);
  const ringMaterial = useMemo(
    () => ({
      color: '#dffcff',
      emissive: '#86f7ff',
      emissiveIntensity: 2.4,
      metalness: 0.72,
      roughness: 0.18,
    }),
    [],
  );

  useFrame(({ clock, pointer }) => {
    const elapsed = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(elapsed * 0.35) * 0.28 + pointer.x * 0.12;
      groupRef.current.rotation.x = Math.sin(elapsed * 0.22) * 0.12 - pointer.y * 0.08;
      groupRef.current.position.y = Math.sin(elapsed * 0.7) * 0.08;
    }
    if (slashRef.current) {
      slashRef.current.rotation.z = -0.34 + Math.sin(elapsed * 0.9) * 0.035;
      slashRef.current.scale.y = 1 + Math.sin(elapsed * 1.4) * 0.04;
    }
  });

  return (
    <Float speed={1.25} rotationIntensity={0.18} floatIntensity={0.55}>
      <group ref={groupRef} rotation={[0.05, -0.28, 0.08]}>
        <mesh position={[0, 0.76, 0]} scale={[1.22, 0.72, 0.42]}>
          <torusGeometry args={[1.02, 0.09, 18, 120]} />
          <meshStandardMaterial {...ringMaterial} transparent opacity={0.96} />
        </mesh>
        <mesh position={[0, -0.76, 0]} scale={[1.22, 0.72, 0.42]}>
          <torusGeometry args={[1.02, 0.09, 18, 120]} />
          <meshStandardMaterial {...ringMaterial} transparent opacity={0.96} />
        </mesh>
        <mesh ref={slashRef} position={[0.08, 0, 0.12]} rotation={[0, 0, -0.34]} scale={[0.18, 2.72, 0.18]}>
          <capsuleGeometry args={[0.22, 2.8, 18, 36]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#b7fbff"
            emissiveIntensity={3.2}
            metalness={0.7}
            roughness={0.12}
          />
        </mesh>
        <mesh position={[0, 0, -0.08]} scale={[1.8, 1.8, 0.08]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#61f1ff" transparent opacity={0.055} />
        </mesh>
      </group>
    </Float>
  );
}

function HeroSculpture() {
  return (
    <div className="hero-sculpture" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 38 }}
        dpr={[1, 1.7]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.85} />
        <pointLight position={[2.5, 2.5, 3]} intensity={7} color="#dffcff" />
        <pointLight position={[-3, -2, 2]} intensity={3.2} color="#7c3cff" />
        <HeroSculptureMesh />
      </Canvas>
    </div>
  );
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
    <SectionShell id="hero" align="start" className="hero-landing">
      <NeonStreaks isActive={isActive} />
      <div className="hero-depth-field" aria-hidden="true" />
      <HeroSculpture />

      <div className="hero-corner-label hero-corner-left">Harsh</div>
      <a
        href="#contact"
        onClick={(e) => {
          e.preventDefault();
          onNavigate?.('contact');
        }}
        className="hero-corner-label hero-corner-right pointer-events-auto"
      >
        Contacts
      </a>

      <div className="relative z-10 flex min-h-[70vh] w-full flex-col justify-end pb-24 md:pb-16">
        <motion.div className="hero-copy max-w-3xl" variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <SectionHeading
              label="Engineering Physics / NIT Hamirpur"
              headline={
                <>
                  Accelerating
                  <br />
                  intelligent
                  <br />
                  systems.
                </>
              }
              headlineClassName="hero-headline leading-[0.98]"
            />
          </motion.div>

          <motion.div
            variants={item}
            className="mt-7 max-w-[560px] font-dm text-sm font-light leading-relaxed text-white/80 md:text-base"
          >
            <RevealWords>
              AI systems, full-stack platforms &amp; robotics - from hackathon podiums to
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
              className="hero-primary-btn bg-white px-6 py-3 font-dm text-xs font-normal tracking-wide text-black transition-opacity hover:opacity-90"
            >
              See My Work
            </a>
            <a
              href="https://github.com/harshxd2006"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-secondary-btn border border-white/50 px-6 py-3 font-dm text-xs tracking-wide text-white transition-colors hover:bg-white/[0.04]"
            >
              GitHub
            </a>
          </motion.div>
        </motion.div>
      </div>

      <Marquee className="pointer-events-auto absolute bottom-8 left-0 right-0 z-10 md:bottom-12" />
    </SectionShell>
  );
}
