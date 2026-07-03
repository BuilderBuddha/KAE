import { useEffect, useState } from 'react';
import type { ExecutiveContinuity } from '@scooper/core';

export function useExecutiveContinuity(): ExecutiveContinuity | null {
  const [continuity, setContinuity] = useState<ExecutiveContinuity | null>(null);

  useEffect(() => {
    let cancelled = false;
    void window.kae.getExecutiveContinuity().then((next) => {
      if (!cancelled) setContinuity(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return continuity;
}
