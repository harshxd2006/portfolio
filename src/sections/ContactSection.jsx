import { FaGithub, FaLinkedinIn } from 'react-icons/fa6';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import { Reveal, RevealItem } from '../components/Reveal';

const CONTACT_LINKS = [
  {
    href: 'mailto:harsh25006@gmail.com',
    label: '✉ harsh25006@gmail.com',
  },
  {
    href: 'tel:+918077490190',
    label: '📱 +91 8077490190',
  },
];

const SOCIAL = [
  { href: 'https://github.com/harshxd2006', icon: FaGithub, label: 'GitHub' },
  {
    href: 'https://www.linkedin.com/in/harsh--25abc25',
    icon: FaLinkedinIn,
    label: 'LinkedIn',
  },
];

export default function ContactSection() {
  return (
    <SectionShell id="contact">
      <Reveal className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <RevealItem className="w-full">
          <SectionHeading
            badge={6}
            label="Get In Touch"
            headline="Let's build something."
            className="mb-6"
          />
        </RevealItem>

        <RevealItem>
          <p className="font-dm text-sm font-light text-white/45">
            Open to collabs, internships &amp; hackathon teams.
          </p>
        </RevealItem>

        <RevealItem className="mt-10 flex w-full flex-col items-center gap-4">
          {CONTACT_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="contact-btn w-full max-w-[420px] border border-white/20 px-7 py-[18px] font-dm text-sm text-white transition-all hover:border-white hover:bg-white/[0.04]"
            >
              {item.label}
            </a>
          ))}
        </RevealItem>

        <RevealItem className="mt-10 flex items-center justify-center gap-6">
          {SOCIAL.map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-white/50 transition-colors hover:text-white"
            >
              <Icon className="text-[20px]" />
            </a>
          ))}
        </RevealItem>

        <p className="mt-16 font-dm text-[10px] text-white/25 sm:hidden">
          2026 © Copyright Harsh. All Rights Reserved.
        </p>
      </Reveal>
    </SectionShell>
  );
}
