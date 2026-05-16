import { useState } from 'react';
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';
import { useAmbientSound } from '../hooks/useAmbientSound';

export default function AmbientPlayer({ scrollRef }) {
  const { playing, toggle } = useAmbientSound(scrollRef);
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="fixed bottom-12 right-8 z-[200]">
      {showTip && (
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap font-dm text-[10px] text-white/50">
          Ambient sound
        </span>
      )}
      <button
        type="button"
        aria-label={playing ? 'Pause ambient sound' : 'Play ambient sound'}
        onClick={toggle}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-[10px] transition-colors hover:border-white/40"
      >
        {playing ? (
          <>
            <span className="ambient-dot-pulse absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <HiSpeakerWave className="text-lg text-white/80" />
          </>
        ) : (
          <HiSpeakerXMark className="text-lg text-white/60" />
        )}
      </button>
    </div>
  );
}
