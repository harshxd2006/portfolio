export default function SectionShell({ id, children, className = '', align = 'center' }) {
  const alignClass =
    align === 'start' ? 'items-center justify-center' : 'items-center justify-center';

  return (
    <section
      id={id}
      className={`snap-section relative z-10 flex ${alignClass} bg-transparent ${className}`}
    >
      <div className="snap-section-inner relative mx-auto flex w-full max-w-6xl flex-col px-8 pb-14 pt-20 md:px-12 md:pb-16 md:pt-24">
        <div
          className="pointer-events-none absolute inset-0 -mx-4 bg-[radial-gradient(ellipse_55%_50%_at_50%_44%,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.5)_50%,transparent_85%)] md:-mx-6"
          aria-hidden="true"
        />
        <div className="relative z-10 flex min-h-0 flex-1 w-full flex-col">{children}</div>
      </div>
    </section>
  );
}
