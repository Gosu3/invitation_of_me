'use client';


import { useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Images } from 'lucide-react';
import type { Invitation } from '@/lib/types';
import { createWeddingConfig } from '@/lib/wedding-config';
import { themeVariables } from '@/lib/wedding-theme';
import { useWeddingMusic } from '@/hooks/use-wedding-music';
import { EnvelopeIntro, type OpeningPhase } from './wedding/envelope-intro';
import { GalleryLightbox, WeddingGallery } from './wedding/gallery';
import { GiftModal, GiftSection } from './wedding/gift';
import { MusicController } from './wedding/music-controller';
import { FamilyCeremonySection, GuestbookSection, ReceptionSection, ThankYouSection, TimelineSection, VenueSection, WeddingHero } from './wedding/sections';

export function InvitationExperience({ invitation }: { invitation: Invitation; connected: boolean }) {
  const config = useMemo(() => createWeddingConfig(invitation), [invitation]);
  const [phase, setPhase] = useState<OpeningPhase>('closed');
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const heading = useRef<HTMLDivElement>(null);
  const music = useWeddingMusic(config.music);
  const contentVisible = phase === 'revealing' || phase === 'opened';

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);
  useEffect(() => {
    if (phase === 'opened') { window.scrollTo({ top: 0, behavior: 'instant' }); heading.current?.focus({ preventScroll: true }); }
  }, [phase]);
  useEffect(() => {
    if (!contentVisible || !('IntersectionObserver' in window)) return;
    const content = document.querySelector('.invitation-content');
    const sections = content?.querySelectorAll('.invite-section, .event-card, .paper-card');
    if (!content || !sections) return;
    content.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: '0px 0px 60px 0px' });
    sections.forEach((section) => { section.classList.add('reveal-on-scroll'); observer.observe(section); });
    return () => observer.disconnect();
  }, [contentVisible]);

  function openInvitation() {
    if (phase !== 'closed') return;
    void music.play();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('opened'); return; }
    setPhase('opening');
    timers.current = [
      window.setTimeout(() => setPhase('flowerBurst'), 150),
      window.setTimeout(() => setPhase('revealing'), 700),
      window.setTimeout(() => setPhase('opened'), 1220),
    ];
  }

  return <main className="invitation-page botanical-theme" style={themeVariables(config.theme)} data-opening-phase={phase}>
    {phase !== 'opened' && <EnvelopeIntro config={config} phase={phase} open={openInvitation} />}
    {contentVisible && <div className={`invitation-content invitation-paper ${phase === 'revealing' ? 'is-revealing' : 'is-opened'}`}>
      <WeddingHero config={config} headingRef={heading} />
      <FamilyCeremonySection config={config} />
      {config.gallery.length > 0 && <WeddingGallery photos={config.gallery} story={config.content.story} open={setPhotoIndex} />}
      <ReceptionSection config={config} />
      {config.venue && <VenueSection config={config} />}
      {config.features.showTimeline && <TimelineSection config={config} />}
      {config.features.showGuestbook && <GuestbookSection />}
      {config.features.showBank && <GiftSection accounts={config.bankAccounts} inline={config.features.showQRInline} open={() => setGiftOpen(true)} />}
      {config.features.showThankYou && <ThankYouSection />}
    </div>}
    {phase === 'opened' && config.music.enabled && <MusicController music={music} title={config.music.title} />}
    {phase === 'opened' && (config.gallery.length > 0 || (config.features.showBank && !config.features.showQRInline)) && <nav className="invitation-dock" aria-label="Điều hướng thiệp">{config.gallery.length > 0 && <a href="#album" aria-label="Album ảnh"><Images size={18} /></a>}{config.features.showBank && !config.features.showQRInline && <button onClick={() => setGiftOpen(true)} aria-label="Mở hộp quà mừng"><Gift size={18} /></button>}</nav>}
    {photoIndex !== null && <GalleryLightbox photos={config.gallery} initial={photoIndex} close={() => setPhotoIndex(null)} />}
    {giftOpen && <GiftModal accounts={config.bankAccounts} close={() => setGiftOpen(false)} />}
  </main>;
}
