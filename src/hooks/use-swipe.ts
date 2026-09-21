'use client';

import { useRef, type TouchEventHandler } from 'react';

export function useSwipe(onLeft: () => void, onRight: () => void, threshold = 50) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart: TouchEventHandler = (event) => {
    start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };
  const onTouchEnd: TouchEventHandler = (event) => {
    if (!start.current) return;
    const dx = event.changedTouches[0].clientX - start.current.x;
    const dy = event.changedTouches[0].clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) onLeft(); else onRight();
  };
  return { onTouchStart, onTouchEnd };
}
