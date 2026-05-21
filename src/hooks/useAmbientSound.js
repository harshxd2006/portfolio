import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

// Adjust this path to where your mp3 is stored in your project
// Example for Vite: import ambientUrl from '../assets/interstellar_chase_2.mp3';
const ambientUrl = '/interstellar_chase_2.mp3';

export function useAmbientSound(scrollRef, audioSrc = '/interstellar_chase_2.mp3') {
  const [playing, setPlaying] = useState(false);
  const chainRef = useRef(null);
  const audioRef = useRef(null);
  const armedRef = useRef(false);
  const triggeredRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const useFallbackAudioRef = useRef(false);

  const initChain = useCallback(async () => {
    if (chainRef.current) return chainRef.current;

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

    // Ensure the player's buffer is loaded before we attempt to start it.
    try {
      if (!player.buffer || !player.buffer.loaded) {
        // Tone.Player#load returns a Promise that resolves when buffer is ready.
        // Some browsers or network conditions may delay this, so await it.
        // eslint-disable-next-line no-await-in-loop
        await player.load(audioSrc);
      }
    } catch (e) {
      // If load fails, log and continue; play() will surface errors.
      // eslint-disable-next-line no-console
      console.warn('[useAmbientSound] player.load() failed', e);
    }

    filter.connect(reverb);
    reverb.toDestination();

    Tone.getDestination().volume.value = -Infinity;

    chainRef.current = { player, filter, reverb };
    return chainRef.current;
  }, [audioSrc]);

  // Pre-initialize Tone.js and load sound in background on mount
  useEffect(() => {
    let canceled = false;
    const preboot = async () => {
      try {
        if (!canceled) {
          await initChain();
        }
      } catch (e) {
        // ignore preboot errors
      }
    };
    preboot();
    return () => {
      canceled = true;
    };
  }, [initChain]);

  const play = useCallback(async () => {
    // If Tone.js previously threw an EncodingError or failed to initialize,
    // bypass it entirely and run direct, instant HTMLAudio playback to keep the user-gesture valid.
    if (useFallbackAudioRef.current) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioSrc);
          audioRef.current.loop = true;
          audioRef.current.preload = 'auto';
          audioRef.current.volume = 0.5;
          audioRef.current.setAttribute('data-ambient', 'true');
          audioRef.current.style.display = 'none';
          document.body.appendChild(audioRef.current);
          window.__ambientAudio = audioRef.current;
        }
        console.info('[useAmbientSound] direct HTMLAudio playback');
        await audioRef.current.play();
        setPlaying(true);
      } catch (err) {
        console.warn('[useAmbientSound] HTMLAudio playback failed', err);
      }
      return;
    }

    const chain = await initChain();
    try {
      // If an HTMLAudio fallback is present and playing, pause it before starting Tone player
      if (audioRef.current && !audioRef.current.paused) {
        try {
          audioRef.current.pause();
        } catch (e) {}
      }
      // If buffer not yet loaded, wait for it to load before starting.
      if (!chain.player.buffer || !chain.player.buffer.loaded) {
        await chain.player.load(audioSrc);
      }

      if (chain.player.state !== 'started') {
        chain.player.start();
      }

      Tone.getDestination().volume.rampTo(0, 3);
      setPlaying(true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[useAmbientSound] failed to play player:', e);
      useFallbackAudioRef.current = true; // Cache Tone.js failure
      // If decoding failed (EncodingError) or player failed, fall back to HTMLAudio
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioSrc);
          audioRef.current.loop = true;
          audioRef.current.preload = 'auto';
          audioRef.current.volume = 0.5;
          audioRef.current.setAttribute('data-ambient', 'true');
          audioRef.current.style.display = 'none';
          document.body.appendChild(audioRef.current);
          // expose for debugging
          // eslint-disable-next-line no-undef
          window.__ambientAudio = audioRef.current;
        }
        // try to play HTMLAudio
        // eslint-disable-next-line no-console
        console.info('[useAmbientSound] falling back to HTMLAudio');
        await audioRef.current.play();
        // Ensure Tone player is stopped if it had partially started
        try {
          if (chainRef.current?.player?.state === 'started') chainRef.current.player.stop();
        } catch (e2) {}
        setPlaying(true);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[useAmbientSound] HTMLAudio fallback failed', err);
      }
    }
  }, [initChain]);

  const pause = useCallback(() => {
    // Stop HTMLAudio fallback if present
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        // reset position to start so subsequent play begins from start
        audioRef.current.currentTime = 0;
      } catch (e) {}
    }

    if (chainRef.current) {
      const { player } = chainRef.current;
      try {
        if (player.state === 'started') {
          player.stop();
        }
      } catch (e) {
        // ignore
      }
    }

    try {
      Tone.getDestination().volume.rampTo(-Infinity, 2);
    } catch (e) {}
    setPlaying(false);
  }, []);

  // Dispose Tone objects on unmount to free buffers and audio nodes
  useEffect(() => {
    return () => {
      if (chainRef.current) {
        try {
          chainRef.current.player?.stop?.();
          chainRef.current.player?.dispose?.();
          chainRef.current.filter?.dispose?.();
          chainRef.current.reverb?.dispose?.();
        } catch (e) {
          // ignore
        }
        chainRef.current = null;
      }
      try {
        Tone.getDestination().volume.value = -Infinity;
      } catch (e) {}
    };
  }, []);

  // Pause playback when the document is hidden (tab switch / background)
  useEffect(() => {
    const onVisibility = () => {
      // Stop both Tone player and HTMLAudio fallback when document hidden
      try {
        if (document.hidden) {
          wasPlayingRef.current = false;
          if (audioRef.current && !audioRef.current.paused) {
            try { audioRef.current.pause(); } catch (e) {}
          }
          if (chainRef.current?.player?.state === 'started') {
            try { chainRef.current.player.stop(); } catch (e) {}
          }
          setPlaying(false);
          // eslint-disable-next-line no-console
          console.info('[useAmbientSound] document hidden — stopped playback');
        } else {
          // Do not auto-resume — require user gesture to restart for UX/privacy
          wasPlayingRef.current = false;
        }
      } catch (e) {
        // ignore
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
      armedRef.current = true;
      play();
    };

    const onWindowScroll = () => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;
      armedRef.current = true;
      play();
    };

    el.addEventListener('scroll', onFirstScroll, { passive: true });
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener('wheel', onFirstScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onFirstScroll);
      window.removeEventListener('scroll', onWindowScroll);
      window.removeEventListener('wheel', onFirstScroll);
    };
  }, [scrollRef, play]);

  return { playing, toggle, pause, play };
}