import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import TimelineEntry from '../components/TimelineEntry';
import { Reveal, RevealItem } from '../components/Reveal';
import { TIMELINE_ENTRIES } from '../constants/projectsData';

export default function ExperienceSection() {
  return (
    <SectionShell id="experience">
      <Reveal>
        <RevealItem>
          <SectionHeading
            badge={5}
            label="Battle Record"
            headline="Where I've shown up."
            className="mb-10"
          />
        </RevealItem>

        <RevealItem>
          <ul className="relative space-y-10 border-l border-white/10 pl-0 max-h-[65vh] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-h-none md:overflow-visible">
            {TIMELINE_ENTRIES.map((entry) => (
              <TimelineEntry
                key={`${entry.year}-${entry.title}`}
                year={entry.year}
                title={entry.title}
                description={entry.description}
              />
            ))}
          </ul>
        </RevealItem>
      </Reveal>
    </SectionShell>
  );
}
