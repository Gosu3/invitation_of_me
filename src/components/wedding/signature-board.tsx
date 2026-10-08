'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ArrowRight, ChevronDown, ChevronLeft, Hand, Link2, PenLine, RotateCcw, Trash2, Type, Undo2, X } from 'lucide-react';
import {
  SIGNATURE_LIMITS, SIGNATURE_MAX_ROTATE as MAX_ROTATE, SIGNATURE_SCALE, SIGNATURE_VIEW_H as VIEW_H, SIGNATURE_VIEW_W as VIEW_W,
  centreStrokes, signatureCoversZone, zonesOverlap, signatureFontFamily as fontFamily, signatureFontIds, signatureFonts, signatureFootprint as footprint, signatureInks, signaturePath as pathFromPoints, textSignature,
  type PublicSignature, type SignatureFont, type SignatureInk as Ink, type SignatureMark as Mark, type SignaturePlacement, type SignatureZone as Zone,
} from '@/lib/signature-mark';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import '@fontsource/dancing-script/400.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/pacifico/400.css';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/charmonman/400.css';
import styles from './signature-board.module.css';

// Board photo must be portrait 2:3 — it is rendered with that ratio to line up with the 1000x1500 viewBox.

export type SignatureDraft = SignaturePlacement & { guestName: string; mark: Mark; ink: Ink };

export type SignatureBoardProps = {
  photo: string;
  photoAlt: string;
  avoidZones: Zone[];
  signatures: PublicSignature[];
  /** The wish this browser sent in the guestbook above, if any; the new signature links to it. */
  myWish: { guestName: string } | null;
  /** Name the guest already gave elsewhere (e.g. RSVP), used to prefill the signer's name. */
  knownName?: string;
  onSign: (draft: SignatureDraft) => Promise<PublicSignature>;
  onGoToWishes?: () => void;
  /** Lets the host pause page auto-scroll while the guest is signing. */
  onComposerChange?: (open: boolean) => void;
};

export const inks: Record<Ink, { label: string; stroke: string; halo: string }> = {
  moss: { label: 'Xanh rêu', stroke: '#30530f', halo: '#fffaf7' },
  ivory: { label: 'Trắng ngà', stroke: '#fffaf7', halo: 'rgba(48,83,15,.55)' },
  gold: { label: 'Nhũ vàng', stroke: '#a87a2a', halo: '#fffaf7' },
  black: { label: 'Đen', stroke: '#1d1d1b', halo: '#fffaf7' },
};

const overlaps = zonesOverlap;

function suggestSpot(mark: Mark, scale: number, avoid: Zone[], placed: PublicSignature[]) {
  let best = { x: 0.5, y: 0.1, score: -Infinity };
  for (let gy = 0.05; gy <= 0.95; gy += 0.03) {
    for (let gx = 0.1; gx <= 0.9; gx += 0.03) {
      const box = footprint({ mark, x: gx, y: gy, scale });
      if (box.x < 0.02 || box.y < 0.02 || box.x + box.w > 0.98 || box.y + box.h > 0.98) continue;
      if (avoid.some((zone) => overlaps(box, zone))) continue;
      if (placed.some((sig) => overlaps(box, footprint(sig), 0.025))) continue;
      const nearest = placed.reduce((min, sig) => Math.min(min, Math.hypot(sig.x - gx, (sig.y - gy) * 1.5)), 1);
      // Đủ xa chữ ký khác là được, sau đó ưu tiên dải nền phía trên ảnh.
      const score = Math.min(nearest, 0.25) - gy * 0.3;
      if (score > best.score) best = { x: gx, y: gy, score };
    }
  }
  return { x: best.x, y: best.y };
}

export function MarkPaths({ mark, ink, animate, delay = 0, highlight }: { mark: Mark; ink: Ink; animate: boolean; delay?: number; highlight?: boolean }) {
  const color = inks[ink];
  const cls = animate ? styles.writeOn : undefined;
  if (mark.kind === 'text') {
    return <g className={highlight ? styles.justSigned : undefined}>
      <text className={cls} style={{ animationDelay: `${delay}s` } as CSSProperties} textAnchor="middle" dominantBaseline="central" fontFamily={fontFamily(mark.font)} fontSize={110} fill="none" stroke={color.halo} strokeWidth={7} strokeOpacity={0.9} strokeLinejoin="round">{mark.text}</text>
      <text className={animate ? styles.typedInk : undefined} style={{ animationDelay: `${delay}s` } as CSSProperties} textAnchor="middle" dominantBaseline="central" fontFamily={fontFamily(mark.font)} fontSize={110} fill={color.stroke} stroke={color.stroke} strokeWidth={1.6}>{mark.text}</text>
    </g>;
  }
  const total = mark.strokes.length;
  return <g className={highlight ? styles.justSigned : undefined} fill="none" strokeLinecap="round" strokeLinejoin="round">
    {mark.strokes.map((stroke, index) => {
      const d = pathFromPoints(stroke);
      const style = { animationDelay: `${delay + (index / Math.max(total, 1)) * 1.1}s` } as CSSProperties;
      return <g key={index}>
        <path className={cls} style={style} d={d} pathLength={1} stroke={color.halo} strokeWidth={15} />
        <path className={cls} style={style} d={d} pathLength={1} stroke={color.stroke} strokeWidth={7} />
      </g>;
    })}
  </g>;
}

