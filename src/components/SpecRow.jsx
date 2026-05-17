export default function SpecRow({ label, detail }) {
  return (
    <div className="grid w-full grid-cols-1 gap-0.5 border-b border-white/[0.06] py-2.5 last:border-b-0 sm:grid-cols-[minmax(7.5rem,auto)_1fr_auto] sm:items-baseline sm:gap-x-3">
      <span className="font-dm text-xs font-medium text-white">{label}</span>
      <span
        className="hidden overflow-hidden whitespace-nowrap text-[10px] tracking-[0.3em] text-white/15 sm:block"
        aria-hidden="true"
      >
        {'·'.repeat(24)}
      </span>
      <span className="font-dm text-xs leading-snug text-white/70 sm:text-right">{detail}</span>
    </div>
  );
}
