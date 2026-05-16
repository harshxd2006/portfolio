import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import FlagshipProjectCard from '../components/FlagshipProjectCard';
import { Reveal, RevealItem } from '../components/Reveal';
import { FLAGSHIP_PROJECTS } from '../constants/projectsData';

export default function ProjectsSection() {
  return (
    <SectionShell id="projects" className="!items-stretch">
      <div className="flex min-h-0 flex-1 flex-col">
        <Reveal className="shrink-0">
          <RevealItem>
            <SectionHeading
              badge={3}
              label="Flagship Systems"
              headline="Things I've shipped."
              className="mb-5 md:mb-6"
            />
          </RevealItem>
        </Reveal>

        <Reveal className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {FLAGSHIP_PROJECTS.map((project) => (
            <RevealItem key={project.name} className="min-h-0">
              <FlagshipProjectCard {...project} />
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </SectionShell>
  );
}
