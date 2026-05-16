import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import StackRow from '../components/StackRow';
import { Reveal, RevealItem } from '../components/Reveal';
import { STACK_COLUMNS } from '../constants/stackData';

export default function StackSection() {
  return (
    <SectionShell id="stack">
      <Reveal>
        <RevealItem>
          <SectionHeading
            badge={2}
            label="Technical Arsenal"
            headline="What I build with."
            className="mb-10"
          />
        </RevealItem>

        <RevealItem>
          <div className="grid border border-white/10 lg:grid-cols-3">
            {STACK_COLUMNS.map((column, colIndex) => (
              <div
                key={column.title}
                className={`border-white/10 px-5 py-4 md:px-6 ${
                  colIndex < STACK_COLUMNS.length - 1 ? 'lg:border-r' : ''
                } ${colIndex > 0 ? 'border-t lg:border-t-0' : ''}`}
              >
                <h3 className="mb-4 font-dm text-[10px] uppercase tracking-[0.25em] text-white/35">
                  {column.title}
                </h3>
                {column.rows.map((row) => (
                  <StackRow key={row.name} name={row.name} detail={row.detail} />
                ))}
              </div>
            ))}
          </div>
        </RevealItem>
      </Reveal>
    </SectionShell>
  );
}
