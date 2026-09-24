import Image from 'next/image';
import type { ReactNode } from 'react';

export const weddingArtwork = {
  flower: '/assets/wedding/hoa-moc/flower-decoration-fresh.webp',
  guestbook: '/assets/wedding/hoa-moc/papernote-background-green2.png',
};

export function ArchitectureSection({ children }: { children: ReactNode }) {
  return <div className="architecture-section">{children}</div>;
}

export function CeremonyFlowers() {
  return <div className="ceremony-flowers" aria-hidden="true">
    {(['right', 'left'] as const).map(side => <span key={side} className={`ceremony-lily ceremony-lily-${side}`}>
      <span className="ceremony-lily-sway"><span className="ceremony-lily-crop">
        <Image src={`/assets/wedding/hoa-cuoi/hoa_${side === 'left' ? 'trai' : 'phai'}_linh_lan.png`} alt="" width={side === 'left' ? 688 : 1024} height={side === 'left' ? 1199 : 1536} unoptimized />
      </span></span>
    </span>)}
  </div>;
}

export function ReceptionFlower() {
  return <span className="reception-lily" aria-hidden="true">
    <span className="reception-lily-sway"><span className="reception-lily-crop">
      <Image src="/assets/wedding/hoa-cuoi/linhlan5.png" alt="" width={1024} height={1536} unoptimized />
    </span></span>
  </span>;
}

export function TimelineFlowers() {
  return <div className="timeline-flowers" aria-hidden="true">
    {(['left', 'right'] as const).map(side => <span key={side} className={`timeline-lily timeline-lily-${side}`}>
      <span className="timeline-lily-sway"><span className="timeline-lily-crop">
        <Image src={`/assets/wedding/hoa-cuoi/${side === 'left' ? 'hoatrai03' : 'hoaphai03'}.png`} alt="" width={1254} height={1254} unoptimized />
      </span></span>
    </span>)}
  </div>;
}

export function CardFlower({ side = 'right', timeline = false }: { side?: 'left' | 'right'; timeline?: boolean }) {
  return <div className={`card-flower-anchor flower-${side}${timeline ? ' flower-timeline' : ''}`} aria-hidden="true">
    <Image src={weddingArtwork.flower} alt="" width={811} height={1939} unoptimized className="card-flower-art" />
  </div>;
}
