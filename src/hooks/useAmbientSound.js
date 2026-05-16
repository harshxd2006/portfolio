import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

export function useAmbientSound(scrollRef) {
  const [playing, setPlaying] = useState(false);
  const chainRef = useRef(null);
  const armedRef = useRef(false);
  const triggeredRef = useRef(false);

  const initChain = useCallback(async () => {
    if (chainRef.current) return chainRef.current;

    await Tone.start();

    const reverb = new Tone.Reverb({ decay: 8, wet: 0.7 });
    await reverb.generate();

    const filter = new Tone.AutoFilter({
      frequency: 0.1,
      depth: 0.6,
    }).start();

    const synth1 = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 3, decay: 0, sustain: 1, release: 4 },
    }).connect(filter);

    const synth2 = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 0, sustain: 1, release: 5 },
    }).connect(filter);

    filter.connect(reverb);
    reverb.toDestination();

    Tone.getDestination().volume.value = -Infinity;

    chainRef.current = { synth1, synth2 };
    return chainRef.current;
  }, []);

  const play = useCallback(async () => {
    const chain = await initChain();
    chain.synth1.triggerAttack('C1');
    chain.synth2.triggerAttack('G1');
    Tone.getDestination().volume.rampTo(0, 3);
    setPlaying(true);
  }, [initChain]);

  const pause = useCallback(() => {
    if (!chainRef.current) return;
    const { synth1, synth2 } = chainRef.current;
    synth1.triggerRelease();
    synth2.triggerRelease();
    Tone.getDestination().volume.rampTo(-Infinity, 2);
    setPlaying(false);
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
