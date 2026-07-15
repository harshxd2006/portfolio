const DEFAULT_TEXT =
  'ENGINEERING PHYSICS · FULL STACK AI · ROBOTICS · NIT HAMIRPUR · HACKATHON WINNER · OPEN TO WORK · ';

const REPEAT_COUNT = 4;
const contentCache = new Map();

function buildTrackContent(text, repeatCount) {
  const cacheKey = `${repeatCount}:${text}`;
  if (!contentCache.has(cacheKey)) {
    contentCache.set(cacheKey, Array.from({ length: repeatCount }, () => text).join(''));
  }
  return contentCache.get(cacheKey);
}

export default function Marquee({
  direction = 'left',
  text = DEFAULT_TEXT,
  className = '',
}) {
  const trackClass = direction === 'right' ? 'marquee-track marquee-track-right' : 'marquee-track';
  const content = buildTrackContent(text, REPEAT_COUNT);

  return (
    <div className={`marquee group ${className}`.trim()} aria-hidden="true">
      <div className={trackClass}>
        <span className="marquee-content">{content}</span>
        <span className="marquee-content" aria-hidden="true">
          {content}
        </span>
      </div>
    </div>
  );
}
