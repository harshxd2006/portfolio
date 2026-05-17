import AlternatingItalic from './AlternatingItalic';
import SectionBadge from './SectionBadge';
import { RevealHeadline, RevealLine } from './Reveal';
import { toSpacedLabel } from '../utils/spacedText';

export default function SectionHeading({
  badge,
  badgeTitle,
  label,
  spacedLabel = true,
  headline,
  className = '',
  headlineClassName = '',
}) {
  const labelText = spacedLabel ? toSpacedLabel(label) : label;

  return (
    <header className={className}>
      {badge != null && (
        <RevealLine>
          <SectionBadge number={badge} title={badgeTitle} />
        </RevealLine>
      )}
      <RevealLine delay={0.12}>
        <p className="section-label mb-4">
          <AlternatingItalic text={labelText} />
        </p>
      </RevealLine>
      <RevealHeadline className={`section-headline ${headlineClassName}`}>
        {headline}
      </RevealHeadline>
    </header>
  );
}
