'use client';


import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CalendarCheck, Gift, Heart, Images, MapPin } from 'lucide-react';
import type { Invitation } from '@/lib/types';
import { createWeddingConfig } from '@/lib/wedding-config';
import { themeVariables } from '@/lib/wedding-theme';
import { useWeddingMusic } from '@/hooks/use-wedding-music';
import { EnvelopeIntro, type OpeningPhase } from './wedding/envelope-intro';
import { GalleryLightbox, WeddingGallery } from './wedding/gallery';
import { GiftModal, GiftSection } from './wedding/gift';
import { MusicController } from './wedding/music-controller';
import { FamilyCeremonySection, GuestbookSection, ReceptionSection, ThankYouSection, TimelineSection, VenueSection, WeddingHero } from './wedding/sections';

const AUTO_SCROLL_SPEED = 67;
const AUTO_SCROLL_START_DELAY = 1800;
const AUTO_SCROLL_RESUME_DELAY = 4500;

export function InvitationExperience({ invitation, connected }: { invitation: Invitation; connected: boolean }) {
  const config = useMemo(() => createWeddingConfig(invitation), [invitation]);
  const [phase, setPhase] = useState<OpeningPhase>('closed');
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const timers = useRef<number[]>([]);
  const heading = useRef<HTMLDivElement>(null);
  const autoScrollStarted = useRef(false);
  const music = useWeddingMusic(config.music);
  const contentVisible = phase === 'revealing' || phase === 'opened';

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);
  useEffect(() => {
    if (phase === 'opened') { window.scrollTo({ top: 0, behavior: 'instant' }); heading.current?.focus({ preventScroll: true }); }
  }, [phase]);
  useEffect(() => {
    if (phase !== 'opened' || autoScrollPaused || giftOpen || photoIndex !== null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animationFrame = 0;
    let lastFrame = 0;
    let autoScrollPosition = window.scrollY;
    let pausedUntil = performance.now() + (autoScrollStarted.current ? 0 : AUTO_SCROLL_START_DELAY);
    autoScrollStarted.current = true;
    const pauseForInteraction = () => { pausedUntil = performance.now() + AUTO_SCROLL_RESUME_DELAY; };
    const pauseForKeyboard = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' '].includes(event.key)) pauseForInteraction();
    };
    const scroll = (time: number) => {
      if (!lastFrame) lastFrame = time;
      const elapsed = Math.min(time - lastFrame, 50);
      lastFrame = time;
      if (time >= pausedUntil) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        autoScrollPosition = Math.min(maxScroll, Math.max(autoScrollPosition, window.scrollY) + AUTO_SCROLL_SPEED * elapsed / 1000);
        if (window.scrollY < maxScroll - 1) window.scrollTo({ top: autoScrollPosition, behavior: 'instant' });
      } else autoScrollPosition = window.scrollY;
      animationFrame = window.requestAnimationFrame(scroll);
    };

    window.addEventListener('wheel', pauseForInteraction, { passive: true });
    window.addEventListener('keydown', pauseForKeyboard);
    animationFrame = window.requestAnimationFrame(scroll);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('wheel', pauseForInteraction);
      window.removeEventListener('keydown', pauseForKeyboard);
    };
  }, [autoScrollPaused, giftOpen, phase, photoIndex]);
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
    autoScrollStarted.current = false;
    setAutoScrollPaused(false);
    void music.playRandom();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('opened'); return; }
    setPhase('opening');
    timers.current = [
      window.setTimeout(() => setPhase('flowerBurst'), 150),
      window.setTimeout(() => setPhase('revealing'), 700),
      window.setTimeout(() => setPhase('opened'), 1220),
    ];
  }

  function toggleAutoScroll(event: ReactPointerEvent<HTMLElement>) {
    if (phase !== 'opened' || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, textarea, select, label, [role="dialog"]')) return;
    setAutoScrollPaused((paused) => !paused);
  }

  return <main className="invitation-page botanical-theme" style={themeVariables(config.theme)} data-opening-phase={phase} data-auto-scroll={autoScrollPaused ? 'paused' : 'playing'} onPointerDown={toggleAutoScroll}>
    {phase !== 'opened' && <EnvelopeIntro config={config} phase={phase} open={openInvitation} />}
    {contentVisible && <div className={`invitation-content invitation-paper ${phase === 'revealing' ? 'is-revealing' : 'is-opened'}`}>
      <WeddingHero config={config} headingRef={heading} />
      <FamilyCeremonySection config={config} />
      {config.gallery.length > 0 && <WeddingGallery photos={config.gallery} story={config.content.story} open={setPhotoIndex} />}
      <ReceptionSection config={config} />
      {config.venue && <VenueSection config={config} />}
      {config.features.showTimeline && <TimelineSection config={config} />}
      {config.features.showGuestbook && <GuestbookSection config={config} connected={connected} />}
      {config.features.showBank && <GiftSection accounts={config.bankAccounts} inline={config.features.showQRInline} open={() => setGiftOpen(true)} />}
      {config.features.showThankYou && <ThankYouSection />}
    </div>}
    {phase === 'opened' && config.music.enabled && <MusicController music={music} title={config.music.title} />}
    {phase === 'opened' && <nav className="invitation-dock" aria-label="Điều hướng thiệp">
      <a href="#le-cuoi" aria-label="Thông tin lễ cưới" onClick={() => setAutoScrollPaused(true)}><Heart size={18} /></a>
      {config.gallery.length > 0 && <a href="#album" aria-label="Album ảnh" onClick={() => setAutoScrollPaused(true)}><Images size={18} /></a>}
      {config.reception && <a href="#thoi-gian" aria-label="Thời gian và xác nhận tham dự" onClick={() => setAutoScrollPaused(true)}><CalendarCheck size={18} /></a>}
      {config.venue && <a href="#dia-diem" aria-label="Địa điểm tổ chức" onClick={() => setAutoScrollPaused(true)}><MapPin size={18} /></a>}
      {config.features.showBank && !config.features.showQRInline && <button onClick={() => setGiftOpen(true)} aria-label="Mở hộp quà mừng"><Gift size={18} /></button>}
    </nav>}
    {photoIndex !== null && <GalleryLightbox photos={config.gallery} initial={photoIndex} close={() => setPhotoIndex(null)} />}
    {giftOpen && <GiftModal accounts={config.bankAccounts} close={() => setGiftOpen(false)} />}
  </main>;
}
