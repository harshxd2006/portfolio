import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import FlagshipProjectCard from '../components/FlagshipProjectCard';
import { Reveal, RevealItem } from '../components/Reveal';
import { FLAGSHIP_PROJECTS } from '../constants/projectsData';

export default function ProjectsSection() {
  return (
    <SectionShell id="projects" className="!items-stretch">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/55 via-black/40 to-black/55"
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar">
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

        <Reveal className="grid gap-4 pb-6 lg:grid-cols-2 lg:gap-5 lg:pb-0">
          {FLAGSHIP_PROJECTS.map((project) => (
            <RevealItem key={project.name}>
              <FlagshipProjectCard {...project} />
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </SectionShell>
  );
}
