import { motion } from 'framer-motion';
import { inViewOptions, revealContainer, revealItem } from '../constants/animations';

export function Reveal({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={revealContainer}
      initial="hidden"
      whileInView="show"
      viewport={inViewOptions}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className = '' }) {
  return (
    <motion.div className={className} variants={revealItem}>
      {children}
    </motion.div>
  );
}
