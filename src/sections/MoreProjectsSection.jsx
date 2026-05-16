import MoreProjectCard from '../components/MoreProjectCard';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import { Reveal, RevealItem } from '../components/Reveal';
import { MORE_PROJECTS } from '../constants/projectsData';

export default function MoreProjectsSection() {
  return (
    <SectionShell id="more-projects">
      <Reveal className="flex min-h-0 flex-1 flex-col">
        <RevealItem>
          <SectionHeading
            badge={4}
            label="Other Builds"
            headline="Also shipped."
            className="mb-10"
          />
        </RevealItem>

        <div className="grid min-h-0 flex-1 auto-rows-max gap-4 overflow-y-auto no-scrollbar pb-8 md:auto-rows-fr md:grid-cols-2 md:overflow-visible md:pb-0">
          {MORE_PROJECTS.map((project) => (
            <RevealItem key={project.name}>
              <MoreProjectCard {...project} />
            </RevealItem>
          ))}
        </div>
      </Reveal>
    </SectionShell>
  );
}
