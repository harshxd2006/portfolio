export default function SectionShell({ id, children, className = '', align = 'center' }) {
  const alignClass =
    align === 'start' ? 'items-center justify-center' : 'items-center justify-center';

  return (
    <section
      id={id}
      className={`snap-section relative z-10 flex ${alignClass} bg-transparent ${className}`}
    >
      <div className="snap-section-inner relative mx-auto flex w-full max-w-6xl flex-col px-8 pb-14 pt-20 md:px-12 md:pb-16 md:pt-24">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div style={{
            position: 'absolute',
            top: '20%', left: '15%',
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, rgba(52,255,168,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '15%', right: '10%',
            width: '300px', height: '300px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }} />
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 w-full flex-col">{children}</div>
      </div>
    </section>
  );
}
