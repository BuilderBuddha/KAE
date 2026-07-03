import { useEffect, useState } from 'react';
import { briefingCharDelayMs } from '../utils/briefing-pacing';

/** Character reveal tuned for KayD briefing cadence. */
export function useBriefingStreamReveal(
  fullText: string,
  active: boolean,
): { revealed: string; done: boolean } {
  const [revealed, setRevealed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active || !fullText) {
      setRevealed('');
      setDone(false);
      return undefined;
    }

    setRevealed('');
    setDone(false);

    let index = 0;
    const timers: number[] = [];

    const tick = () => {
      index += 1;
      const next = fullText.slice(0, index);
      setRevealed(next);
      if (index >= fullText.length) {
        setDone(true);
        return;
      }
      const char = fullText[index - 1] ?? '';
      timers.push(window.setTimeout(tick, briefingCharDelayMs(char, index)));
    };

    timers.push(window.setTimeout(tick, briefingCharDelayMs(fullText[0] ?? '', 0)));

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [active, fullText]);

  return { revealed, done };
}
