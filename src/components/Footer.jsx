import { FiChevronDown } from 'react-icons/fi';
import SocialIcons from './SocialIcons';

export default function Footer({ showScrollHint = true, onScrollDown }) {
  return (
    <footer className="pointer-events-none fixed bottom-0 z-[100] flex h-9 w-full items-center border-t border-white/10 px-6 md:px-8">
      <div className="flex items-center gap-6">
        <p className="pointer-events-auto hidden text-[10px] text-white/25 sm:block">
          2026 © Copyright Harsh. All Rights Reserved.
        </p>
        <div className="pointer-events-auto hidden gap-4 text-[9px] text-white/20 sm:flex">
          <a href="#" className="hover:text-white/50 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white/50 transition-colors">Cookie Notice</a>
        </div>
      </div>

      {showScrollHint && (
        <button
          type="button"
          onClick={onScrollDown}
          className="pointer-events-auto absolute bottom-2.5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 transition-colors hover:opacity-80"
        >
          <div className="flex flex-col items-center gap-2">
            <div style={{
              width: 28, height: 28,
              border: '1px solid rgba(255,255,255,0.15)',
              borderTopColor: 'rgba(255,255,255,0.7)',
              borderRadius: '50%',
              animation: 'spin 1.4s linear infinite'
            }} />
            <span className="font-dm text-[9px] uppercase tracking-[0.3em] text-white/30">
              Scroll
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/35 hover:text-white/60">
            <span className="scroll-hint-text whitespace-nowrap text-[10px] tracking-wide">
              Scroll Down To Continue
            </span>
            <FiChevronDown className="chevron-animate text-sm" aria-hidden />
          </div>
        </button>
      )}

      <div className="pointer-events-auto ml-auto">
        <SocialIcons />
      </div>
    </footer>
  );
}
