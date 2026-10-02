'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { WeddingInvitationConfig } from '@/lib/wedding-config';
import { formatDate } from '@/lib/utils';

export type OpeningPhase = 'closed' | 'opening' | 'flowerBurst' | 'revealing' | 'opened';

const leaves = [
  [5, 13, 22, -5, -22, '#C8DFA0'], [14, 18, 25, -17, 18, '#A5C862'], [23, 15, 20, -9, -12, '#8BC34A'],
  [31, 22, 26, -21, 25, '#6B8040'], [42, 16, 19, -2, -18, '#C8DFA0'], [51, 20, 24, -14, 20, '#8BC34A'],
  [59, 12, 18, -8, -16, '#A5C862'], [68, 23, 26, -23, 28, '#6B8040'], [76, 17, 22, -11, -20, '#C8DFA0'],
  [84, 14, 19, -6, 15, '#8BC34A'], [92, 21, 25, -19, -25, '#A5C862'], [97, 15, 23, -13, 12, '#C8DFA0'],
] as const;

const burst = Array.from({ length: 22 }, (_, index) => {
  const angle = (index / 22) * Math.PI * 2;
  const distance = 145 + (index % 6) * 48;
  const x = Math.round(Math.cos(angle) * distance * 100) / 100;
  const y = Math.round(Math.sin(angle) * distance * 100) / 100;
  const scale = Math.round((.55 + (index % 4) * .18) * 100) / 100;
  return { x, y, xHalf: Math.round(x * 52) / 100, yHalf: Math.round(y * 52) / 100, rotate: -180 + index * 25, delay: (index % 5) * 24, scale, endScale: Math.round(scale * 50) / 100 };
});

export function EnvelopeIntro({ config, phase, open, personalizedGuestName }: { config: WeddingInvitationConfig; phase: OpeningPhase; open: () => void; personalizedGuestName?: string }) {
  const { theme, couple, weddingDate } = config;
  const guestName = personalizedGuestName;
  const guestNameRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const name = guestNameRef.current;
    const container = name?.parentElement;
    if (!name || !container) return;
    let disposed = false;
    let previousWidth = 0;
    const fitName = () => {
      if (disposed) return;
      name.style.removeProperty('font-size');
      container.style.removeProperty('--guest-name-scale');
      const availableWidth = name.clientWidth - 8;
      if (availableWidth <= 0) return;
      const preferredSize = parseFloat(getComputedStyle(name).fontSize);
      const range = document.createRange();
      range.selectNodeContents(name);
      const textWidth = range.getBoundingClientRect().width * name.clientWidth / name.getBoundingClientRect().width;
      const isLong = textWidth > availableWidth;
      if (isLong) {
        const fittedSize = Math.floor(preferredSize * availableWidth / textWidth * 10) / 10;
        name.style.fontSize = `${fittedSize}px`;
        container.style.setProperty('--guest-name-scale', String(fittedSize / preferredSize));
      }
    };
    fitName();
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth;
      if (width !== previousWidth) {
        previousWidth = width;
        fitName();
      }
    });
    observer.observe(container);
    void document.fonts.ready.then(fitName);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [guestName]);

  return <section className={`cover-gate opening-${phase}`} aria-label="Mở thiệp cưới">
    <div className="cover-ambient-flowers" aria-hidden="true">
      <Image className="cover-ambient-flower cover-ambient-flower-top" src="/assets/wedding/cover/hoatrai05.webp" alt="" width={900} height={900} preload />
      <Image className="cover-ambient-flower cover-ambient-flower-bottom" src="/assets/wedding/cover/hoaphai05.webp" alt="" width={900} height={900} preload />
    </div>
    <div className="ambient-leaves" aria-hidden="true">{leaves.map(([left, size, duration, delay, sway, color], index) => <span key={index} style={{ left: `${left}%`, width: size, height: size, color, animationDuration: `${duration}s`, animationDelay: `${delay}s`, '--sway': `${sway}px` } as CSSProperties}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c2-8 7-15 18-18-1 11-8 17-18 18Zm2-3c5-2 9-6 12-11-5 3-9 6-12 11Z" /></svg></span>)}</div>
    <div className="flower-burst" aria-hidden="true">{burst.map((particle, index) => <span key={index} className={index % 3 === 0 ? 'burst-leaf' : 'burst-flower'} style={{ '--burst-x': `${particle.x}px`, '--burst-y': `${particle.y}px`, '--burst-x-half': `${particle.xHalf}px`, '--burst-y-half': `${particle.yHalf}px`, '--burst-r': `${particle.rotate}deg`, '--burst-delay': `${particle.delay}ms`, '--burst-scale': String(particle.scale), '--burst-end-scale': String(particle.endScale) } as CSSProperties}>{index % 3 === 0 ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c2-8 7-15 18-18-1 11-8 17-18 18Z" /></svg> : <Image src={theme.assets.flower} alt="" width={90} height={90} />}</span>)}</div>
    <article className="cover-card">
      <Image className="cover-flower cover-flower-left" src="/assets/wedding/cover/hoatrai05.webp" alt="" aria-hidden="true" width={900} height={900} preload />
      <Image className="cover-flower cover-flower-right" src="/assets/wedding/cover/hoaphai05.webp" alt="" aria-hidden="true" width={900} height={900} preload />
      <span className="cover-heart" aria-hidden="true"><Heart size={25} fill="currentColor" /></span>
      <div className="cover-card-content">
        <span className="cover-eyebrow">THE WEDDING OF</span>
        <div className="cover-divider cover-divider-top" aria-hidden="true"><i />❧<i /></div>
        <h1>{couple.groom}<em>&</em>{couple.bride}</h1>
        <div className="cover-divider cover-divider-date" aria-hidden="true"><i />♥<i /></div>
        <p className="cover-wedding-date">{weddingDate ? `Ngày ${formatDate(weddingDate)}` : 'Một ngày thật đẹp'}</p>
        <div className={`cover-invite${guestName ? ' cover-invite-personalized' : ''}`}>
          <span>Thân Mời</span>
          {guestName && <strong ref={guestNameRef}>{guestName}</strong>}
        </div>
        <button className="cover-open-button" onClick={open} disabled={phase !== 'closed'} aria-busy={phase !== 'closed'}>{phase === 'closed' ? 'Mở thiệp' : 'Đang mở…'}</button>
      </div>
    </article>
  </section>;
}
