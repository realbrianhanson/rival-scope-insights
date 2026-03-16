import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 600, decimals = 0) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current && value !== 0) return;
    prevTarget.current = target;

    const start = 0;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = start + (target - start) * easedProgress;

      setValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration, decimals]);

  return value;
}
