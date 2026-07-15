import { useCallback, useEffect, useRef, useState } from 'react';

function createFallbackAudio(audioSrc) {
  const audio = new Audio(audioSrc);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.5;
  audio.setAttribute('data-ambient', 'true');
  audio.style.display = 'none';
  document.body.appendChild(audio);
  window.__ambientAudio = audio;
  return audio;
}

export function useAmbientSound(scrollRef, audioSrc = '/interstellar_chase_2.mp3') {
  const [playing, setPlaying] = useState(false);
  const chainRef = useRef(null);
  const audioRef = useRef(null);
  const triggeredRef = useRef(false);
  const useFallbackAudioRef = useRef(false);
  const toneRef = useRef(null);

  const initChain = useCallback(async () => {
    if (chainRef.current) return chainRef.current;

    const Tone = toneRef.current ?? (await import('tone'));
    toneRef.current = Tone;

    await Tone.start();

    const reverb = new Tone.Reverb({ decay: 8, wet: 0.7 });
    await reverb.generate();

    const filter = new Tone.AutoFilter({
      frequency: 0.1,
      depth: 0.6,
    }).start();

    const player = new Tone.Player({
      url: audioSrc,
      autostart: false,
      loop: true,
      volume: -8,
    }).connect(filter);

    try {
      if (!player.buffer || !player.buffer.loaded) {
        await player.load(audioSrc);
      }
    } catch (e) {
      console.warn('[useAmbientSound] player.load() failed', e);
    }

    filter.connect(reverb);
    reverb.toDestination();
    Tone.getDestination().volume.value = -Infinity;

    chainRef.current = { player, filter, reverb };
    return chainRef.current;
  }, [audioSrc]);

  const playFallback = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = createFallbackAudio(audioSrc);
    }
    await audioRef.current.play();
    setPlaying(true);
  }, [audioSrc]);

  const play = useCallback(async () => {
    if (useFallbackAudioRef.current) {
      try {
        await playFallback();
      } catch (err) {
        console.warn('[useAmbientSound] HTMLAudio playback failed', err);
      }
      return;
    }

    let chain;
    try {
      chain = await initChain();

      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }

      if (!chain.player.buffer || !chain.player.buffer.loaded) {
        await chain.player.load(audioSrc);
      }

      if (chain.player.state !== 'started') {
        chain.player.start();
      }

      toneRef.current?.getDestination().volume.rampTo(0, 3);
      setPlaying(true);
    } catch (e) {
      console.error('[useAmbientSound] failed to play player:', e);
      useFallbackAudioRef.current = true;

      try {
        if (chainRef.current?.player?.state === 'started') {
          chainRef.current.player.stop();
        }
        await playFallback();
      } catch (err) {
        console.warn('[useAmbientSound] HTMLAudio fallback failed', err);
      }
    }
  }, [audioSrc, initChain, playFallback]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {
        // Ignore cleanup errors from browser audio internals.
      }
    }

    if (chainRef.current) {
      const { player } = chainRef.current;
      try {
        if (player.state === 'started') {
          player.stop();
        }
      } catch (e) {
        // Ignore stale Tone node state during teardown.
      }
    }

    try {
      toneRef.current?.getDestination().volume.rampTo(-Infinity, 2);
    } catch (e) {
      // Tone may not have loaded yet.
    }
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (chainRef.current) {
        try {
          chainRef.current.player?.stop?.();
          chainRef.current.player?.dispose?.();
          chainRef.current.filter?.dispose?.();
          chainRef.current.reverb?.dispose?.();
        } catch (e) {
          // Ignore dispose races.
        }
        chainRef.current = null;
      }
      try {
        const destination = toneRef.current?.getDestination();
        if (destination) destination.volume.value = -Infinity;
      } catch (e) {
        // Tone may never have been imported.
      }
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      try {
        if (!document.hidden) return;
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        if (chainRef.current?.player?.state === 'started') {
          chainRef.current.player.stop();
        }
        setPlaying(false);
      } catch (e) {
        // Ignore background-tab audio races.
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

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
    window.addEventListener('scroll', onFirstScroll, { passive: true });
    window.addEventListener('wheel', onFirstScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onFirstScroll);
      window.removeEventListener('scroll', onFirstScroll);
      window.removeEventListener('wheel', onFirstScroll);
    };
  }, [scrollRef, play]);

  return { playing, toggle, pause, play };
}
