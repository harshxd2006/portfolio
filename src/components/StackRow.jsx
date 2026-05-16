export default function StackRow({ name, detail }) {
  return (
    <div className="group flex items-baseline gap-2 border-b border-white/10 py-3 transition-colors last:border-b-0 hover:bg-white/[0.04]">
      <span className="shrink-0 font-dm text-sm text-white">{name}</span>
      <span
        className="mx-1 mb-0.5 min-w-[1rem] flex-1 overflow-hidden whitespace-nowrap text-[10px] tracking-[0.35em] text-white/15"
        aria-hidden="true"
      >
        {'·'.repeat(72)}
      </span>
      <span className="max-w-[9rem] shrink-0 text-right font-dm text-xs text-white/35 sm:max-w-none">
        {detail}
      </span>
    </div>
  );
}
