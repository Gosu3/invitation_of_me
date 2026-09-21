'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import { bohoFloralGreen } from '@/lib/wedding-theme';

export function SectionTitle({ eyebrow, children, light = false }: { eyebrow: string; children: ReactNode; light?: boolean }) {
  return <><span className={`eyebrow${light ? ' light' : ''}`}>{eyebrow}</span><h2>{children}</h2></>;
}

export function FloralDecoration({ position = 'left', className = '' }: { position?: 'left' | 'right'; className?: string }) {
  return <Image className={`floral-decoration floral-${position} ${className}`} src={bohoFloralGreen.assets.flower} alt="" aria-hidden="true" width={420} height={420} />;
}

export function FloralDivider() {
  return <Image className="floral-divider" src={bohoFloralGreen.assets.decorationBar} alt="" aria-hidden="true" width={1320} height={168} />;
}

export function Modal({ children, close, label, className = '', onArrow }: { children: ReactNode; close: () => void; label: string; className?: string; onArrow?: (step: number) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useBodyScrollLock(true);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className={`wedding-dialog ${className}`} aria-label={label} onKeyDown={(event) => {
    if (onArrow && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); onArrow(event.key === 'ArrowLeft' ? -1 : 1); }
  }} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div className="dialog-surface">
      <button className="dialog-close" onClick={close} aria-label="Đóng" autoFocus><X size={21} /></button>
      {children}
    </div>
  </dialog>;
}
