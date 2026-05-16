import { FiChevronDown } from 'react-icons/fi';
import SocialIcons from './SocialIcons';

export default function Footer({ showScrollHint = true, onScrollDown }) {
  return (
    <footer className="pointer-events-none fixed bottom-0 z-[100] flex h-9 w-full items-center border-t border-white/10 px-6 md:px-8">
      <p className="pointer-events-auto hidden text-[10px] text-white/25 sm:block">
        2026 © Copyright Harsh. All Rights Reserved.
      </p>

      {showScrollHint && (
        <button
          type="button"
          onClick={onScrollDown}
          className="pointer-events-auto absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 text-white/35 transition-colors hover:text-white/60"
        >
          <span className="scroll-hint-text whitespace-nowrap text-[10px] tracking-wide">
            Scroll Down To Continue
          </span>
          <FiChevronDown className="chevron-animate text-sm" aria-hidden />
        </button>
      )}

      <div className="pointer-events-auto ml-auto">
        <SocialIcons />
      </div>
    </footer>
  );
}
