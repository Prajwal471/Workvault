"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener?.("change", onChange);
  return () => mq.removeEventListener?.("change", onChange);
}

function getReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** True when the user prefers reduced motion (live matchMedia). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
}

/**
 * Animated count-up toward `target`, eased with cubic-out.
 * Jumps straight to the target when the user prefers reduced motion.
 * On mount it counts from 0; on target changes it counts from the value
 * currently on screen so refresh polling never resets the number.
 */
export function useCountUp(target: number, duration = 1100): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  const animatedRef = useRef(false);

  // Keep a render snapshot of the latest value so the next animation starts
  // from the on-screen number instead of 0.
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (reduced) return;

    const from = animatedRef.current ? valueRef.current : 0;
    animatedRef.current = true;
    const to = target;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return reduced ? target : value;
}
