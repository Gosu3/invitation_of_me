'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import Image from 'next/image';
import { Download, Hand, Link2, PenLine, RotateCcw, Type, Undo2, X } from 'lucide-react';
import {
  SIGNATURE_LIMITS, SIGNATURE_VIEW_H as VIEW_H, SIGNATURE_VIEW_W as VIEW_W,
  centreStrokes, signatureFootprint as footprint, signatureInks, signaturePath as pathFromPoints, textSignature,
  type PublicSignature, type SignatureInk as Ink, type SignatureMark as Mark, type SignaturePlacement, type SignatureZone as Zone,
} from '@/lib/signature-mark';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';
import styles from './signature-board.module.css';

// Board photo must be portrait 2:3 — it is rendered with that ratio to line up with the 1000x1500 viewBox.

const TYPED_FONT = "'Ms Madi', cursive";

export type SignatureDraft = SignaturePlacement & { guestName: string; mark: Mark; ink: Ink };

export type SignatureBoardProps = {
  photo: string;
  photoAlt: string;
  avoidZones: Zone[];
  signatures: PublicSignature[];
  /** The wish this browser sent in the guestbook above, if any; the new signature links to it. */
  myWish: { guestName: string } | null;
  onSign: (draft: SignatureDraft) => Promise<PublicSignature>;
  onGoToWishes?: () => void;
  /** Lets the host pause page auto-scroll while the guest is signing. */
  onComposerChange?: (open: boolean) => void;
};

const inks: Record<Ink, { label: string; stroke: string; halo: string }> = {
  moss: { label: 'Xanh rêu', stroke: '#30530f', halo: '#fffaf7' },
  ivory: { label: 'Trắng ngà', stroke: '#fffaf7', halo: 'rgba(48,83,15,.55)' },
  gold: { label: 'Nhũ vàng', stroke: '#a87a2a', halo: '#fffaf7' },
};

function overlaps(a: Zone, b: Zone, gap = 0) {
  return a.x - gap < b.x + b.w && a.x + a.w + gap > b.x && a.y - gap < b.y + b.h && a.y + a.h + gap > b.y;
}

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

