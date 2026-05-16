export default function Header({ onMenuOpen }) {
  return (
    <header className="pointer-events-none fixed top-0 z-[100] flex w-full items-center justify-between px-8 py-6 md:px-10">
      <a
        href="#hero"
        className="pointer-events-auto font-syne text-base font-extrabold tracking-tight text-white"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        harsh.ai
      </a>

      <button
        type="button"
        aria-label="Open navigation menu"
        className="pointer-events-auto group flex h-10 w-10 items-center justify-center"
        onClick={onMenuOpen}
      >
        <span className="flex items-center gap-[5px]" aria-hidden="true">
          <span className="block h-4 w-px bg-white/90 transition-opacity group-hover:opacity-100" />
          <span className="block h-4 w-px bg-white/90 transition-opacity group-hover:opacity-100" />
        </span>
      </button>
    </header>
  );
}
