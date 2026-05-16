export default function SectionBadge({ number, title }) {
  return (
    <p className="mb-3 font-dm text-[11px] uppercase tracking-[0.28em] text-white/20">
      {String(number).padStart(2, '0')} —{title ? ` ${title}` : ''}
    </p>
  );
}