function MarkPaths({ mark, ink, animate, delay = 0, highlight }: { mark: Mark; ink: Ink; animate: boolean; delay?: number; highlight?: boolean }) {
  const color = inks[ink];
  const cls = animate ? styles.writeOn : undefined;
  if (mark.kind === 'text') {
    return <g className={highlight ? styles.justSigned : undefined}>
      <text className={cls} style={{ animationDelay: `${delay}s` } as CSSProperties} textAnchor="middle" dominantBaseline="central" fontFamily={TYPED_FONT} fontSize={110} fill="none" stroke={color.halo} strokeWidth={7} strokeOpacity={0.9} strokeLinejoin="round">{mark.text}</text>
      <text className={animate ? styles.typedInk : undefined} style={{ animationDelay: `${delay}s` } as CSSProperties} textAnchor="middle" dominantBaseline="central" fontFamily={TYPED_FONT} fontSize={110} fill={color.stroke} stroke={color.stroke} strokeWidth={1.6}>{mark.text}</text>
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

function signatureTransform(sig: Pick<SignaturePlacement, 'x' | 'y' | 'scale' | 'rotate'>) {
  return `translate(${(sig.x * VIEW_W).toFixed(1)} ${(sig.y * VIEW_H).toFixed(1)}) rotate(${sig.rotate}) scale(${sig.scale})`;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => false);
}

function BoardPhoto({ src, alt, sizes, priority }: { src: string; alt: string; sizes: string; priority?: boolean }) {
  return <Image className={styles.photo} src={src} alt={alt} width={1400} height={2100} sizes={sizes} priority={priority} unoptimized={src.startsWith('/api/')} />;
}

export function SignatureBoard({ photo, photoAlt, avoidZones, signatures, myWish, onSign, onGoToWishes, onComposerChange }: SignatureBoardProps) {
  const [composerOpen, setComposerOpenState] = useState(false);
  const setComposerOpen = (open: boolean) => { setComposerOpenState(open); onComposerChange?.(open); };
  const [active, setActive] = useState<string | null>(null);
  const [justSigned, setJustSigned] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const activeSig = signatures.find((sig) => sig.id === active);

  const sign = async (draft: SignatureDraft) => {
    const saved = await onSign(draft);
    setComposerOpen(false);
    setJustSigned(saved.id);
    setActive(null);
    requestAnimationFrame(() => boardRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }));
  };

  const exportImage = async () => {
    const image = new window.Image();
    image.src = photo;
    await image.decode();
    await document.fonts.load(`110px ${TYPED_FONT}`);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(image, 0, 0);
    ctx.scale(canvas.width / VIEW_W, canvas.height / VIEW_H);
    for (const sig of signatures) {
      const color = inks[sig.ink];
      ctx.save();
      ctx.translate(sig.x * VIEW_W, sig.y * VIEW_H);
      ctx.rotate((sig.rotate * Math.PI) / 180);
      ctx.scale(sig.scale, sig.scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (sig.mark.kind === 'text') {
        ctx.font = `110px ${TYPED_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 7; ctx.strokeStyle = color.halo; ctx.strokeText(sig.mark.text, 0, 0);
        ctx.fillStyle = color.stroke; ctx.fillText(sig.mark.text, 0, 0);
        ctx.lineWidth = 1.6; ctx.strokeStyle = color.stroke; ctx.strokeText(sig.mark.text, 0, 0);
      } else {
        for (const [width, style] of [[15, color.halo], [7, color.stroke]] as const) {
          ctx.lineWidth = width; ctx.strokeStyle = style;
          for (const stroke of sig.mark.strokes) ctx.stroke(new Path2D(pathFromPoints(stroke)));
        }
      }
      ctx.restore();
    }
    const link = document.createElement('a');
    link.download = 'so-luu-but-chu-ky.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  const animate = inView && !reduced;

  return <section className={styles.section} aria-labelledby="signature-board-title">
    <p className={styles.eyebrow}>Chữ ký chúc phúc</p>
    <h2 id="signature-board-title" className={styles.title}>Ký tên lên ảnh cưới</h2>
    <p className={styles.subtitle}>Để lại chữ ký của bạn trên tấm ảnh của chúng mình</p>

    <div ref={boardRef} className={styles.board}>
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
      {activeSig && <div className={`${styles.popover}${activeSig.y < 0.35 ? ` ${styles.popoverBelow}` : ''}`} style={{ left: `${Math.min(Math.max(activeSig.x, 0.22), 0.78) * 100}%`, top: `${activeSig.y * 100}%` }} role="dialog" aria-label={`Chữ ký của ${activeSig.guestName}`}>
        <button type="button" className={styles.popoverClose} onClick={() => setActive(null)} aria-label="Đóng"><X size={14} /></button>
        <strong>{activeSig.guestName}</strong>
        {activeSig.wish ? <p>{activeSig.wish.message}</p> : <p className={styles.noWish}>Đã ký tên chúc phúc</p>}
      </div>}
    </div>

    <div className={styles.boardBar}>
      <span className={styles.count}>{signatures.length} chữ ký</span>
      <div className={styles.barActions}>
        {!reduced && signatures.length > 0 && <button type="button" className={styles.ghost} onClick={() => setReplayKey((key) => key + 1)}><RotateCcw size={14} aria-hidden="true" />Viết lại</button>}
        {signatures.length > 0 && <button type="button" className={styles.ghost} onClick={exportImage}><Download size={14} aria-hidden="true" />Tải ảnh</button>}
      </div>
    </div>

    <button type="button" className={styles.cta} onClick={() => { setActive(null); setComposerOpen(true); }}><PenLine size={17} aria-hidden="true" />Ký tên lên ảnh</button>
    <p className={styles.steps}><span>1</span>Ký trên ảnh<i>·</i><span>2</span>Đặt vị trí</p>

    {composerOpen && <SignatureComposer photo={photo} photoAlt={photoAlt} avoidZones={avoidZones} placed={signatures} myWish={myWish} onGoToWishes={onGoToWishes} onCancel={() => setComposerOpen(false)} onSubmit={sign} />}
  </section>;
}

type Step = 'draw' | 'place';

function SignatureComposer({ photo, photoAlt, avoidZones, placed, myWish, onGoToWishes, onCancel, onSubmit }: {
  photo: string;
  photoAlt: string;
  avoidZones: Zone[];
  placed: PublicSignature[];
  myWish: { guestName: string } | null;
  onGoToWishes?: () => void;
  onCancel: () => void;
  onSubmit: (draft: SignatureDraft) => Promise<void>;
}) {
  const [step, setStep] = useState<Step>('draw');
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [ink, setInk] = useState<Ink>('moss');
  const [strokes, setStrokes] = useState<number[][]>([]);
  const [typed, setTyped] = useState('');
  const [mark, setMark] = useState<Mark | null>(null);
  const [pos, setPos] = useState<SignaturePlacement>({ x: 0.5, y: 0.1, scale: 0.5, rotate: -4 });
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState(myWish?.guestName ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef<number | null>(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(onCancel);
  useEffect(() => { cancelRef.current = onCancel; }, [onCancel]);

  useBodyScrollLock(true);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') cancelRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toView = useCallback((event: { clientX: number; clientY: number }) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * VIEW_W, y: ((event.clientY - rect.top) / rect.height) * VIEW_H };
  }, []);

  const startStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (step !== 'draw' || mode !== 'draw' || strokes.length >= SIGNATURE_LIMITS.strokes) return;
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
    const next = mode === 'draw' ? centreStrokes(strokes) : typed.trim() ? textSignature(typed.trim()) : null;
    if (!next) { setError(mode === 'draw' ? 'Hãy ký vài nét lên ảnh trước nhé.' : 'Hãy nhập tên để tạo chữ ký.'); return; }
    const scale = Math.max(0.25, Math.min(1, 280 / next.w, 160 / next.h));
    const spot = suggestSpot(next, scale, avoidZones, placed);
    setMark(next);
    setPos({ ...spot, scale: Math.round(scale * 100) / 100, rotate: -4 });
    if (mode === 'type' && !name) setName(typed.trim());
    setStep('place');
  };

  const startDrag = (event: ReactPointerEvent<SVGGElement>) => {
    event.stopPropagation();
    capturePointer(event.currentTarget, event.pointerId);
    const p = toView(event);
    dragOffset.current = { dx: pos.x - p.x / VIEW_W, dy: pos.y - p.y / VIEW_H };
    setDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<SVGGElement>) => {
    if (!dragging) return;
    const p = toView(event);
    setPos((current) => ({ ...current, x: clamp(p.x / VIEW_W + dragOffset.current.dx, 0.04, 0.96), y: clamp(p.y / VIEW_H + dragOffset.current.dy, 0.03, 0.97) }));
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    navigator.vibrate?.(8);
  };

  const nudge = (event: KeyboardEvent<SVGGElement>) => {
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setPos((current) => ({ ...current, x: clamp(current.x + move[0], 0.04, 0.96), y: clamp(current.y + move[1], 0.03, 0.97) }));
  };

  const box = mark ? footprint({ mark, ...pos }) : null;
  const onFace = !!box && avoidZones.some((zone) => overlaps(box, zone));
  const onOther = !!box && placed.some((sig) => overlaps(box, footprint(sig)));

  const submit = async () => {
    if (!mark || submitting) return;
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

  return <div className={styles.backdrop} onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <div ref={dialogRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="signature-composer-title" tabIndex={-1}>
      <header className={styles.sheetHead}>
        <div className={styles.progress} aria-hidden="true"><span className={styles.isDone} /><span className={step === 'place' ? styles.isDone : undefined} /></div>
        <h3 id="signature-composer-title">{step === 'draw' ? 'Bước 1/2 · Ký tên lên ảnh' : 'Bước 2/2 · Đặt vị trí chữ ký'}</h3>
        <button type="button" className={styles.iconButton} onClick={onCancel} aria-label="Đóng"><X size={18} /></button>
      </header>

      <div className={styles.canvasWrap}>
        <BoardPhoto src={photo} alt={photoAlt} sizes="(max-width: 520px) 100vw, 460px" />
        <div className={`${styles.wash}${step === 'place' ? ` ${styles.washLight}` : ''}`} aria-hidden="true" />
        <svg
          ref={svgRef}
          className={`${styles.overlay} ${step === 'draw' && mode === 'draw' ? styles.drawSurface : ''}`}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          onPointerDown={startStroke}
          onPointerMove={moveStroke}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          aria-label={step === 'draw' ? 'Vùng ký tên trên ảnh' : 'Vị trí chữ ký trên ảnh'}
        >
          <g opacity={step === 'draw' ? 0.25 : 0.6}>
            {placed.map((sig) => <g key={sig.id} transform={signatureTransform(sig)}><MarkPaths mark={sig.mark} ink={sig.ink} animate={false} /></g>)}
          </g>

          {step === 'place' && dragging && avoidZones.map((zone, index) => <rect key={index} className={styles.avoidZone} x={zone.x * VIEW_W} y={zone.y * VIEW_H} width={zone.w * VIEW_W} height={zone.h * VIEW_H} rx={18} />)}

          {step === 'draw' && mode === 'draw' && <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {strokes.map((stroke, index) => <g key={index}>
              <path d={pathFromPoints(stroke)} stroke={inks[ink].halo} strokeWidth={15} />
              <path d={pathFromPoints(stroke)} stroke={inks[ink].stroke} strokeWidth={7} />
            </g>)}
          </g>}
          {step === 'draw' && mode === 'draw' && strokes.length === 0 && <g className={styles.hint} aria-hidden="true">
            <text x={VIEW_W / 2} y={VIEW_H * 0.5} textAnchor="middle">Dùng ngón tay ký thẳng lên ảnh</text>
          </g>}
          {step === 'draw' && mode === 'type' && <g transform={`translate(${VIEW_W / 2} ${VIEW_H * 0.14}) rotate(-4)`}>
            {typed.trim() && <MarkPaths mark={textSignature(typed.trim())} ink={ink} animate={false} />}
          </g>}

          {step === 'place' && mark && <g
            transform={signatureTransform(pos)}
            className={`${styles.draggable}${dragging ? ` ${styles.isDragging}` : ''}`}
            tabIndex={0}
            role="slider"
            aria-label="Chữ ký — kéo hoặc dùng phím mũi tên để di chuyển"
            aria-valuetext={`Ngang ${Math.round(pos.x * 100)}%, dọc ${Math.round(pos.y * 100)}%`}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={nudge}
          >
            <rect className={`${styles.selection}${onFace ? ` ${styles.isWarning}` : ''}`} x={-mark.w / 2 - 22} y={-mark.h / 2 - 22} width={mark.w + 44} height={mark.h + 44} rx={14} vectorEffect="non-scaling-stroke" />
            <MarkPaths mark={mark} ink={ink} animate={false} />
          </g>}
        </svg>
        {step === 'place' && <p className={`${styles.placeHint}${onFace || onOther ? ` ${styles.isWarning}` : ''}`} role="status">
          {onFace ? 'Chữ ký đang che mặt cô dâu chú rể' : onOther ? 'Đang chồng lên chữ ký khác' : <><Hand size={13} aria-hidden="true" />Kéo để đổi vị trí</>}
        </p>}
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
          {mode === 'type' && <input className={styles.field} value={typed} maxLength={SIGNATURE_LIMITS.textLength} onChange={(event) => { setTyped(event.target.value); setError(''); }} placeholder="Nguyễn Văn An" aria-label="Tên để tạo chữ ký" autoFocus />}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actionRow}>
            {mode === 'draw' && <>
              <button type="button" className={styles.ghost} onClick={() => setStrokes((list) => list.slice(0, -1))} disabled={!strokes.length}><Undo2 size={14} aria-hidden="true" />Hoàn tác</button>
              <button type="button" className={styles.ghost} onClick={() => setStrokes([])} disabled={!strokes.length}>Xoá</button>
            </>}
            <button type="button" className={styles.primary} onClick={goPlace}>Tiếp tục</button>
          </div>
        </> : <>
          <div className={styles.sliders}>
            <label>Kích thước<input type="range" min={0.25} max={1.4} step={0.01} value={pos.scale} onChange={(event) => setPos((current) => ({ ...current, scale: Number(event.target.value) }))} /></label>
            <label>Nghiêng<input type="range" min={-25} max={25} step={1} value={pos.rotate} onChange={(event) => setPos((current) => ({ ...current, rotate: Number(event.target.value) }))} /></label>
          </div>
          <input className={styles.field} value={name} maxLength={100} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="Tên của bạn" aria-label="Tên của bạn" />
          {myWish
            ? <p className={styles.linkNote}><Link2 size={13} aria-hidden="true" />Chữ ký sẽ gắn với lời chúc bạn đã gửi — bấm vào chữ ký để xem lại.</p>
            : <p className={styles.linkNote}>Bạn chưa gửi lời chúc. {onGoToWishes && <button type="button" onClick={() => { onCancel(); onGoToWishes(); }}>Viết lời chúc ở phía trên</button>}</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actionRow}>
            <button type="button" className={styles.ghost} onClick={() => { setStep('draw'); setError(''); }} disabled={submitting}>Ký lại</button>
            <button type="button" className={styles.primary} onClick={submit} disabled={submitting}>{submitting ? 'Đang lưu...' : 'Ký tên'}</button>
          </div>
        </>}
      </div>
    </div>
  </div>;
}

function capturePointer(target: Element, pointerId: number) {
  try { target.setPointerCapture(pointerId); } catch { /* con trỏ đã kết thúc */ }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
