export default function TimelineEntry({ year, title, description }) {
  return (
    <li className="relative pl-8">
      <span
        className="timeline-dot-pulse absolute left-0 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-white"
        aria-hidden="true"
      />
      <p className="mb-1 font-dm text-[11px] uppercase tracking-[0.2em] text-white/60">{year}</p>
      <h3 className="font-syne text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 max-w-3xl font-dm text-[13px] font-light leading-relaxed text-white/80">
        {description}
      </p>
    </li>
  );
}
