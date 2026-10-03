'use client';

import { useEffect } from 'react';

// iOS Safari/WebViews ignore `overflow:hidden` on body, so scrolling inside a modal still drags the page behind it.
// Pin the body in place (position:fixed at the current offset) and restore the exact position on unlock.
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const body = document.body;
    const top = window.scrollY;
    const previous = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width };
    Object.assign(body.style, { overflow: 'hidden', position: 'fixed', top: `-${top}px`, left: '0', right: '0', width: '100%' });
    return () => {
      Object.assign(body.style, previous);
      window.scrollTo({ top, behavior: 'instant' });
    };
  }, [locked]);
}
