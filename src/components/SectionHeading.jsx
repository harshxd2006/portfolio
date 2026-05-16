import AlternatingItalic from './AlternatingItalic';
import SectionBadge from './SectionBadge';
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
      {badge != null && <SectionBadge number={badge} title={badgeTitle} />}
      <p className="section-label mb-4">
        <AlternatingItalic text={labelText} />
      </p>
      <h2 className={`section-headline ${headlineClassName}`}>{headline}</h2>
    </header>
  );
}
