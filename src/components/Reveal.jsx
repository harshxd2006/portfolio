import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { inViewOptions, revealContainer, revealItem } from '../constants/animations';

const WORD_VIEWPORT = { once: true, margin: '0px 0px -80px 0px' };
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

function splitHeadlineLines(headline) {
  if (typeof headline === 'string') {
    return headline.split('\n').filter((line) => line.length > 0 || headline.includes('\n'));
  }

  const lines = [];
  let buffer = '';

  Children.forEach(headline, (child) => {
    if (child == null || typeof child === 'boolean') return;

    if (typeof child === 'string') {
      buffer += child;
      return;
    }

    if (isValidElement(child) && child.type === 'br') {
      lines.push(buffer.trim());
      buffer = '';
      return;
    }

    if (isValidElement(child)) {
      buffer += splitHeadlineLines(child.props.children).join(' ');
    }
  });

  if (buffer.trim() || lines.length === 0) {
    lines.push(buffer.trim());
  }

  return lines;
}

function randomScrambleChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

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

/** Type A — word-by-word wipe up */
export function RevealWords({ children, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, WORD_VIEWPORT);
  const reduced = usePrefersReducedMotion();
  const text = typeof children === 'string' ? children : String(children ?? '');
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <span ref={ref} className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="mr-[0.28em] inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: '110%', opacity: 0 }}
            animate={
              reduced || isInView
                ? { y: '0%', opacity: 1 }
                : { y: '110%', opacity: 0 }
            }
            transition={{
              duration: 0.65,
              ease: [0.16, 1, 0.3, 1],
              delay: reduced ? 0 : index * 0.07,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Type B — line block wipe */
export function RevealLine({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, WORD_VIEWPORT);
  const reduced = usePrefersReducedMotion();

  return (
    <div ref={ref} className={`overflow-hidden ${className}`.trim()}>
      <motion.div
        initial={reduced ? false : { y: '105%' }}
        animate={reduced || isInView ? { y: '0%' } : { y: '105%' }}
        transition={{
          duration: 0.75,
          ease: [0.16, 1, 0.3, 1],
          delay: reduced ? 0 : delay,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Type C — character scramble headline */
export function RevealHeadline({ children, className = '', as: Tag = 'h2' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, WORD_VIEWPORT);
  const reduced = usePrefersReducedMotion();
  const lines = splitHeadlineLines(children);
  const fullText = lines.join('\n');
  const [display, setDisplay] = useState(reduced ? fullText : '');

  useEffect(() => {
    if (reduced) {
      setDisplay(fullText);
      return undefined;
    }

    if (!isInView) {
      setDisplay('');
      return undefined;
    }

    const chars = fullText.split('');
    const resolved = new Array(chars.length).fill(false);
    const cleanups = [];

    const render = () => {
      setDisplay(
        chars
          .map((char, i) => {
            if (char === '\n') return '\n';
            if (resolved[i]) return char;
            return randomScrambleChar();
          })
          .join(''),
      );
    };

    chars.forEach((target, index) => {
      const startTimeout = window.setTimeout(() => {
        if (target === '\n') {
          resolved[index] = true;
          render();
          return;
        }

        let iterations = 0;
        const maxIterations = 6 + Math.floor(Math.random() * 3);

        const interval = window.setInterval(() => {
          iterations += 1;
          const done = iterations >= maxIterations;
          if (done) resolved[index] = true;
          render();
          if (done) window.clearInterval(interval);
        }, 45);

        cleanups.push(() => window.clearInterval(interval));
      }, index * 40);

      cleanups.push(() => window.clearTimeout(startTimeout));
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [isInView, reduced, fullText]);

  const renderLines = () => {
    const parts = display.split('\n');
    return parts.map((line, lineIndex) => (
      <span key={lineIndex}>
        {line}
        {lineIndex < parts.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <Tag ref={ref} className={className}>
      {renderLines()}
    </Tag>
  );
}
