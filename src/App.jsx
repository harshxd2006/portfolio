import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { lazy, memo, Suspense, useCallback, useRef, useState } from 'react';
import BackgroundCanvas from './components/BackgroundCanvas';
import Loader from './components/Loader';
import { pageEnter } from './constants/animations';

const AmbientPlayer = lazy(() => import('./components/AmbientPlayer'));
const CinematicShowcase = lazy(() => import('./components/CinematicShowcase'));

const MainContent = memo(function MainContent() {
  const containerRef = useRef(null);
  const [isIntro, setIsIntro] = useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const nextIsIntro = latest < 0.06;
    setIsIntro((current) => (current === nextIsIntro ? current : nextIsIntro));
  });

  return (
    <motion.div
      className="ui-layer relative min-h-screen w-full"
      variants={pageEnter}
      initial="hidden"
      animate="show"
    >
      <div className="background-layer fixed inset-0" style={{ pointerEvents: 'none' }}>
        <BackgroundCanvas
          activeSectionId="cinematic"
          paused={false}
          isIntro={isIntro}
        />
      </div>

      <Suspense fallback={null}>
        <AmbientPlayer />
      </Suspense>

      <main
        ref={containerRef}
        className="relative z-10 w-full outline-none"
        aria-label="Cinematic Portfolio"
      >
        <Suspense fallback={null}>
          <CinematicShowcase scrollYProgress={scrollYProgress} />
        </Suspense>
      </main>
    </motion.div>
  );
});

export default function App() {
  const [loading, setLoading] = useState(true);
  const handleLoaderComplete = useCallback(() => setLoading(false), []);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <Loader onComplete={handleLoaderComplete} />}
      </AnimatePresence>

      {!loading && <MainContent />}
    </>
  );
}
