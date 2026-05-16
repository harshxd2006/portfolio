import { AnimatePresence, motion } from 'framer-motion';
import { SECTIONS } from '../constants/sections';

export default function NavOverlay({ isOpen, onClose, onNavigate }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute right-8 top-6 flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
            onClick={onClose}
          >
            <span className="relative block h-4 w-4">
              <span className="absolute left-0 top-1/2 block h-px w-4 -translate-y-1/2 rotate-45 bg-white" />
              <span className="absolute left-0 top-1/2 block h-px w-4 -translate-y-1/2 -rotate-45 bg-white" />
            </span>
          </button>

          <nav className="m-auto flex flex-col items-center gap-2 px-8">
            {SECTIONS.map(({ id, label }, i) => (
              <motion.button
                key={id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.04 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="font-syne text-4xl font-bold tracking-tight text-white/80 transition-colors duration-300 hover:text-white md:text-6xl"
                onClick={() => {
                  onNavigate(id);
                  onClose();
                }}
              >
                {label}
              </motion.button>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
