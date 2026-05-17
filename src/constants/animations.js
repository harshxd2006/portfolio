export const revealContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const revealItem = {
  hidden: { opacity: 0, y: 48, clipPath: 'inset(100% 0% 0% 0%)' },
  show: {
    opacity: 1,
    y: 0,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

export const inViewOptions = { once: true, amount: 0.2, margin: '0px 0px -40px 0px' };

export const pageEnter = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
  },
};
