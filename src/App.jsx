import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import AmbientPlayer from './components/AmbientPlayer';
import BackgroundCanvas from './components/BackgroundCanvas';
import ChipScene from './components/ChipScene';
import Loader from './components/Loader';
import CinematicShowcase from './components/CinematicShowcase';
import { pageEnter } from './constants/animations';

function MainContent() {
  const containerRef = useRef(null);
  const chipFormationRef = useRef(1);
  
  // By using target, framer-motion tracks this specific element's scroll progress in the window
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const tunnelOpacity = useTransform(scrollYProgress, [0, 0.45, 0.52], [1, 1, 0]);
  const chipOpacity = useTransform(scrollYProgress, [0.45, 0.52, 1], [0, 1, 1]);
  const [showTunnel, setShowTunnel] = useState(true);
  const [showChip, setShowChip] = useState(false);
  const [pauseTunnel, setPauseTunnel] = useState(false);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const nextShowTunnel = latest < 0.54;
    const nextShowChip = latest > 0.42;

    setShowTunnel((current) => (current === nextShowTunnel ? current : nextShowTunnel));
    setShowChip((current) => (current === nextShowChip ? current : nextShowChip));
  });

  useMotionValueEvent(chipOpacity, 'change', (latest) => {
    const shouldPauseTunnel = latest > 0.35;
    setPauseTunnel((current) => (current === shouldPauseTunnel ? current : shouldPauseTunnel));
  });

  return (
    <motion.div
      className="ui-layer relative min-h-screen w-full"
      variants={pageEnter}
      initial="hidden"
      animate="show"
    >
      {showTunnel && (
        <motion.div className="background-layer fixed inset-0" style={{ opacity: tunnelOpacity, pointerEvents: 'none' }}>
          <BackgroundCanvas
            activeSectionId="cinematic"
            paused={!showTunnel || pauseTunnel}
          />
        </motion.div>
      )}
      {showChip && (
        <motion.div className="background-layer fixed inset-0" style={{ opacity: chipOpacity, pointerEvents: 'none' }}>
          <ChipScene active={showChip} formationRef={chipFormationRef} />
        </motion.div>
      )}

      <AmbientPlayer />

      <main
        ref={containerRef}
        className="relative z-10 w-full outline-none"
        aria-label="Cinematic Portfolio"
      >
        <CinematicShowcase scrollYProgress={scrollYProgress} />
      </main>
    </motion.div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <Loader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && <MainContent />}
    </>
  );
}
