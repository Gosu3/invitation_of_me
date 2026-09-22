import Image from 'next/image';
import type { ReactNode } from 'react';

export const weddingArtwork = {
  flower: '/assets/wedding/hoa-moc/flower-decoration-fresh.webp',
  guestbook: '/assets/wedding/hoa-moc/papernote-background-green.webp',
};

export function ArchitectureSection({ children }: { children: ReactNode }) {
  return <div className="architecture-section">{children}</div>;
}

export function CardFlower({ side = 'right', timeline = false }: { side?: 'left' | 'right'; timeline?: boolean }) {
  return <div className={`card-flower-anchor flower-${side}${timeline ? ' flower-timeline' : ''}`} aria-hidden="true">
    <Image src={weddingArtwork.flower} alt="" width={811} height={1939} unoptimized className="card-flower-art" />
  </div>;
}
