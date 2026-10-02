'use client';

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';

export function SectionTitle({ eyebrow, children, light = false }: { eyebrow: string; children: ReactNode; light?: boolean }) {
  return <><span className={`eyebrow${light ? ' light' : ''}`}>{eyebrow}</span><h2>{children}</h2></>;
}

// Touch drag up or down on the surface closes the modal once pulled past the threshold. A drag down only starts when the
// surface is scrolled to the top, a drag up only when it is scrolled to the bottom, so scrolling the content still works.
function useSwipeToClose(surface: RefObject<HTMLDivElement | null>, close: () => void, enabled: boolean) {
  useEffect(() => {
    const element = surface.current;
    if (!enabled || !element) return;
    let startX = 0, startY = 0, startTime = 0, offset = 0, direction = 0, atTop = false, atBottom = false, tracking = false, dragging = false;
    // Moving the surface would re-anchor its position:fixed children (lightbox counter/close); surfaces that have
    // such children mark the parts that should follow the finger with data-swipe-move instead.
    const targets = () => { const movers = element.querySelectorAll<HTMLElement>('[data-swipe-move]'); return movers.length ? [...movers] : [element]; };
    const style = (values: Partial<CSSStyleDeclaration>) => targets().forEach((target) => Object.assign(target.style, values));
    const reset = (animate: boolean) => style({ transition: animate ? 'transform .25s ease' : '', transform: '' });
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 1) { tracking = false; return; }
      atTop = element.scrollTop <= 0;
      atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
      tracking = atTop || atBottom;
      dragging = false; offset = 0;
      startX = event.touches[0].clientX; startY = event.touches[0].clientY; startTime = event.timeStamp;
    };
    const move = (event: TouchEvent) => {
      if (!tracking) return;
      const delta = event.touches[0].clientY - startY;
      if (!dragging) {
        // Horizontal gestures (e.g. lightbox photo swipe) and scrolls toward unscrolled content are left alone.
        if (Math.abs(event.touches[0].clientX - startX) > Math.abs(delta)) { tracking = false; return; }
        if (Math.abs(delta) < 8) return;
        direction = delta > 0 ? 1 : -1;
        if ((direction > 0 && !atTop) || (direction < 0 && !atBottom)) { tracking = false; return; }
        dragging = true;
        style({ animation: 'none', transition: 'none' });
      }
      event.preventDefault();
      offset = Math.max(0, delta * direction - 8);
      style({ transform: `translateY(${offset * direction}px)` });
    };
    const end = (event: TouchEvent) => {
      if (!dragging) { tracking = false; return; }
      tracking = dragging = false;
      const velocity = offset / Math.max(1, event.timeStamp - startTime);
      if (offset > 110 || (offset > 40 && velocity > 0.6)) {
        style({ transition: 'transform .2s ease-in, opacity .2s ease-in', transform: `translateY(${window.innerHeight * direction}px)`, opacity: '0' });
        window.setTimeout(close, 180);
      } else reset(true);
    };
    element.addEventListener('touchstart', start, { passive: true });
    element.addEventListener('touchmove', move, { passive: false });
    element.addEventListener('touchend', end);
    element.addEventListener('touchcancel', end);
    return () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchmove', move);
      element.removeEventListener('touchend', end);
      element.removeEventListener('touchcancel', end);
    };
  }, [surface, close, enabled]);
}

export function Modal({ children, close, label, className = '', onArrow, swipeToClose = false }: { children: ReactNode; close: () => void; label: string; className?: string; onArrow?: (step: number) => void; swipeToClose?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  useBodyScrollLock(true);
  useSwipeToClose(surface, close, swipeToClose);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className={`wedding-dialog ${className}`} aria-label={label} onKeyDown={(event) => {
    if (onArrow && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); onArrow(event.key === 'ArrowLeft' ? -1 : 1); }
  }} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div className="dialog-surface" ref={surface}>
      <button className="dialog-close" onClick={close} aria-label="Đóng" autoFocus><X size={21} /></button>
      {children}
    </div>
  </dialog>;
}
