import MoreProjectCard from '../components/MoreProjectCard';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import { Reveal, RevealItem } from '../components/Reveal';
import { MORE_PROJECTS } from '../constants/projectsData';

export default function MoreProjectsSection() {
  return (
    <SectionShell id="more-projects">
      <Reveal>
        <RevealItem>
          <SectionHeading
            badge={4}
            label="Other Builds"
            headline="Also shipped."
            className="mb-10"
          />
        </RevealItem>

        <div className="flex snap-x snap-mandatory overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 md:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MORE_PROJECTS.map((project) => (
            <RevealItem key={project.name} className="w-[85vw] shrink-0 snap-center md:w-auto md:shrink">
              <MoreProjectCard {...project} />
            </RevealItem>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  );
}
