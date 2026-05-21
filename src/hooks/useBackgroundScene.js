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

  useEffect(() => {
    if (loading) {
      setReady(false);
      setTunnelOpacity(0);
      setChipOpacity(0);
      return undefined;
    }

    let localCancelled = false;

    const run = async () => {
      setTunnelOpacity(1);
      setChipOpacity(0);
      setReady(true);

      while (!localCancelled) {
        await sleep(TUNNEL_MS);
        if (localCancelled) break;

        setTunnelOpacity(0);
        await sleep(FADE_MS + 80);
        if (localCancelled) break;

        setChipOpacity(1);
        await sleep(CHIP_MS);
        if (localCancelled) break;

        setChipOpacity(0);
        await sleep(FADE_MS + 80);
        if (localCancelled) break;

        setTunnelOpacity(1);
      }
    };

    run();

    return () => {
      localCancelled = true;
    };
  }, [loading]);

  return { tunnelOpacity, chipOpacity, ready, fadeMs: FADE_MS };
}
