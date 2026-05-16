import { useCallback, useRef } from 'react';

function easeOutQuint(t) {
  return 1 - (1 - t) ** 5;
}

export function useSnapScroll(containerRef, sectionIds) {
  const animatingRef = useRef(false);
  const rafRef = useRef(null);

  const scrollToSection = useCallback(
    (idOrIndex) => {
      const container = containerRef.current;
      if (!container || animatingRef.current) return;

      let target = null;
      if (typeof idOrIndex === 'number') {
        target = sectionIds.map((id) => document.getElementById(id)).filter(Boolean)[idOrIndex];
      } else {
        target = document.getElementById(idOrIndex);
      }
      if (!target) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        target.scrollIntoView({ block: 'start' });
        return;
      }

      const startTop = container.scrollTop;
      const targetTop = target.offsetTop;
      const distance = targetTop - startTop;

      if (Math.abs(distance) < 4) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const duration = Math.min(1100, Math.max(650, Math.abs(distance) * 0.85));
      const startTime = performance.now();
      animatingRef.current = true;

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuint(progress);

        container.scrollTop = startTop + distance * eased;

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          container.scrollTop = targetTop;
          animatingRef.current = false;
          rafRef.current = null;
        }
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [containerRef, sectionIds],
  );

  return { scrollToSection };
}
