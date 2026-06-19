import { useCallback, useEffect, useRef, useState } from "react";

export interface RateLimitCooldown {
  /** Seconds remaining, rounded up. 0 when not on cooldown. */
  remaining: number;
  isOnCooldown: boolean;
  startCooldown: () => void;
}

/**
 * Manages a countdown timer for rate-limit errors. When `startCooldown` is called the hook tracks
 * elapsed time and re-renders every 500ms until the duration expires.
 *
 * Uses `endTime` as state (not raw seconds) so the countdown stays accurate when the tab is
 * backgrounded and the interval fires late.
 */
export function useRateLimitCooldown(durationMs: number): RateLimitCooldown {
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setEndTime(Date.now() + durationMs);
    setRemaining(Math.ceil(durationMs / 1000));
  }, [durationMs]);

  useEffect(() => {
    if (endTime === null) return;
    const end = endTime;

    function tick() {
      const left = end - Date.now();
      if (left <= 0) {
        setRemaining(0);
        setEndTime(null);
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      setRemaining(Math.ceil(left / 1000));
    }

    intervalRef.current = setInterval(tick, 500);
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endTime]);

  return {
    remaining,
    isOnCooldown: endTime !== null,
    startCooldown,
  };
}