/** Static thumbnail of one signature, e.g. for the admin moderation list. */
export function SignatureMarkPreview({ mark, ink, className }: { mark: Mark; ink: Ink; className?: string }) {
  const pad = 24;
  return <svg className={className} viewBox={`${-mark.w / 2 - pad} ${-mark.h / 2 - pad} ${mark.w + pad * 2} ${mark.h + pad * 2}`} role="img" aria-label="Chữ ký">
    <MarkPaths mark={mark} ink={ink} animate={false} />
  </svg>;
}

export function signatureTransform(sig: Pick<SignaturePlacement, 'x' | 'y' | 'scale' | 'rotate'>) {
  return `translate(${(sig.x * VIEW_W).toFixed(1)} ${(sig.y * VIEW_H).toFixed(1)}) rotate(${sig.rotate}) scale(${sig.scale})`;
}

function useMediaQuery(media: string) {
  const subscribe = useCallback((onChange: () => void) => {
    const query = window.matchMedia(media);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [media]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(media).matches, () => false);
}

const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
/** Mouse/trackpad as the primary pointer: the composer swaps the on-photo touch tools for plain controls. */
const useDesktopPointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');

function BoardPhoto({ src, alt, sizes, priority }: { src: string; alt: string; sizes: string; priority?: boolean }) {
  return <Image className={styles.photo} src={src} alt={alt} width={1400} height={2100} sizes={sizes} priority={priority} unoptimized={src.startsWith('/api/')} />;
}

export function SignatureBoard({ photo, photoAlt, avoidZones, signatures, myWish, knownName, onSign, onGoToWishes, onComposerChange }: SignatureBoardProps) {
  // The sheet is portalled to the page's <main>: ancestors such as .paper02-flow use `isolation:isolate`,
  // which would otherwise trap its z-index below later sections. <main> still carries the theme's --w-* vars.
  // On desktop there is no sheet: the guest signs right on the section's photo, at the size it has on the page.
  const desktop = useDesktopPointer();
  const [composerHost, setComposerHost] = useState<Element | null>(null);
  const [inline, setInline] = useState(false);
  const setComposerOpen = (open: boolean) => {
    setComposerHost(open ? boardRef.current?.closest('main') ?? document.body : null);
    setInline(open && desktop);
    onComposerChange?.(open);
  };
  const inlineOpen = !!composerHost && inline;
  const [active, setActive] = useState<string | null>(null);
  const [justSigned, setJustSigned] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  // "Viết lời chúc" closes the sheet first and scrolls only after it unmounts: the sheet's body scroll lock
  // restores the old scroll position on cleanup and would cancel a scroll started while it is still open.
  const goToWishesAfterClose = useRef(false);
  // Work in progress kept while the guest goes up to write a wish, so the button reopens straight at step 2.
  // Cleared when the guest signs or closes the sheet.
  const [draft, setDraft] = useState<ComposerDraft | null>(null);
  // Scrolls back to the photo once the composer has closed and the board is visible again.
  const scrollToBoard = useRef(false);
  useEffect(() => {
    if (composerHost) return;
    if (scrollToBoard.current) {
      scrollToBoard.current = false;
      boardRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
    if (!goToWishesAfterClose.current) return;
    goToWishesAfterClose.current = false;
    onGoToWishes?.();
  }, [composerHost, onGoToWishes, reduced]);

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const activeSig = signatures.find((sig) => sig.id === active);
  // Places the wish card inside the photo: tries above/below the signature and centred/left/right of it, keeps
  // the spots where it fits (else caps its height and scrolls inside) and picks the one covering the least of the
  // no-sign zones (faces, bouquet), preferring above and centred on ties.
  const popoverRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const board = boardRef.current;
    const card = popoverRef.current;
    if (!activeSig || !board || !card) return;
    const gap = 10, edge = 8;
    const { width: W, height: H } = board.getBoundingClientRect();
    const zone = footprint(activeSig);
    const top = Math.max(zone.y * H, 0), bottom = Math.min((zone.y + zone.h) * H, H);
    card.style.maxHeight = 'none';
    const { width: w, height: h } = card.getBoundingClientRect();
    const clampX = (x: number) => Math.min(Math.max(x, edge), W - w - edge);
    const lefts = [clampX(activeSig.x * W - w / 2), clampX(zone.x * W), clampX((zone.x + zone.w) * W - w)];
    const sides = [
      { room: top - gap - edge, place: (height: number) => Math.max(top - gap - height, edge) },
      { room: H - bottom - gap - edge, place: (height: number) => Math.min(bottom + gap, H - height - edge) },
    ];
    const covered = (x: number, y: number, height: number) => avoidZones.reduce((sum, z) => {
      const ox = Math.min(x + w, (z.x + z.w) * W) - Math.max(x, z.x * W);
      const oy = Math.min(y + height, (z.y + z.h) * H) - Math.max(y, z.y * H);
      return sum + (ox > 0 && oy > 0 ? ox * oy : 0);
    }, 0);
    let best: { x: number; y: number; room: number; score: number } | null = null;
    sides.forEach((side, sideIndex) => {
      const room = Math.max(side.room, 72);
      const height = Math.min(h, room);
      const y = side.place(height);
      lefts.forEach((x, leftIndex) => {
        // Not fitting costs more than any overlap; earlier candidates (above, centred) win ties.
        const score = (h > room ? 1e7 + (h - room) * W : 0) + covered(x, y, height) + sideIndex + leftIndex * 0.5;
        if (!best || score < best.score) best = { x, y, room, score };
      });
    });
    const chosen = best!;
    card.style.maxHeight = `${chosen.room}px`;
    card.style.left = `${chosen.x}px`;
    card.style.top = `${chosen.y}px`;
  }, [activeSig, avoidZones]);

  const sign = async (draft: SignatureDraft) => {
    const saved = await onSign(draft);
    setDraft(null);
    setComposerOpen(false);
    setJustSigned(saved.id);
    setActive(null);
    scrollToBoard.current = true;
  };

  const animate = inView && !reduced;
  const composer = composerHost && <SignatureComposer inline={inline} photo={photo} photoAlt={photoAlt} avoidZones={avoidZones} placed={signatures} myWish={myWish} knownName={knownName} resume={draft} onGoToWishes={onGoToWishes && ((saved) => { setDraft(saved); goToWishesAfterClose.current = true; setComposerOpen(false); })} onCancel={() => { setDraft(null); setComposerOpen(false); }} onSubmit={sign} />;

  return <section className={styles.section} aria-labelledby="signature-board-title">
    <p className={styles.eyebrow}>Chữ ký chúc phúc</p>
    <h2 id="signature-board-title" className={styles.title}>Ký tên lên ảnh cưới</h2>
    <p className={styles.subtitle}>Để lại chữ ký của bạn trên tấm ảnh của chúng mình</p>

    <div ref={boardRef} className={styles.board} hidden={inlineOpen}>
      <BoardPhoto src={photo} alt={photoAlt} sizes="(max-width: 520px) 100vw, 480px" />
      <svg key={replayKey} className={styles.overlay} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="group" aria-label={`${signatures.length} chữ ký của khách mời`}>
        {(inView || reduced) && signatures.map((sig, index) => <g
          key={sig.id}
          transform={signatureTransform(sig)}
          className={`${styles.signature}${active === sig.id ? ` ${styles.isActive}` : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`Chữ ký của ${sig.guestName}`}
          onClick={() => setActive(active === sig.id ? null : sig.id)}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActive(active === sig.id ? null : sig.id); } }}
        >
          <rect x={-sig.mark.w / 2 - 20} y={-sig.mark.h / 2 - 20} width={sig.mark.w + 40} height={sig.mark.h + 40} fill="transparent" />
          <MarkPaths mark={sig.mark} ink={sig.ink} animate={animate} delay={sig.id === justSigned ? 0.2 : Math.min(index, 12) * 0.45} highlight={sig.id === justSigned} />
        </g>)}
      </svg>
      {activeSig && <div ref={popoverRef} key={activeSig.id} className={styles.popover} role="dialog" aria-label={`Chữ ký của ${activeSig.guestName}`}>
        <button type="button" className={styles.popoverClose} onClick={() => setActive(null)} aria-label="Đóng"><X size={14} /></button>
        <strong>{activeSig.guestName}</strong>
        {activeSig.wish ? <p>{activeSig.wish.message}</p> : <p className={styles.noWish}>Đã ký tên chúc phúc</p>}
      </div>}
      {/* Replays the write-on animation; a quiet corner button so the photo and the sign button stay the focus. */}
      {!reduced && signatures.length > 0 && <button type="button" className={styles.replay} onClick={() => { setActive(null); setReplayKey((key) => key + 1); }} aria-label="Xem lại hiệu ứng viết chữ ký" title="Xem lại hiệu ứng viết"><RotateCcw size={16} aria-hidden="true" /></button>}
    </div>

    {!inlineOpen && <>
      <button type="button" className={styles.cta} onClick={() => { setActive(null); setComposerOpen(true); }}><span className={styles.ctaShine} aria-hidden="true" /><PenLine className={styles.ctaPen} size={17} aria-hidden="true" />{draft ? 'Tiếp tục ký tên' : 'Ký tên lên ảnh'}</button>
      <p className={styles.steps}><span>1</span>Ký trên ảnh<i>·</i><span>2</span>Đặt vị trí</p>
    </>}

    {composer && (inline ? composer : createPortal(composer, composerHost!))}
  </section>;
}

type Step = 'draw' | 'place';
type ComposerDraft = { mode: 'draw' | 'type'; ink: Ink; font: SignatureFont; strokes: number[][]; typed: string; mark: Mark; pos: SignaturePlacement; name: string };

function SignatureComposer({ inline, photo, photoAlt, avoidZones, placed, myWish, knownName, resume, onGoToWishes, onCancel, onSubmit }: {
  /** Desktop: rendered in the section in place of the board photo, with no backdrop and no page scroll lock. */
  inline: boolean;
  photo: string;
  photoAlt: string;
  avoidZones: Zone[];
  placed: PublicSignature[];
  myWish: { guestName: string } | null;
  knownName?: string;
  /** Saved step-2 state from a trip to the guestbook; reopens at step 2 with it. */
  resume: ComposerDraft | null;
  onGoToWishes?: (draft: ComposerDraft) => void;
  onCancel: () => void;
  onSubmit: (draft: SignatureDraft) => Promise<void>;
}) {
  const [step, setStep] = useState<Step>(resume ? 'place' : 'draw');
  const [mode, setMode] = useState<'draw' | 'type'>(resume?.mode ?? 'draw');
  const [ink, setInk] = useState<Ink>(resume?.ink ?? 'moss');
  const [strokes, setStrokes] = useState<number[][]>(resume?.strokes ?? []);
  const [typed, setTyped] = useState(resume?.typed ?? '');
  const [mark, setMark] = useState<Mark | null>(resume?.mark ?? null);
  const [pos, setPos] = useState<SignaturePlacement>(resume?.pos ?? { x: 0.5, y: 0.1, scale: 0.5, rotate: -4 });
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState(myWish?.guestName || resume?.name || knownName || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef<number | null>(null);
  const [selected, setSelected] = useState(false);
  const [inkOpen, setInkOpen] = useState(false);
  const [font, setFont] = useState<SignatureFont>(resume?.font ?? 'madi');
  const [fontOpen, setFontOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sigRef = useRef<SVGGElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ pos: SignaturePlacement; rect: DOMRect; mid: { x: number; y: number }; dist: number; angle: number } | null>(null);
  const livePos = useRef<SignaturePlacement | null>(null);
  const frame = useRef(0);
  const oneFingerMoves = useRef(false);
  const tap = useRef<{ id: number; x: number; y: number } | null>(null);
  // Live "on a red zone" while a gesture is in flight (null when idle), so the warning follows the drag.
  const [liveFace, setLiveFace] = useState<boolean | null>(null);
  const liveFaceRef = useRef<boolean | null>(null);
  const wheelCommit = useRef(0);
  const onWheel = useRef<(event: WheelEvent) => void>(() => {});
  const backdropPress = useRef(false);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const desktop = useDesktopPointer();
  // On desktop the signature is always editable (as in the first version); touch keeps tap-to-select.
  const editing = selected || desktop;
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(onCancel);
  useEffect(() => { cancelRef.current = onCancel; }, [onCancel]);

  useBodyScrollLock(!inline);
  // Keep the sheet inside the visible viewport: when the on-screen keyboard opens (typing a name), the backdrop
  // shrinks to the area above it and the photo scales down, so the live preview stays in view while typing.
  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const backdrop = backdropRef.current;
    if (inline || !viewport || !backdrop) return;
    const fit = () => Object.assign(backdrop.style, { top: `${viewport.offsetTop}px`, bottom: 'auto', height: `${viewport.height}px` });
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    return () => { viewport.removeEventListener('resize', fit); viewport.removeEventListener('scroll', fit); };
  }, [inline]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.focus({ preventScroll: true });
    // Inline the composer replaces the photo the guest just scrolled past: bring its top back into view.
    if (inline) dialog?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') cancelRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inline]);

  const toView = useCallback((event: { clientX: number; clientY: number }) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * VIEW_W, y: ((event.clientY - rect.top) / rect.height) * VIEW_H };
  }, []);

  const startStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (step !== 'draw' || mode !== 'draw' || strokes.length >= SIGNATURE_LIMITS.strokes) return;
    // Mouse on the page (inline): stop the drag from also selecting the text around the photo.
    if (event.pointerType === 'mouse') event.preventDefault();
    capturePointer(event.currentTarget, event.pointerId);
    const p = toView(event);
    drawingRef.current = event.pointerId;
    setStrokes((list) => [...list, [p.x, p.y]]);
    setError('');
  };

  const moveStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (drawingRef.current !== event.pointerId) return;
    const coalesced = event.nativeEvent.getCoalescedEvents?.() ?? [];
    const samples = coalesced.length ? coalesced : [event.nativeEvent];
    setStrokes((list) => {
      const current = [...list[list.length - 1]];
      for (const sample of samples) {
        const p = toView(sample);
        const lx = current[current.length - 2];
        const ly = current[current.length - 1];
        if (Math.hypot(p.x - lx, p.y - ly) < 3) continue;
        current.push(Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10);
      }
      return [...list.slice(0, -1), current];
    });
  };

  const endStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (drawingRef.current === event.pointerId) drawingRef.current = null;
  };

  const goPlace = () => {
    const next = mode === 'draw' ? centreStrokes(strokes) : typed.trim() ? textSignature(typed.trim(), font) : null;
    if (!next) { setError(mode === 'draw' ? 'Hãy ký vài nét lên ảnh trước nhé.' : 'Hãy nhập tên để tạo chữ ký.'); return; }
    const scale = clamp(Math.min(1, 280 / next.w, 160 / next.h), SIGNATURE_SCALE.min, SIGNATURE_SCALE.max);
    const spot = suggestSpot(next, scale, avoidZones, placed);
    setMark(next);
    setPos({ ...spot, scale: Math.round(scale * 100) / 100, rotate: -4 });
    if (mode === 'type' && !name) setName(typed.trim());
    setSelected(false);
    setStep('place');
  };

  // Step 2 works like a text sticker on Instagram/Canva. Tapping the signature selects it; only then does the
  // photo swallow touches (touch-action:none) — one finger on the signature drags it, two fingers anywhere on the
  // photo pinch to resize and twist to tilt. Tapping empty photo deselects it so the sheet scrolls normally
  // down to the save button. During a gesture the transform is written straight to the DOM once per frame and
  // committed to state on release, so the composer never re-renders mid-gesture. Every move is relative to the
  // placement when the current set of fingers went down, so adding/lifting a finger re-bases instead of jumping.
  const rebaseGesture = (from: SignaturePlacement) => {
    const [a, b = a] = [...pointers.current.values()];
    const rect = wrapRef.current!.getBoundingClientRect();
    gesture.current = a ? {
      pos: from, rect,
      mid: { x: ((a.x + b.x) / 2 - rect.left) / rect.width, y: ((a.y + b.y) / 2 - rect.top) / rect.height },
      dist: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x),
    } : null;
  };

  const handleStyle = (p: SignaturePlacement): CSSProperties => ({
    left: `${p.x * 100}%`, top: `${p.y * 100}%`,
    width: `${(((mark?.w ?? 0) + 44) * p.scale * 100) / VIEW_W}%`, height: `${(((mark?.h ?? 0) + 44) * p.scale * 100) / VIEW_H}%`,
    transform: `translate(-50%, -50%) rotate(${p.rotate}deg)`,
  });

  const paint = () => {
    frame.current = 0;
    const p = livePos.current;
    if (!p) return;
    sigRef.current?.setAttribute('transform', signatureTransform(p));
    if (handleRef.current) Object.assign(handleRef.current.style, handleStyle(p));
    const face = !!mark && signatureCoversZone({ mark, ...p }, avoidZones);
    if (face !== liveFaceRef.current) { liveFaceRef.current = face; setLiveFace(face); }
  };

  const commitLive = () => {
    const moved = livePos.current;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    livePos.current = null;
    liveFaceRef.current = null;
    setLiveFace(null);
    if (moved) setPos(moved);
    return moved;
  };

  const startGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!mark || pointers.current.size >= 2) return;
    if (event.pointerType === 'mouse') {
      if (event.button !== 0) return;
      // Stops the browser from selecting the photo/other signatures and then starting a native drag of that
      // selection, which cancels our pointer stream: the signature "slipped" and the photo got dragged away.
      event.preventDefault();
      window.getSelection()?.removeAllRanges();
    }
    if (pointers.current.size === 0) {
      const onSignature = !!(event.target as Element).closest('[data-signature-handle]');
      if (!onSignature && !editing) return; // chưa chọn chữ ký: để khung cuộn bình thường
      oneFingerMoves.current = onSignature;
      tap.current = onSignature ? null : { id: event.pointerId, x: event.clientX, y: event.clientY };
      if (onSignature) { setSelected(true); setDragging(true); }
    } else {
      oneFingerMoves.current = true;
      tap.current = null;
      setDragging(true);
    }
    capturePointer(event.currentTarget, event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    rebaseGesture(livePos.current ?? pos);
  };

  const moveGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (tap.current?.id === event.pointerId && Math.hypot(event.clientX - tap.current.x, event.clientY - tap.current.y) > 8) tap.current = null;
    if (pointers.current.size === 1 && !oneFingerMoves.current) return;
    const [a, b = a] = [...pointers.current.values()];
    const { rect } = start;
    const midX = ((a.x + b.x) / 2 - rect.left) / rect.width;
    const midY = ((a.y + b.y) / 2 - rect.top) / rect.height;
    let next = { ...start.pos, x: clamp(start.pos.x + midX - start.mid.x, 0.04, 0.96), y: clamp(start.pos.y + midY - start.mid.y, 0.03, 0.97) };
    if (start.dist > 0) {
      const turn = ((Math.atan2(b.y - a.y, b.x - a.x) - start.angle) * 180) / Math.PI;
      const rotate = clamp(start.pos.rotate + (((turn + 540) % 360) - 180), -MAX_ROTATE, MAX_ROTATE);
      next = {
        ...next,
        scale: Math.round(clamp((start.pos.scale * Math.hypot(b.x - a.x, b.y - a.y)) / start.dist, SIGNATURE_SCALE.min, SIGNATURE_SCALE.max) * 100) / 100,
        // Snaps level near 0° like Instagram, so a straight signature is easy to get.
        rotate: Math.abs(rotate) < 2 ? 0 : Math.round(rotate * 10) / 10,
      };
    }
    livePos.current = next;
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  };

  const endGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    if (tap.current?.id === event.pointerId) {
      if (event.type === 'pointerup') { setSelected(false); setInkOpen(false); setFontOpen(false); }
      tap.current = null;
    }
    rebaseGesture(livePos.current ?? pos);
    if (pointers.current.size) return;
    if (commitLive()) navigator.vibrate?.(8);
    setDragging(false);
  };

  // Desktop: the mouse wheel (or a trackpad pinch, sent as ctrl+wheel) resizes, Shift+wheel tilts. Needs a
  // non-passive listener so the page behind the sheet neither scrolls nor zooms. Inline the plain wheel is left
  // to scroll the page, so only ctrl/Shift+wheel act on the signature.
  useEffect(() => {
    onWheel.current = (event) => {
      if (!mark || (inline && !event.ctrlKey && !event.shiftKey)) return;
      event.preventDefault();
      const from = livePos.current ?? pos;
      const delta = event.deltaY || event.deltaX;
      livePos.current = event.shiftKey
        ? { ...from, rotate: clamp(Math.round(from.rotate - Math.sign(delta)), -MAX_ROTATE, MAX_ROTATE) }
        : { ...from, scale: Math.round(clamp(from.scale * Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.002)), SIGNATURE_SCALE.min, SIGNATURE_SCALE.max) * 100) / 100 };
      if (!frame.current) frame.current = requestAnimationFrame(paint);
      clearTimeout(wheelCommit.current);
      wheelCommit.current = window.setTimeout(() => { if (!pointers.current.size) commitLive(); }, 160);
    };
  });
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!desktop || step !== 'place' || !wrap) return;
    const listener = (event: WheelEvent) => onWheel.current(event);
    wrap.addEventListener('wheel', listener, { passive: false });
    return () => { wrap.removeEventListener('wheel', listener); clearTimeout(wheelCommit.current); };
  }, [desktop, step]);

  // Desktop font menu: a click anywhere outside it closes it.
  useEffect(() => {
    if (!desktop || !fontOpen) return;
    const close = (event: PointerEvent) => { if (!fontMenuRef.current?.contains(event.target as Node)) setFontOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [desktop, fontOpen]);

  const nudge = (event: KeyboardEvent<SVGGElement>) => {
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setPos((current) => ({ ...current, x: clamp(current.x + move[0], 0.04, 0.96), y: clamp(current.y + move[1], 0.03, 0.97) }));
  };

  const box = mark ? footprint({ mark, ...pos }) : null;
  // Touching a red zone blocks saving (the server rejects it too); the zones stay visible until it is moved off.
  const onFace = liveFace ?? (!!mark && signatureCoversZone({ mark, ...pos }, avoidZones));
  const onOther = !!box && placed.some((sig) => overlaps(box, footprint(sig)));
  // Exact same name (case and spacing) as a signature already on the photo: warn, but still allow saving.
  const nameTaken = !!name.trim() && placed.some((sig) => sig.guestName === name.trim());

  const submit = async () => {
    if (!mark || submitting || onFace) return;
    if (!name.trim()) { setError('Hãy cho cô dâu chú rể biết bạn là ai nhé.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ guestName: name.trim().slice(0, 100), mark, ink, ...pos });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa thể lưu chữ ký. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  const sheet = <div ref={dialogRef} className={`${styles.sheet}${inline ? ` ${styles.inline}` : ''}`} role={inline ? 'group' : 'dialog'} aria-modal={inline ? undefined : true} aria-labelledby="signature-composer-title" tabIndex={-1}>
    <header className={styles.sheetHead}>
      <div className={styles.progress} aria-hidden="true"><span className={styles.isDone} /><span className={step === 'place' ? styles.isDone : undefined} /></div>
      {step === 'place' && <button type="button" className={styles.iconButton} onClick={() => { setStep('draw'); setError(''); }} disabled={submitting} aria-label="Quay lại bước 1"><ChevronLeft size={20} /></button>}
      <h3 id="signature-composer-title">{step === 'draw' ? 'Bước 1/2 · Ký tên lên ảnh' : 'Bước 2/2 · Đặt vị trí chữ ký'}</h3>
      <button type="button" className={styles.iconButton} onClick={onCancel} aria-label="Đóng"><X size={18} /></button>
    </header>

    {/* Sizes the 2:3 photo to whatever height the header and controls leave, so the sheet never scrolls. */}
    <div className={styles.canvasArea}>
    <div
      ref={wrapRef}
      className={`${styles.canvasWrap}${step === 'place' && !editing ? ` ${styles.canScroll}` : ''}${dragging ? ` ${styles.isDragging}` : ''}`}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={step === 'place' ? startGesture : undefined}
      onPointerMove={step === 'place' ? moveGesture : undefined}
      onPointerUp={step === 'place' ? endGesture : undefined}
      onPointerCancel={step === 'place' ? endGesture : undefined}
    >
      <BoardPhoto src={photo} alt={photoAlt} sizes="(max-width: 520px) 100vw, 460px" />
      <div className={`${styles.wash}${step === 'place' ? ` ${styles.washLight}` : ''}`} aria-hidden="true" />
      <svg
        ref={svgRef}
        className={`${styles.overlay}${step === 'draw' && mode === 'draw' ? ` ${styles.drawSurface}` : ''}`}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        onPointerDown={step === 'draw' ? startStroke : undefined}
        onPointerMove={step === 'draw' ? moveStroke : undefined}
        onPointerUp={step === 'draw' ? endStroke : undefined}
        onPointerCancel={step === 'draw' ? endStroke : undefined}
        aria-label={step === 'draw' ? 'Vùng ký tên trên ảnh' : 'Vị trí chữ ký trên ảnh'}
      >
        <g opacity={step === 'draw' ? 0.25 : 0.6}>
          {placed.map((sig) => <g key={sig.id} transform={signatureTransform(sig)}><MarkPaths mark={sig.mark} ink={sig.ink} animate={false} /></g>)}
        </g>

        {step === 'place' && (dragging || onFace) && avoidZones.map((zone, index) => <rect key={index} className={styles.avoidZone} x={zone.x * VIEW_W} y={zone.y * VIEW_H} width={zone.w * VIEW_W} height={zone.h * VIEW_H} rx={18} />)}

        {step === 'draw' && mode === 'draw' && <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {strokes.map((stroke, index) => <g key={index}>
            <path d={pathFromPoints(stroke)} stroke={inks[ink].halo} strokeWidth={15} />
            <path d={pathFromPoints(stroke)} stroke={inks[ink].stroke} strokeWidth={7} />
          </g>)}
        </g>}
        {step === 'draw' && mode === 'draw' && strokes.length === 0 && <g className={styles.hint} aria-hidden="true">
          <text x={VIEW_W / 2} y={VIEW_H * 0.5} textAnchor="middle">{desktop ? 'Giữ chuột và ký thẳng lên ảnh' : 'Dùng ngón tay ký thẳng lên ảnh'}</text>
        </g>}
        {step === 'draw' && mode === 'type' && <g transform={`translate(${VIEW_W / 2} ${VIEW_H * 0.7}) rotate(-4)`}>
          {typed.trim() && <MarkPaths mark={textSignature(typed.trim(), font)} ink={ink} animate={false} />}
        </g>}

        {step === 'place' && mark && <g
          ref={sigRef}
          transform={signatureTransform(pos)}
          className={styles.draggable}
          tabIndex={0}
          role="slider"
          aria-label="Chữ ký — kéo hoặc dùng phím mũi tên để di chuyển"
          aria-valuetext={`Ngang ${Math.round(pos.x * 100)}%, dọc ${Math.round(pos.y * 100)}%`}
          onKeyDown={nudge}
          onFocus={() => setSelected(true)}
        >
          {(editing || onFace) && <rect className={`${styles.selection}${onFace ? ` ${styles.isWarning}` : ''}`} x={-mark.w / 2 - 22} y={-mark.h / 2 - 22} width={mark.w + 44} height={mark.h + 44} rx={14} vectorEffect="non-scaling-stroke" />}
          <MarkPaths mark={mark} ink={ink} animate={false} />
        </g>}
      </svg>
      {/* HTML hit box over the signature: unlike SVG children it reliably takes touch-action:none, so a drag
          that starts on the signature never turns into a sheet scroll. */}
      {step === 'place' && mark && <div ref={handleRef} className={styles.handle} style={handleStyle(pos)} data-signature-handle aria-hidden="true" />}
      {/* Undo/clear float on the photo so they stay in reach while the photo fills the screen. */}
      {step === 'draw' && mode === 'draw' && strokes.length > 0 && <div className={styles.floatTools}>
        <button type="button" className={styles.floatButton} onClick={() => setStrokes((list) => list.slice(0, -1))} aria-label="Hoàn tác nét vừa ký" title="Hoàn tác"><Undo2 size={18} aria-hidden="true" /></button>
        <button type="button" className={styles.floatButton} onClick={() => setStrokes([])} aria-label="Xoá hết chữ ký" title="Xoá hết"><Trash2 size={18} aria-hidden="true" /></button>
      </div>}
      {/* Size slider on the photo's left edge, shown while the signature is selected (like Instagram's text size). */}
      {step === 'place' && mark && selected && !desktop && <input
        type="range"
        className={styles.sizeSlider}
        min={SIGNATURE_SCALE.min} max={SIGNATURE_SCALE.max} step={0.01} value={pos.scale}
        onChange={(event) => setPos((current) => ({ ...current, scale: Number(event.target.value) }))}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label="Kích thước chữ ký"
      />}
      {/* Ink and font pickers under the size slider: each collapses to its current value, tap to open. */}
      {step === 'place' && mark && selected && !desktop && <div className={styles.sideTools} onPointerDown={(event) => event.stopPropagation()}>
        <div className={styles.inkPicker} role="radiogroup" aria-label="Màu mực">
          {inkOpen
            ? signatureInks.map((key) => <button key={key} type="button" role="radio" aria-checked={ink === key} aria-label={inks[key].label} title={inks[key].label} className={`${styles.inkDot} ${styles[`ink_${key}`]}`} onClick={() => { setInk(key); setInkOpen(false); }} />)
            : <button type="button" className={`${styles.inkDot} ${styles.inkCurrent} ${styles[`ink_${ink}`]}`} aria-expanded={false} aria-label={`Màu mực: ${inks[ink].label} — bấm để đổi`} onClick={() => setInkOpen(true)} />}
        </div>
        {mark.kind === 'text' && <button type="button" className={`${styles.fontToggle}${fontOpen ? ` ${styles.isOpen}` : ''}`} style={{ fontFamily: fontFamily(font) }} aria-expanded={fontOpen} aria-label={`Kiểu chữ: ${signatureFonts[font].label} — bấm để đổi`} onClick={() => { setFontOpen((open) => !open); setInkOpen(false); }}>Aa</button>}
      </div>}
      {step === 'place' && mark?.kind === 'text' && selected && fontOpen && !desktop && <div className={styles.fontRow} role="radiogroup" aria-label="Kiểu chữ" onPointerDown={(event) => event.stopPropagation()}>
        {signatureFontIds.map((key) => <button key={key} type="button" role="radio" aria-checked={font === key} aria-label={signatureFonts[key].label} className={styles.fontChip} style={{ fontFamily: fontFamily(key) }} onClick={() => { setFont(key); setMark(textSignature(mark.text, key)); }}>{signatureFonts[key].label}</button>)}
      </div>}
      {step === 'place' && (!fontOpen || desktop) && <p className={`${styles.placeHint}${onFace || onOther ? ` ${styles.isWarning}` : ''}`} role="status">
        {onFace ? 'Kéo chữ ký ra khỏi vùng đỏ để lưu' : onOther ? 'Đang chồng lên chữ ký khác' : <><Hand size={13} aria-hidden="true" />{inline ? 'Giữ chuột để kéo · Ctrl + lăn chuột để đổi cỡ' : desktop ? 'Giữ chuột để kéo · lăn chuột để đổi cỡ' : selected ? 'Kéo để di chuyển · 2 ngón để chỉnh' : 'Chạm vào chữ ký để chỉnh sửa'}</>}
      </p>}
    </div>
    </div>

    <div className={styles.controls}>
      {step === 'draw' ? <>
        <div className={styles.toolRow}>
          <div className={styles.segmented} role="tablist" aria-label="Cách ký">
            <button type="button" role="tab" aria-selected={mode === 'draw'} onClick={() => { setMode('draw'); setError(''); }}><PenLine size={14} aria-hidden="true" />Vẽ tay</button>
            <button type="button" role="tab" aria-selected={mode === 'type'} onClick={() => { setMode('type'); setError(''); }}><Type size={14} aria-hidden="true" />Gõ tên</button>
          </div>
          <div className={styles.inks} role="radiogroup" aria-label="Màu mực">
            {signatureInks.map((key) => <button key={key} type="button" role="radio" aria-checked={ink === key} aria-label={inks[key].label} title={inks[key].label} className={`${styles.inkDot} ${styles[`ink_${key}`]}`} onClick={() => setInk(key)} />)}
          </div>
        </div>
        {/* Desktop: the name field gets its own row and Continue keeps its full size (undo/clear float on the photo). */}
        {desktop && mode === 'type' && <form onSubmit={(event) => { event.preventDefault(); goPlace(); }}>
          <input className={styles.field} value={typed} maxLength={SIGNATURE_LIMITS.textLength} onChange={(event) => { setTyped(event.target.value); setError(''); }} placeholder="Nhập tên của bạn" aria-label="Tên để tạo chữ ký" autoComplete="name" autoFocus />
        </form>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {desktop ? <div className={styles.actionRow}>
          <button type="button" className={styles.primary} onClick={goPlace}>Tiếp tục</button>
        </div>
        /* Typing mode swaps the Continue button for the name field (same row height, so the photo does not resize). */
        : <div className={styles.actionRow}>
          {mode === 'type'
            ? <form className={styles.typeBar} onSubmit={(event) => { event.preventDefault(); goPlace(); }}>
              <input className={styles.typeField} value={typed} maxLength={SIGNATURE_LIMITS.textLength} onChange={(event) => { setTyped(event.target.value); setError(''); }} placeholder="Nhập tên của bạn" aria-label="Tên để tạo chữ ký" enterKeyHint="next" autoComplete="name" autoFocus />
              <button type="submit" className={styles.typeSubmit} disabled={!typed.trim()} aria-label="Tiếp tục"><ArrowRight size={16} aria-hidden="true" /></button>
            </form>
            : <button type="button" className={styles.primary} onClick={goPlace}>Tiếp tục</button>}
        </div>}
      </> : <>
        {/* Desktop: the plain controls of the first version — ink, font, size and tilt — instead of on-photo tools. */}
        {desktop && mark ? <>
          {/* Ink dots and a collapsed font picker share one row so the photo keeps its height. */}
          <div className={styles.toolRow}>
            <div className={styles.inks} role="radiogroup" aria-label="Màu mực">
              {signatureInks.map((key) => <button key={key} type="button" role="radio" aria-checked={ink === key} aria-label={inks[key].label} title={inks[key].label} className={`${styles.inkDot} ${styles[`ink_${key}`]}`} onClick={() => setInk(key)} />)}
            </div>
            {mark.kind === 'text' && <div ref={fontMenuRef} className={styles.fontPicker}>
              <button type="button" className={styles.fontButton} aria-expanded={fontOpen} aria-haspopup="true" onClick={() => setFontOpen((open) => !open)}>
                <span style={{ fontFamily: fontFamily(font) }}>Aa</span>{signatureFonts[font].label}<ChevronDown size={14} aria-hidden="true" />
              </button>
              {fontOpen && <div className={styles.fontMenu} role="radiogroup" aria-label="Kiểu chữ">
                {signatureFontIds.map((key) => <button key={key} type="button" role="radio" aria-checked={font === key} style={{ fontFamily: fontFamily(key) }} onClick={() => { setFont(key); setMark(textSignature(mark.text, key)); setFontOpen(false); }}>{signatureFonts[key].label}</button>)}
              </div>}
            </div>}
          </div>
          <div className={styles.sliders}>
            <label>Cỡ<input type="range" min={SIGNATURE_SCALE.min} max={SIGNATURE_SCALE.max} step={0.01} value={pos.scale} onChange={(event) => setPos((current) => ({ ...current, scale: Number(event.target.value) }))} /><output>{Math.round(pos.scale * 100)}%</output></label>
            <label>Nghiêng<input type="range" min={-MAX_ROTATE} max={MAX_ROTATE} step={1} value={pos.rotate} onChange={(event) => setPos((current) => ({ ...current, rotate: Number(event.target.value) }))} /><output>{Math.round(pos.rotate)}°</output></label>
          </div>
        </>
          /* Touch screens tilt with a two-finger twist; the slider is only for mouse users. */
          : <label className={styles.tiltSlider}>Nghiêng<input type="range" min={-MAX_ROTATE} max={MAX_ROTATE} step={1} value={pos.rotate} onChange={(event) => setPos((current) => ({ ...current, rotate: Number(event.target.value) }))} /></label>}
        <input className={styles.field} value={name} maxLength={100} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="Tên của bạn" aria-label="Tên của bạn" />
        {myWish
          ? <p className={styles.linkNote}><Link2 size={13} aria-hidden="true" />Chữ ký sẽ gắn với lời chúc bạn đã gửi — bấm vào chữ ký để xem lại.</p>
          : <p className={styles.linkNote}>Nhập đúng tên đã gửi lời chúc để gắn với chữ ký. {onGoToWishes && <button type="button" onClick={() => mark && onGoToWishes({ mode, ink, font, strokes, typed, mark, pos, name })}>Chưa gửi? Viết lời chúc</button>}</p>}
        {nameTaken && <p className={styles.error} role="status">Tên “{name.trim()}” đã có người ký. Bạn vẫn lưu được — nếu là khách khác, nên thêm chi tiết để phân biệt.</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actionRow}>
          <button type="button" className={`${styles.ghost} ${styles.redo}`} onClick={() => { setStep('draw'); setError(''); }} disabled={submitting}><PenLine size={14} aria-hidden="true" />Ký lại</button>
          <button type="button" className={styles.primary} onClick={submit} disabled={submitting || onFace} title={onFace ? 'Chữ ký đang nằm trong vùng không được ký' : undefined}>{submitting ? 'Đang lưu...' : 'Ký tên'}</button>
        </div>
      </>}
    </div>
  </div>;

  if (inline) return sheet;
  // Closes only on a click that both starts and ends on the backdrop: a drag released outside the sheet must not.
  return <div
    ref={backdropRef}
    className={styles.backdrop}
    onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget; }}
    onClick={(event) => { if (event.target === event.currentTarget && backdropPress.current) onCancel(); }}
  >
    {sheet}
  </div>;
}

function capturePointer(target: Element, pointerId: number) {
  try { target.setPointerCapture(pointerId); } catch { /* con trỏ đã kết thúc */ }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
