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
  const [tunnelOpacity, setTunnelOpacity] = useState(0);
  const [chipOpacity, setChipOpacity] = useState(0);
  const [ready, setReady] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (loading) {
      setReady(false);
      setTunnelOpacity(0);
      setChipOpacity(0);
      return undefined;
    }

    cancelledRef.current = false;

    const run = async () => {
      setTunnelOpacity(1);
      setChipOpacity(0);
      setReady(true);

      while (!cancelledRef.current) {
        await sleep(TUNNEL_MS);
        if (cancelledRef.current) break;

        setTunnelOpacity(0);
        await sleep(FADE_MS + 80);
        if (cancelledRef.current) break;

        setChipOpacity(1);
        await sleep(CHIP_MS);
        if (cancelledRef.current) break;

        setChipOpacity(0);
        await sleep(FADE_MS + 80);
        if (cancelledRef.current) break;

        setTunnelOpacity(1);
      }
    };

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [loading]);

  return { tunnelOpacity, chipOpacity, ready, fadeMs: FADE_MS };
}
