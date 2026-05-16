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

        <div className="grid gap-4 md:grid-cols-2">
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
