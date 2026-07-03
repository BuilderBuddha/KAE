import { useEffect, useState } from 'react';

/** Character-by-character reveal ported from VIGS Founder Beta `useStreamReveal`. */
export function useStreamReveal(
  fullText: string,
  active: boolean,
  options: { charDelayMs?: number } = {},
): { revealed: string; done: boolean } {
  const { charDelayMs = 26 } = options;
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
      setRevealed(fullText.slice(0, index));
      if (index >= fullText.length) {
        setDone(true);
        return;
      }
      const jitter = Math.floor(Math.random() * 14);
      timers.push(window.setTimeout(tick, charDelayMs + jitter));
    };

    timers.push(window.setTimeout(tick, charDelayMs));

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [active, fullText, charDelayMs]);

  return { revealed, done };
}
