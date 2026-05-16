export default function SpecRow({ label, detail }) {
  return (
    <div className="flex items-baseline gap-2 py-1.5">
      <span className="shrink-0 font-dm text-xs text-white">{label}</span>
      <span
        className="mb-0.5 min-w-[0.5rem] flex-1 overflow-hidden whitespace-nowrap text-[10px] tracking-[0.3em] text-white/15"
        aria-hidden="true"
      >
        {'·'.repeat(40)}
      </span>
      <span className="shrink-0 text-right font-dm text-xs text-white/70">{detail}</span>
    </div>
  );
}
