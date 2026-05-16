import TagPill from './TagPill';
import SpecRow from './SpecRow';

export default function FlagshipProjectCard({
  index,
  label,
  name,
  tags,
  architecture,
  achievements = [],
  github,
}) {
  return (
    <article className="card-hover flex h-full max-h-full min-h-0 flex-col overflow-hidden border border-white/[0.12] bg-black/30 p-4 backdrop-blur-[2px] md:p-5">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}
      </div>

      <p className="mb-1 font-dm text-[9px] uppercase tracking-[0.28em] text-white/60 md:text-[10px]">
        {index} — {label}
      </p>
      <h3 className="font-syne text-2xl font-extrabold leading-none tracking-[-1px] text-white md:text-[36px]">
        {name}
      </h3>

      <div className="mt-4 min-h-0 w-full flex-1 border-t border-white/10 pt-3">
        {architecture.map((row) => (
          <SpecRow key={row.label} label={row.label} detail={row.detail} />
        ))}
      </div>

      {achievements.length > 0 && (
        <div className="mt-3 shrink-0 space-y-1 border-t border-white/10 pt-3">
          {achievements.map((badge) => (
            <p key={badge} className="font-dm text-[10px] font-light leading-snug text-white/80 md:text-xs">
              {badge}
            </p>
          ))}
        </div>
      )}

      <a
        href={github}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-fit shrink-0 items-center gap-1 font-dm text-[11px] text-white/90 transition-colors hover:text-white"
      >
        View on GitHub ↗
      </a>
    </article>
  );
}
