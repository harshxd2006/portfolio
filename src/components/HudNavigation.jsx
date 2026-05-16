import { SECTIONS } from '../constants/sections';

export default function HudNavigation({ activeId, onNavigate }) {
  const trackHeight = 200;

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-8 top-1/2 z-50 -translate-y-1/2"
      style={{ width: 24 }}
    >
      <div
        className="absolute left-1/2 top-1/2 w-px -translate-x-1/2 -translate-y-1/2 bg-white/15"
        style={{ height: trackHeight }}
        aria-hidden="true"
      />

      <ul className="relative flex flex-col items-center justify-between" style={{ height: trackHeight }}>
        {SECTIONS.map(({ id, label }) => {
          const isActive = activeId === id;
          return (
            <li key={id} className="group relative flex items-center justify-center">
              <button
                type="button"
                aria-label={`Go to ${label}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onNavigate(id)}
                className="relative flex h-6 w-6 items-center justify-center"
              >
                <span
                  className={`rounded-full transition-all duration-500 ease-out ${
                    isActive
                      ? 'hud-dot-active h-1.5 w-1.5 bg-white'
                      : 'h-1 w-1 bg-white/25 group-hover:bg-white/50'
                  }`}
                />
              </button>

              <span className="pointer-events-none absolute right-7 whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-white/0 opacity-0 transition-all duration-200 group-hover:text-white/60 group-hover:opacity-100">
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
