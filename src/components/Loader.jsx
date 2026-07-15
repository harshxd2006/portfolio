import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { scheduleAssetPreload } from '../utils/preloadAssets';

export default function Loader({ onComplete }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 1600);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    scheduleAssetPreload();
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative flex flex-col items-center">
        <svg
          width="140"
          height="70"
          viewBox="0 0 140 70"
          className="absolute -top-10"
          aria-hidden="true"
        >
          <path
            d="M 12 58 A 58 58 0 0 1 128 58"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.5"
            className="loader-arc"
          />
        </svg>
        <span className="font-syne text-xl font-extrabold tracking-tight text-white">
          Loading...
        </span>
      </div>
    </motion.div>
  );
}
