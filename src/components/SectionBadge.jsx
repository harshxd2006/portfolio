import { memo, useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const VIEWPORT = { once: true, margin: '0px 0px -80px 0px' };
const COUNT_DURATION_MS = 600;
const COUNT_STEPS = 24;

function SectionBadge({ number, title }) {
  const ref = useRef(null);
  const isInView = useInView(ref, VIEWPORT);
  const target = Number(number);
  const [display, setDisplay] = useState('00');

  useEffect(() => {
    if (!isInView) return undefined;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplay(String(target).padStart(2, '0'));
      return undefined;
    }

    let step = 0;
    const intervalMs = COUNT_DURATION_MS / COUNT_STEPS;

    const intervalId = window.setInterval(() => {
      step += 1;
      const progress = Math.min(1, step / COUNT_STEPS);
      const value = Math.round(progress * target);
      setDisplay(String(value).padStart(2, '0'));

      if (step >= COUNT_STEPS) {
        window.clearInterval(intervalId);
        setDisplay(String(target).padStart(2, '0'));
      }
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [isInView, target]);

  return (
    <p
      ref={ref}
      className="mb-3 font-dm text-[11px] uppercase tracking-[0.28em] text-white/20"
    >
      {display} —{title ? ` ${title}` : ''}
    </p>
  );
}

export default memo(SectionBadge);
