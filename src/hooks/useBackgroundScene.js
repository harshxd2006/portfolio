import { useEffect, useRef, useState } from 'react';

export const FADE_MS = 1200;
const TUNNEL_MS = 12000;
const CHIP_MS = 18000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Alternates tunnel ↔ chip: fade out → swap (one WebGL at a time) → fade in.
 * Keeps UI smooth — never two heavy scenes at once.
 */
export function useBackgroundScene(loading) {
  const [scene, setScene] = useState('tunnel');
  const [opacity, setOpacity] = useState(0);
  const [ready, setReady] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (loading) {
      setReady(false);
      setOpacity(0);
      return undefined;
    }

    cancelledRef.current = false;

    const fadeOut = async () => {
      setOpacity(0);
      await sleep(FADE_MS);
    };

    const fadeIn = async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      setOpacity(1);
      await sleep(FADE_MS);
    };

    const run = async () => {
      setScene('tunnel');
      setOpacity(1);
      setReady(true);

      while (!cancelledRef.current) {
        await sleep(TUNNEL_MS);
        if (cancelledRef.current) break;

        await fadeOut();
        if (cancelledRef.current) break;

        setScene('chip');
        await sleep(80);
        await fadeIn();
        if (cancelledRef.current) break;

        await sleep(CHIP_MS);
        if (cancelledRef.current) break;

        await fadeOut();
        if (cancelledRef.current) break;

        setScene('tunnel');
        await sleep(80);
        await fadeIn();
        if (cancelledRef.current) break;
      }
    };

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [loading]);

  return { scene, opacity, ready, fadeMs: FADE_MS };
}
