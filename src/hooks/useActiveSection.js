import { useEffect, useState } from 'react';

export function useActiveSection(containerRef, sectionIds) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return undefined;

    let scrollRaf = 0;
    const updateActive = () => {
      const vh = container.clientHeight;
      if (!vh) return;

      const index = Math.round(container.scrollTop / vh);
      const clamped = Math.max(0, Math.min(index, elements.length - 1));
      setActiveId(elements[clamped].id);
    };

    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        updateActive();
      });
    };

    updateActive();
    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
    };
  }, [containerRef, sectionIds]);

  return activeId;
}
