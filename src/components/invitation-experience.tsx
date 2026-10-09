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
import { SignatureSection } from './wedding/signature-section';
import { FamilyCeremonySection, GuestbookSection, ReceptionSection, ThankYouSection, TimelineSection, VenueSection, WeddingHero } from './wedding/sections';

// Messenger on iPhone discards the page while the maps app is open; remember where the guest was so a reload
// right after returning reopens the invitation at the same spot instead of the cover.
const MAP_RETURN_KEY = 'wedding-map-return';
const MAP_RETURN_TTL = 30 * 60 * 1000;
const AUTO_SCROLL_SPEED = 67;
const AUTO_SCROLL_START_DELAY = 1800;
const AUTO_SCROLL_RESUME_DELAY = 4500;
const AUTO_SCROLL_RETURN_DELAY = 3000;

export function InvitationExperience({ invitation, connected, guestName }: { invitation: Invitation; connected: boolean; guestName?: string }) {
  const config = useMemo(() => createWeddingConfig(invitation), [invitation]);
  const [phase, setPhase] = useState<OpeningPhase>('closed');
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [signing, setSigning] = useState(false);
  const timers = useRef<number[]>([]);
  const heading = useRef<HTMLDivElement>(null);
  const autoScrollStarted = useRef(false);
  const restoreScrollY = useRef<number | null>(null);
  const music = useWeddingMusic(config.music);
  const contentVisible = phase === 'revealing' || phase === 'opened';

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);
  useEffect(() => {
    let saved: { path?: string; y?: number; t?: number } | null = null;
    try { saved = JSON.parse(window.localStorage.getItem(MAP_RETURN_KEY) || 'null'); } catch { /* storage unavailable */ }
    if (!saved || saved.path !== window.location.pathname || typeof saved.y !== 'number' || Date.now() - (saved.t ?? 0) > MAP_RETURN_TTL) return;
    restoreScrollY.current = saved.y;
    autoScrollStarted.current = true;
    const timer = window.setTimeout(() => {
      try { window.localStorage.removeItem(MAP_RETURN_KEY); } catch { /* storage unavailable */ }
      setAutoScrollPaused(true);
      setPhase('opened');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (phase !== 'opened') return;
    const restoreY = restoreScrollY.current;
    restoreScrollY.current = null;
    heading.current?.focus({ preventScroll: true });
    if (restoreY === null) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    // Lazy images and reveal-on-scroll sections settle over a moment; re-apply the position once they have.
    const restore = () => window.scrollTo({ top: restoreY, behavior: 'instant' });
    restore();
    const timer = window.setTimeout(restore, 600);
    return () => window.clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'opened' || autoScrollPaused || giftOpen || signing || photoIndex !== null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animationFrame = 0;
    let lastFrame = 0;
    let autoScrollPosition = window.scrollY;
    let pausedUntil = performance.now() + (autoScrollStarted.current ? 0 : AUTO_SCROLL_START_DELAY);
    autoScrollStarted.current = true;
    const pauseForInteraction = () => { pausedUntil = performance.now() + AUTO_SCROLL_RESUME_DELAY; };
    const pauseForKeyboard = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' '].includes(event.key)) pauseForInteraction();
    };
    // Back from another app/tab: hold the current position, then continue after 3s unless the guest interacts.
    const pauseForReturn = () => { if (!document.hidden) pausedUntil = Math.max(pausedUntil, performance.now() + AUTO_SCROLL_RETURN_DELAY); };
    const scroll = (time: number) => {
      if (!lastFrame) lastFrame = time;
      const elapsed = Math.min(time - lastFrame, 50);
      lastFrame = time;
      // Any open dialog (RSVP, wishes…) holds the page still so typing is never interrupted.
      if (time >= pausedUntil && !document.querySelector('dialog[open]')) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        autoScrollPosition = Math.min(maxScroll, Math.max(autoScrollPosition, window.scrollY) + AUTO_SCROLL_SPEED * elapsed / 1000);
        if (window.scrollY < maxScroll - 1) window.scrollTo({ top: autoScrollPosition, behavior: 'instant' });
      } else autoScrollPosition = window.scrollY;
      animationFrame = window.requestAnimationFrame(scroll);
    };

    // A finger on the screen (drag or fling) holds auto-scroll so it never fights the guest's own scrolling.
    window.addEventListener('touchstart', pauseForInteraction, { passive: true });
    window.addEventListener('touchmove', pauseForInteraction, { passive: true });
    window.addEventListener('wheel', pauseForInteraction, { passive: true });
    window.addEventListener('keydown', pauseForKeyboard);
    document.addEventListener('visibilitychange', pauseForReturn);
    window.addEventListener('pageshow', pauseForReturn);
    animationFrame = window.requestAnimationFrame(scroll);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('visibilitychange', pauseForReturn);
      window.removeEventListener('pageshow', pauseForReturn);
      window.removeEventListener('touchstart', pauseForInteraction);
      window.removeEventListener('touchmove', pauseForInteraction);
      window.removeEventListener('wheel', pauseForInteraction);
      window.removeEventListener('keydown', pauseForKeyboard);
    };
  }, [autoScrollPaused, giftOpen, phase, photoIndex, signing]);
  const musicRef = useRef(music);
  useEffect(() => { musicRef.current = music; });
  useEffect(() => {
    // In-app browsers (Messenger/iOS WebView) can come back from another app (e.g. Google Maps) with a blank,
    // unpainted page while JS keeps running. Switching to another app/tab keeps the invitation alive in the
    // background: music keeps playing, only infinite animations (and auto-scroll, see above) pause. Music stops
    // only when the page is actually being closed (pagehide); when visible again the page's layers are rebuilt.
    const root = document.documentElement;
    let resumeMusic = false;
    let hidden = false;
    const onOpenMap = () => {
      setAutoScrollPaused(true);
      try { window.localStorage.setItem(MAP_RETURN_KEY, JSON.stringify({ path: window.location.pathname, y: Math.round(window.scrollY), t: Date.now() })); } catch { /* storage unavailable */ }
    };
    const leave = () => {
      if (hidden) return;
      hidden = true;
      root.classList.add('is-page-hidden');
    };
    const close = () => {
      leave();
      resumeMusic = resumeMusic || musicRef.current.playing;
      if (musicRef.current.playing) void musicRef.current.pause();
    };
    const restore = () => {
      if (document.hidden || !hidden) return;
      hidden = false;
      // Page survived the trip to the maps app: the saved position is no longer needed.
      try { window.localStorage.removeItem(MAP_RETURN_KEY); } catch { /* storage unavailable */ }
      root.classList.remove('is-page-hidden');
      const page = document.querySelector<HTMLElement>('.invitation-page');
      if (page) {
        const top = window.scrollY;
        page.style.display = 'none';
        void page.offsetHeight;
        page.style.display = '';
        window.scrollTo({ top, behavior: 'instant' });
      }
      if (resumeMusic) { resumeMusic = false; void musicRef.current.play(); }
    };
    const onVisibility = () => { if (document.hidden) leave(); else restore(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('wedding:open-map', onOpenMap);
    window.addEventListener('pagehide', close);
    window.addEventListener('pageshow', restore);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('wedding:open-map', onOpenMap);
      window.removeEventListener('pagehide', close);
      window.removeEventListener('pageshow', restore);
      root.classList.remove('is-page-hidden');
    };
  }, []);
  useEffect(() => {
    if (phase !== 'opened') return;
    const pauseForFormEntry = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches('input, textarea, select, [contenteditable="true"]')) setAutoScrollPaused(true);
    };
    window.addEventListener('focusin', pauseForFormEntry);
    return () => window.removeEventListener('focusin', pauseForFormEntry);
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

  // Only a tap toggles auto-scroll: toggling on pointerdown restarted it at the start of every swipe, so a guest
  // dragging back up to re-read something was pulled down again. A drag ends in pointercancel (the browser takes
  // over to scroll) or moves too far, and is ignored.
  const tapStart = useRef<{ id: number; x: number; y: number; time: number } | null>(null);
  function startTap(event: ReactPointerEvent<HTMLElement>) {
    tapStart.current = null;
    if (phase !== 'opened' || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, textarea, select, label, [role="button"], [role="dialog"]')) return;
    tapStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
  }
  function toggleAutoScroll(event: ReactPointerEvent<HTMLElement>) {
    const tap = tapStart.current;
    tapStart.current = null;
    if (!tap || tap.id !== event.pointerId || event.timeStamp - tap.time > 500) return;
    if (Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 10) return;
    setAutoScrollPaused((paused) => !paused);
  }

  return <main className="invitation-page botanical-theme" style={themeVariables(config.theme)} data-opening-phase={phase} data-auto-scroll={autoScrollPaused ? 'paused' : 'playing'} data-signing={signing || undefined} onPointerDown={startTap} onPointerUp={toggleAutoScroll} onPointerCancel={() => { tapStart.current = null; }}>
    {phase !== 'opened' && <EnvelopeIntro config={config} phase={phase} open={openInvitation} personalizedGuestName={guestName} />}
    {contentVisible && <div className={`invitation-content invitation-paper ${phase === 'revealing' ? 'is-revealing' : 'is-opened'}`}>
      <WeddingHero config={config} headingRef={heading} />
      <FamilyCeremonySection config={config} />
      {/* The album sits outside the paper02 backdrop: the architecture drawing behind the sliding photos made them hard to see. */}
      {config.gallery.length > 0 && <WeddingGallery photos={config.gallery} story={config.content.story} open={setPhotoIndex} />}
      <div className="paper02-flow">
        <ReceptionSection config={config} />
        {config.venue && <VenueSection config={config} />}
        {config.features.showTimeline && <TimelineSection config={config} />}
        {config.features.showGuestbook && <GuestbookSection config={config} connected={connected} />}
        {config.features.showSignatures && <SignatureSection config={config} connected={connected} onSigningChange={setSigning} />}
        {config.features.showBank && <GiftSection accounts={config.bankAccounts} inline={config.features.showQRInline} open={() => setGiftOpen(true)} closingMessage={config.features.showThankYou ? config.content.closingMessage : ''} showQr={config.features.showGiftQr} />}
        {config.features.showThankYou && !config.features.showBank && <ThankYouSection message={config.content.closingMessage} />}
      </div>
    </div>}
    {phase === 'opened' && config.music.enabled && <MusicController music={music} />}
    {/* While signing, only the music toggle stays on screen so the dock doesn't cover the signature sheet. */}
    {phase === 'opened' && !signing && <nav className="invitation-dock" aria-label="Điều hướng thiệp">
      <a href="#bia-thiep" aria-label="Về đầu thiệp" onClick={() => setAutoScrollPaused(true)}><Heart size={18} /></a>
      {config.gallery.length > 0 && <a href="#album" aria-label="Album ảnh" onClick={() => setAutoScrollPaused(true)}><Images size={18} /></a>}
      {config.reception && <a href="#thoi-gian" aria-label="Thời gian và xác nhận tham dự" onClick={() => setAutoScrollPaused(true)}><CalendarCheck size={18} /></a>}
      {config.venue && <a href="#dia-diem" aria-label="Địa điểm tổ chức" onClick={() => setAutoScrollPaused(true)}><MapPin size={18} /></a>}
      {config.features.showBank && !config.features.showQRInline && <button onClick={() => setGiftOpen(true)} aria-label="Mở hộp quà mừng"><Gift size={18} /></button>}
    </nav>}
    {photoIndex !== null && <GalleryLightbox photos={config.gallery} initial={photoIndex} close={() => setPhotoIndex(null)} />}
    {giftOpen && <GiftModal accounts={config.bankAccounts} close={() => setGiftOpen(false)} showQr={config.features.showGiftQr} />}
  </main>;
}
