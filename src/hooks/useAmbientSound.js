import { useCallback, useEffect, useRef, useState } from 'react';

function createAudioElement(audioSrc) {
  const audio = new Audio(audioSrc);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.45;
  audio.setAttribute('data-ambient', 'true');
  return audio;
}

export function useAmbientSound(scrollRef, audioSrc = '/interstellar_chase_2.mp3') {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const triggeredRef = useRef(false);

  const play = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = createAudioElement(audioSrc);
    }
    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch (err) {
      console.warn('[useAmbientSound] playback failed', err);
    }
  }, [audioSrc]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // Ignore browser audio cleanup races.
      }
    }
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pause]);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, pause, play]);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return undefined;

    const onFirstScroll = () => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;
      play();
    };

    el.addEventListener('scroll', onFirstScroll, { passive: true });
    return () => el.removeEventListener('scroll', onFirstScroll);
  }, [scrollRef, play]);

  return { playing, toggle, pause, play };
}
