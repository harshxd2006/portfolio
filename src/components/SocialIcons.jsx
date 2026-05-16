import { FaGithub, FaInstagram, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import { SOCIAL_LINKS } from '../constants/sections';

const ICONS = {
  github: FaGithub,
  linkedin: FaLinkedinIn,
  x: FaXTwitter,
  instagram: FaInstagram,
};

export default function SocialIcons() {
  return (
    <div className="flex items-center gap-4">
      {SOCIAL_LINKS.map(({ id, href, label }) => {
        const Icon = ICONS[id];
        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-white/40 transition-colors duration-200 hover:text-white"
          >
            <Icon className="text-[14px]" />
          </a>
        );
      })}
    </div>
  );
}
