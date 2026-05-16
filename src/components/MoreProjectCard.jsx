export default function MoreProjectCard({ index, label, name, stack, description, link }) {
  const content = (
    <article className="card-hover flex h-full flex-col border border-white/[0.12] bg-black/30 p-6 backdrop-blur-[2px]">
      <p className="mb-3 font-dm text-[10px] uppercase tracking-[0.28em] text-white/60">
        {index} — {label}
      </p>
      <h3 className="font-syne text-2xl font-extrabold text-white">{name}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {stack.map((tech) => (
          <span
            key={tech}
            className="pill-hover border border-white/15 px-2 py-0.5 font-dm text-[10px] text-white/80"
          >
            {tech}
          </span>
        ))}
      </div>
      <p className="mt-4 flex-1 font-dm text-sm font-light leading-relaxed text-white/80">
        {description}
      </p>
      {link && (
        <span className="mt-5 font-dm text-xs text-white/80 transition-colors group-hover:text-white">
          Visit project ↗
        </span>
      )}
    </article>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="group block h-full">
        {content}
      </a>
    );
  }

  return <div className="h-full">{content}</div>;
}
