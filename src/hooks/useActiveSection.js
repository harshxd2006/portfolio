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

    const updateActive = () => {
      const vh = container.clientHeight;
      if (!vh) return;

      const index = Math.round(container.scrollTop / vh);
      const clamped = Math.max(0, Math.min(index, elements.length - 1));
      setActiveId(elements[clamped].id);
    };

    updateActive();
    container.addEventListener('scroll', updateActive, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: container,
        threshold: [0.55, 0.75, 0.95],
      },
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      container.removeEventListener('scroll', updateActive);
      observer.disconnect();
    };
  }, [containerRef, sectionIds]);

  return activeId;
}
