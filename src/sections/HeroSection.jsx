import { motion } from 'framer-motion';
import HexagonCard from '../components/HexagonCard';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.2, delayChildren: 0 },
  },
};

export default function HeroSection({ onNavigate }) {
  return (
    <SectionShell id="hero" align="start">
      <div className="relative flex min-h-[70vh] flex-col justify-center">
        <motion.div className="max-w-3xl" variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <SectionHeading
              label="Engineering Physics · NIT Hamirpur"
              headline={
                <>
                  Building things
                  <br />
                  at the edge of
                  <br />
                  physics &amp; code.
                </>
              }
              headlineClassName="leading-[1.02]"
            />
          </motion.div>

          <motion.p
            variants={item}
            className="mt-8 max-w-[480px] font-dm text-sm font-light leading-relaxed text-white/45"
          >
            AI systems, full-stack platforms &amp; robotics — from hackathon podiums to
            production.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.('projects');
              }}
              className="bg-white px-6 py-3 font-dm text-xs font-normal tracking-wide text-black transition-opacity hover:opacity-90"
            >
              See My Work →
            </a>
            <a
              href="https://github.com/harshxd2006"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/50 px-6 py-3 font-dm text-xs tracking-wide text-white transition-colors hover:bg-white/[0.04]"
            >
              GitHub ↗
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute right-0 top-8 hidden lg:block"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.8 }}
        >
          <HexagonCard />
        </motion.div>
      </div>
    </SectionShell>
  );
}
