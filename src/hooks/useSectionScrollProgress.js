import { useEffect, useRef } from 'react';

/**
 * Scroll progress 0→1 through a tall section (0 = section top at viewport top,
 * 1 = scrolled to end of section).
 */
export function useSectionScrollProgress(scrollRef, sectionId) {
  const progressRef = useRef(0);

  useEffect(() => {
    const container = scrollRef?.current;
    if (!container) return undefined;

    const update = () => {
      const section = document.getElementById(sectionId);
      if (!section) return;

      const vh = container.clientHeight;
      const scrollable = Math.max(section.offsetHeight - vh, 1);
      const raw = (container.scrollTop - section.offsetTop) / scrollable;
      progressRef.current = Math.max(0, Math.min(1, raw));
    };

    update();
    container.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      container.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [scrollRef, sectionId]);

  return progressRef;
}
