import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';
import AmbientPlayer from './components/AmbientPlayer';
import BackgroundCanvas from './components/BackgroundCanvas';
import Footer from './components/Footer';
import Header from './components/Header';
import HudNavigation from './components/HudNavigation';
import Loader from './components/Loader';
import NavOverlay from './components/NavOverlay';
import { pageEnter } from './constants/animations';
import { SECTIONS } from './constants/sections';
import { useActiveSection } from './hooks/useActiveSection';
import { useSnapScroll } from './hooks/useSnapScroll';
import ContactSection from './sections/ContactSection';
import ExperienceSection from './sections/ExperienceSection';
import HeroSection from './sections/HeroSection';
import MoreProjectsSection from './sections/MoreProjectsSection';
import ProjectsSection from './sections/ProjectsSection';
import StackSection from './sections/StackSection';

export default function App() {
  const scrollRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const sectionIds = SECTIONS.map((s) => s.id);
  const activeId = useActiveSection(scrollRef, sectionIds);
  const { scrollToSection } = useSnapScroll(scrollRef, sectionIds);

  const navigateTo = useCallback(
    (id) => {
      scrollToSection(id);
    },
    [scrollToSection],
  );

  const isLastSection = activeId === sectionIds[sectionIds.length - 1];

  return (
    <>
      <BackgroundCanvas scrollRef={scrollRef} activeSectionId={activeId || 'hero'} />

      <AnimatePresence mode="wait">
        {loading && <Loader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <motion.div
          className="ui-layer relative min-h-screen"
          variants={pageEnter}
          initial="hidden"
          animate="show"
        >
          <Header onMenuOpen={() => setMenuOpen(true)} />
          <Footer
            showScrollHint={!isLastSection}
            onScrollDown={() => {
              const currentIndex = sectionIds.indexOf(activeId);
              if (currentIndex >= 0 && currentIndex < sectionIds.length - 1) {
                scrollToSection(sectionIds[currentIndex + 1]);
              }
            }}
          />
          <HudNavigation activeId={activeId} onNavigate={navigateTo} />
          <AmbientPlayer scrollRef={scrollRef} />
          <NavOverlay
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            onNavigate={navigateTo}
          />

          <main
            ref={scrollRef}
            tabIndex={-1}
            className="snap-container relative z-10 outline-none"
            aria-label="Portfolio sections"
          >
            <HeroSection onNavigate={navigateTo} />
            <StackSection />
            <ProjectsSection />
            <MoreProjectsSection />
            <ExperienceSection />
            <ContactSection />
          </main>
        </motion.div>
      )}
    </>
  );
}
