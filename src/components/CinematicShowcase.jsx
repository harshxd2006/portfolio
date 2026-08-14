import { AnimatePresence, motion, useMotionValueEvent } from 'framer-motion';
import { memo, useMemo, useState } from 'react';
import { FaGithub, FaInstagram, FaLinkedinIn } from 'react-icons/fa6';
import IntroHero from './IntroHero';

const transition = {
  duration: 0.75,
  ease: [0.16, 1, 0.3, 1],
};

const panelVariants = {
  enter: (direction) => ({
    x: direction * 120,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition,
  },
  exit: (direction) => ({
    x: direction * -120,
    opacity: 0,
    transition,
  }),
};

const itemVariants = {
  enter: ({ direction }) => ({
    x: direction * 120,
    opacity: 0,
  }),
  center: ({ order }) => ({
    x: 0,
    opacity: 1,
    transition: {
      ...transition,
      delay: order * 0.15,
    },
  }),
  exit: ({ direction }) => ({
    x: direction * -120,
    opacity: 0,
    transition,
  }),
};

const panels = [
  {
    id: 'intro',
    direction: 1,
    align: 'center',
    items: [
      {
        type: 'custom',
        render: () => <IntroHero />,
      },
    ],
  },
  {
    id: 'about',
    direction: -1,
    items: [
      { type: 'label', text: '01 — WHO I AM' },
      { type: 'headline', text: 'I build things at the edge of physics and code.' },
      {
        type: 'body',
        text:
          'From AI credit platforms to autonomous robots — I ship end-to-end systems that solve real problems. Currently in my third year at NIT Hamirpur, competing nationally and building in public.',
      },
    ],
  },
  {
    id: 'creditflow',
    direction: 1,
    items: [
      { type: 'label', text: '02 — FLAGSHIP PROJECT' },
      { type: 'headline', text: 'CreditFlow' },
      { type: 'tag', text: 'FinTech AI Platform' },
      {
        type: 'body',
        text:
          "A privacy-first AI credit scoring system for India's 400M unbanked citizens. Built with Logistic Regression, Pandas, React.js, Node.js and MongoDB. Delivers transparent risk reports and financial roadmaps.",
      },
      {
        type: 'achievement',
        text: '11th / 850+ teams — INNOVFEST 2026 · Selected for Grand Finale at Chandigarh University',
      },
      { type: 'link', text: 'View on GitHub ↗', href: 'https://github.com/harshxd2006' },
    ],
  },
  {
    id: 'insuresense',
    direction: -1,
    items: [
      { type: 'label', text: '03 — FLAGSHIP PROJECT' },
      { type: 'headline', text: 'InsureSense' },
      { type: 'tag', text: 'Multi-Agent AI System' },
      {
        type: 'body',
        text:
          'Real-time insurance risk assessment powered by 5+ live APIs — travel, weather, health, accidents, climate. Multi-agent parallel processing scores users 0–100 and recommends from 20+ insurance plans via Gemini API.',
      },
      { type: 'achievement', text: '16th / 390+ teams — GDG HackCentrix 2025, Mathura' },
      { type: 'link', text: 'View on GitHub ↗', href: 'https://github.com/harshxd2006' },
    ],
  },
  {
    id: 'more-projects',
    direction: 1,
    items: [
      { type: 'label', text: '04 — ALSO SHIPPED' },
      { type: 'headline', text: 'Other Builds' },
      { type: 'project', text: 'Stack AI — AI tool discovery platform. React.js, Vercel. Visit ↗', href: 'https://stack-ai-26.vercel.app/' },
      { type: 'project', text: 'Smart Calculator — Extended calculator app in Flutter/Dart for Android.' },
    ],
  },
  {
    id: 'stack-intro',
    direction: -1,
    align: 'center',
    items: [
      { type: 'headlineGiant', text: 'THE STACK' },
      { type: 'bodyLarge', text: 'Every tool I reach for.' },
      { type: 'bodyLarge', text: 'Every layer I understand.' },
    ],
  },
  {
    id: 'stack-detail',
    direction: 1,
    items: [
      { type: 'label', text: '05 — TECHNICAL ARSENAL' },
      { type: 'headline', text: 'What I build with.' },
      { type: 'column', text: 'Languages & Runtime — Python · C++ · Dart · JavaScript' },
      { type: 'column', text: 'Frameworks — React.js · Flutter · Node.js · ROS2 · Nav2' },
      { type: 'column', text: 'AI / ML & Data — Scikit-Learn · Gemini API · Pandas · MongoDB' },
    ],
  },
  {
    id: 'experience',
    direction: -1,
    compact: true,
    items: [
      { type: 'label', text: '06 — BATTLE RECORD' },
      { type: 'headline', text: "Where I've shown up." },
      { type: 'timeline', text: '2026 · 11th / 850+ — AI Hack Matrix INNOVFEST 2026, Grand Finale' },
      { type: 'timeline', text: '2025 · 16th / 390+ — GDG HackCentrix, Mathura' },
      { type: 'timeline', text: '2025 · 1st Place — Mecha Mayhem & Bowl the Derby, RoboWeek NIT Hamirpur' },
      { type: 'timeline', text: '2025 · Executive · Team ABRAXAS — RC car, Physics Carnival, Science Day' },
      { type: 'timeline', text: '2024 · B.Tech Engineering Physics · NIT Hamirpur · CGPA 7.58' },
    ],
  },
  {
    id: 'open-to-work',
    direction: 1,
    align: 'center',
    items: [
      { type: 'headlineGiant', text: 'OPEN TO' },
      { type: 'headlineGiant', text: 'WORK' },
      { type: 'bodyLarge', text: 'Internships · Hackathon Teams · Collaborations' },
      { type: 'bodyLarge', text: 'Full Stack · AI Systems · Robotics' },
    ],
  },
  {
    id: 'contact',
    direction: -1,
    items: [
      { type: 'label', text: '07 — GET IN TOUCH' },
      { type: 'headline', text: "Let's build something." },
      { type: 'body', text: 'Open to collabs, internships and hackathon teams.' },
      { type: 'link', text: 'harsh25006@gmail.com', href: 'mailto:harsh25006@gmail.com' },
      { type: 'link', text: '+91 8077490190', href: 'tel:+918077490190' },
      { type: 'icons' },
      { type: 'footer', text: '2026 © Harsh. All Rights Reserved.' },
    ],
  },
];

function itemClass(type) {
  const classes = {
    hero: 'cinematic-hero-name',
    headlineGiant: 'cinematic-giant',
    headline: 'cinematic-headline',
    bodyLarge: 'cinematic-body-large',
    introSubtitle: 'cinematic-intro-subtitle',
    body: 'cinematic-body',
    label: 'cinematic-label',
    tag: 'cinematic-tag',
    achievement: 'cinematic-achievement',
    link: 'cinematic-link',
    project: 'cinematic-project',
    column: 'cinematic-column',
    timeline: 'cinematic-timeline',
    hint: 'cinematic-hint scroll-hint-text',
    footer: 'cinematic-footer',
  };

  return classes[type] || 'cinematic-body';
}

const CinematicItem = memo(function CinematicItem({ item, direction, order }) {
  const custom = { direction, order };

  if (item.type === 'icons') {
    return (
      <motion.div
        className="cinematic-socials"
        custom={custom}
        variants={itemVariants}
        initial="enter"
        animate="center"
        exit="exit"
      >
        <a href="https://github.com/harshxd2006" target="_blank" rel="noreferrer" aria-label="GitHub">
          <FaGithub />
        </a>
        <a href="https://www.linkedin.com/in/harsh--25abc25" target="_blank" rel="noreferrer" aria-label="LinkedIn">
          <FaLinkedinIn />
        </a>
        <a href="https://www.instagram.com/itsharsh4433" target="_blank" rel="noreferrer" aria-label="Instagram">
          <FaInstagram />
        </a>
      </motion.div>
    );
  }

  if (item.type === 'custom') {
    return (
      <motion.div
        className="w-full relative z-10"
        custom={custom}
        variants={itemVariants}
        initial="enter"
        animate="center"
        exit="exit"
      >
        {item.render()}
      </motion.div>
    );
  }

  const content = item.href ? (
    <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined}>
      {item.text}
    </a>
  ) : (
    item.text
  );

  return (
    <motion.div
      className={itemClass(item.type)}
      custom={custom}
      variants={itemVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      {content}
    </motion.div>
  );
});

const ActivePanel = memo(function ActivePanel({ panel }) {
  const className = useMemo(
    () =>
      `cinematic-panel-content ${panel.align === 'center' ? 'is-centered' : ''} ${panel.compact ? 'is-compact' : ''} ${panel.id === 'intro' ? 'is-intro' : ''}`,
    [panel.align, panel.compact, panel.id],
  );

  return (
    <motion.div
      key={panel.id}
      className={className}
      custom={panel.direction}
      variants={panelVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      {panel.items.map((item, itemIndex) => (
        <CinematicItem
          key={`${panel.id}-${item.type}-${itemIndex}`}
          item={item}
          direction={panel.direction}
          order={itemIndex}
        />
      ))}
    </motion.div>
  );
});

export default function CinematicShowcase({ scrollYProgress }) {
  const [activePanel, setActivePanel] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const nextPanel = Math.min(panels.length - 1, Math.max(0, Math.round(latest * (panels.length - 1))));
    setActivePanel((current) => (current === nextPanel ? current : nextPanel));
  });

  const panel = panels[activePanel];

  return (
    <>
      {panels.map(({ id }) => (
        <section key={id} id={id} className="cinematic-snap-panel" aria-hidden="true" />
      ))}

      <div className={`cinematic-stage ${activePanel === 0 ? 'is-intro-active' : ''}`} aria-live="polite">
        <AnimatePresence mode="wait" custom={panel.direction}>
          <ActivePanel key={panel.id} panel={panel} />
        </AnimatePresence>

        {activePanel < panels.length - 1 && (
          <div className="cinematic-fixed-scroll-indicator scroll-hint-text">
            {activePanel === 0 ? 'Scroll to explore ↓' : 'Scroll ↓'}
          </div>
        )}
      </div>

      <nav className="cinematic-dots" aria-label="Active panel">
        {panels.map(({ id }, index) => (
          <a
            key={id}
            className={`cinematic-dot ${index === activePanel ? 'is-active' : ''}`}
            href={`#${id}`}
            aria-label={`Go to panel ${index + 1}`}
            aria-current={index === activePanel ? 'step' : undefined}
          />
        ))}
      </nav>
    </>
  );
}
