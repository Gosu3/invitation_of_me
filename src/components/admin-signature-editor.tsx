'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  SIGNATURE_LIMITS, SIGNATURE_MAX_ROTATE, SIGNATURE_VIEW_H as VIEW_H, SIGNATURE_VIEW_W as VIEW_W,
  signatureFontFamily, signatureFontIds, signatureFonts, signatureInks, textSignature,
  type SignatureFont, type SignatureInk, type SignatureMark, type SignaturePlacement, type SignatureZone,
} from '@/lib/signature-mark';
import { inks, MarkPaths, signatureTransform } from './wedding/signature-board';

export type EditableSignature = {
  id: string; guest_name: string; mark: SignatureMark; ink: SignatureInk;
  x: number; y: number; scale: number; rotate: number; status: 'approved' | 'hidden';
};
export type SignatureEdit = Partial<{ guestName: string; ink: SignatureInk; x: number; y: number; scale: number; rotate: number; status: EditableSignature['status']; text: string; font: SignatureFont }>;

const SCALE = { min: 0.2, max: 1.5 };
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number, step: number) => Math.round(value / step) * step;
const readout = (p: SignaturePlacement) => `${Math.round(p.scale * 100)}% · ${Math.round(p.rotate)}°`;

/** Full-screen editor for one signature: drag it on the board photo and change every property guests can pick. */
export function AdminSignatureEditor({ signature, others, photo, avoidZones, onSave, onDelete, onClose }: {
  signature: EditableSignature;
  /** Other signatures on the same board, drawn faded for context. */
  others: EditableSignature[];
  photo: string | null;
  avoidZones: SignatureZone[];
  onSave: (edit: SignatureEdit) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(signature);
  const [font, setFont] = useState<SignatureFont>(signature.mark.kind === 'text' ? signature.mark.font ?? 'madi' : 'madi');
  const [text, setText] = useState(signature.mark.kind === 'text' ? signature.mark.text : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<SVGGElement>(null);
  const readoutRef = useRef<HTMLOutputElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ pos: SignaturePlacement; rect: DOMRect; mid: { x: number; y: number }; dist: number; angle: number } | null>(null);
  const livePos = useRef<SignaturePlacement | null>(null);
  const frame = useRef(0);
  const wheelCommit = useRef(0);
  const onWheel = useRef<(event: WheelEvent) => void>(() => {});
  const [gesturing, setGesturing] = useState(false);
  const isText = signature.mark.kind === 'text';
  const mark: SignatureMark = isText && text.trim() ? textSignature(text.trim(), font) : signature.mark;

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [onClose, saving]);

  const set = (patch: Partial<EditableSignature>) => { setDraft((current) => ({ ...current, ...patch })); setError(''); };
  // Touch works like a sticker on Instagram: one finger anywhere on the photo drags the signature, two fingers
  // pinch to resize, twist to tilt and move it by their midpoint. Every move is relative to the placement when
  // the current set of fingers went down, so adding or lifting a finger re-bases instead of jumping. Mid-gesture
  // the transform is written straight to the DOM once per frame and committed to state on release, so the form
  // never re-renders while the fingers move.
  const rebase = (from: SignaturePlacement) => {
    const [a, b = a] = [...pointers.current.values()];
    const rect = boardRef.current!.getBoundingClientRect();
    gesture.current = a ? {
      pos: from, rect,
      mid: { x: ((a.x + b.x) / 2 - rect.left) / rect.width, y: ((a.y + b.y) / 2 - rect.top) / rect.height },
      dist: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x),
    } : null;
  };
  const paint = () => {
    frame.current = 0;
    const p = livePos.current;
    if (!p) return;
    targetRef.current?.setAttribute('transform', signatureTransform(p));
    if (readoutRef.current) readoutRef.current.textContent = readout(p);
  };
  const preview = (next: SignaturePlacement) => {
    livePos.current = next;
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  };
  const commit = () => {
    const moved = livePos.current;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    livePos.current = null;
    if (moved) set(moved);
  };
  const startGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointers.current.size >= 2 || (event.pointerType === 'mouse' && event.button !== 0)) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* con trỏ đã kết thúc */ }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    rebase(livePos.current ?? draft);
    setGesturing(true);
  };
  const moveGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const [a, b = a] = [...pointers.current.values()];
    const { rect } = start;
    const midX = ((a.x + b.x) / 2 - rect.left) / rect.width;
    const midY = ((a.y + b.y) / 2 - rect.top) / rect.height;
    let next = {
      ...start.pos,
      x: round(clamp(start.pos.x + midX - start.mid.x, 0, 1), 0.001),
      y: round(clamp(start.pos.y + midY - start.mid.y, 0, 1), 0.001),
    };
    if (start.dist > 0) {
      const turn = ((Math.atan2(b.y - a.y, b.x - a.x) - start.angle) * 180) / Math.PI;
      const rotate = clamp(start.pos.rotate + (((turn + 540) % 360) - 180), -SIGNATURE_MAX_ROTATE, SIGNATURE_MAX_ROTATE);
      next = {
        ...next,
        scale: round(clamp((start.pos.scale * Math.hypot(b.x - a.x, b.y - a.y)) / start.dist, SCALE.min, SCALE.max), 0.01),
        // Snaps level near 0°, so a straight signature is easy to get back.
        rotate: Math.abs(rotate) < 2 ? 0 : Math.round(rotate),
      };
    }
    preview(next);
  };
  const endGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    rebase(livePos.current ?? draft);
    if (pointers.current.size) return;
    if (livePos.current) navigator.vibrate?.(8);
    commit();
    setGesturing(false);
  };

  // Mouse/trackpad: the wheel (or a trackpad pinch, sent as ctrl+wheel) resizes, Shift+wheel tilts. It needs a
  // non-passive listener so the page itself neither zooms nor scrolls.
  useEffect(() => {
    onWheel.current = (event) => {
      event.preventDefault();
      const from = livePos.current ?? draft;
      const delta = event.deltaY || event.deltaX;
      preview(event.shiftKey
        ? { ...from, rotate: clamp(Math.round(from.rotate - Math.sign(delta)), -SIGNATURE_MAX_ROTATE, SIGNATURE_MAX_ROTATE) }
        : { ...from, scale: round(clamp(from.scale * Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.002)), SCALE.min, SCALE.max), 0.01) });
      clearTimeout(wheelCommit.current);
      wheelCommit.current = window.setTimeout(commit, 160);
    };
  });
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const listener = (event: WheelEvent) => onWheel.current(event);
    board.addEventListener('wheel', listener, { passive: false });
    return () => { board.removeEventListener('wheel', listener); clearTimeout(wheelCommit.current); cancelAnimationFrame(frame.current); };
  }, []);
  const nudge = (event: KeyboardEvent<SVGGElement>) => {
    const step = event.shiftKey ? 0.05 : 0.005;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    set({ x: clamp(draft.x + move[0], 0, 1), y: clamp(draft.y + move[1], 0, 1) });
  };

  // Only send what changed, so a plain move never re-measures the mark.
  const changes = (): SignatureEdit => {
    const edit: SignatureEdit = {};
    if (draft.guest_name.trim() !== signature.guest_name) edit.guestName = draft.guest_name.trim();
    for (const key of ['ink', 'x', 'y', 'scale', 'rotate', 'status'] as const) if (draft[key] !== signature[key]) Object.assign(edit, { [key]: draft[key] });
    if (signature.mark.kind === 'text') {
      if (text.trim() !== signature.mark.text) edit.text = text.trim();
      if (font !== (signature.mark.font ?? 'madi')) edit.font = font;
    }
    return edit;
  };
  const save = async () => {
    if (!draft.guest_name.trim()) { setError('Tên khách không được để trống.'); return; }
    if (isText && !text.trim()) { setError('Nội dung chữ ký không được để trống.'); return; }
    const edit = changes();
    if (!Object.keys(edit).length) { onClose(); return; }
    setSaving(true);
    try { await onSave(edit); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể lưu thay đổi.'); setSaving(false); }
  };
  const remove = async () => {
    if (!window.confirm('Xoá vĩnh viễn chữ ký của ' + signature.guest_name + '?')) return;
    setSaving(true);
    try { await onDelete(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể xoá chữ ký.'); setSaving(false); }
  };

  return <div className="admin-signature-editor-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <div className="admin-signature-editor" role="dialog" aria-modal="true" aria-label={'Chỉnh sửa chữ ký của ' + signature.guest_name}>
      <div className="admin-signature-stage">
        <div ref={boardRef} className={'admin-signature-board' + (gesturing ? ' is-gesturing' : '')} onPointerDown={startGesture} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture}>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of the board photo, any source */}
          {photo ? <img src={photo} alt="Ảnh ký tên" draggable={false} /> : <div className="admin-signature-board-empty">Thiệp chưa chọn ảnh ký tên</div>}
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
            {avoidZones.map((zone, index) => <rect key={index} className="admin-signature-zone" x={zone.x * VIEW_W} y={zone.y * VIEW_H} width={zone.w * VIEW_W} height={zone.h * VIEW_H} rx={18} />)}
            <g opacity={0.45}>{others.map((sig) => <g key={sig.id} transform={signatureTransform(sig)}><MarkPaths mark={sig.mark} ink={sig.ink} animate={false} /></g>)}</g>
            <g ref={targetRef} className="admin-signature-target" transform={signatureTransform(draft)} opacity={draft.status === 'hidden' ? 0.5 : 1} onKeyDown={nudge} tabIndex={0} role="slider" aria-label="Vị trí chữ ký — kéo hoặc dùng phím mũi tên" aria-valuetext={`Ngang ${Math.round(draft.x * 100)}%, dọc ${Math.round(draft.y * 100)}%`}>
              <rect x={-mark.w / 2 - 22} y={-mark.h / 2 - 22} width={mark.w + 44} height={mark.h + 44} rx={14} vectorEffect="non-scaling-stroke" />
              <MarkPaths mark={mark} ink={draft.ink} animate={false} />
            </g>
          </svg>
          <output ref={readoutRef} className="admin-signature-readout" aria-hidden="true">{readout(draft)}</output>
        </div>
        <p className="admin-help">Kéo trên ảnh để di chuyển chữ ký; dùng hai ngón tay để phóng to/thu nhỏ và xoay. Trên máy tính: cuộn chuột để đổi cỡ, giữ Shift khi cuộn để xoay, phím mũi tên để dịch từng chút (giữ Shift để bước lớn). Vùng đỏ là vùng khách không được ký.</p>
      </div>

      <div className="admin-signature-controls">
        <h2>Chỉnh sửa chữ ký</h2>
        <label className="admin-field"><span>Tên khách</span><input value={draft.guest_name} maxLength={100} onChange={(event) => set({ guest_name: event.target.value })} /></label>
        {isText && <label className="admin-field"><span>Nội dung chữ ký</span><input value={text} maxLength={SIGNATURE_LIMITS.textLength} onChange={(event) => { setText(event.target.value); setError(''); }} /></label>}
        {isText && <div className="admin-field"><span>Kiểu chữ</span><div className="admin-signature-chips" role="radiogroup" aria-label="Kiểu chữ">
          {signatureFontIds.map((key) => <button key={key} type="button" role="radio" aria-checked={font === key} style={{ fontFamily: signatureFontFamily(key) }} onClick={() => { setFont(key); setError(''); }}>{signatureFonts[key].label}</button>)}
        </div></div>}
        <div className="admin-field"><span>Màu mực</span><div className="admin-signature-chips" role="radiogroup" aria-label="Màu mực">
          {signatureInks.map((key) => <button key={key} type="button" role="radio" aria-checked={draft.ink === key} onClick={() => set({ ink: key })}><i className={'admin-ink-dot ' + key} aria-hidden="true" />{inks[key].label}</button>)}
        </div></div>
        <label className="admin-field"><span>Kích thước · {Math.round(draft.scale * 100)}%</span><input type="range" min={SCALE.min} max={SCALE.max} step={0.01} value={draft.scale} onChange={(event) => set({ scale: Number(event.target.value) })} /></label>
        <label className="admin-field"><span>Độ nghiêng · {Math.round(draft.rotate)}°</span><input type="range" min={-SIGNATURE_MAX_ROTATE} max={SIGNATURE_MAX_ROTATE} step={1} value={draft.rotate} onChange={(event) => set({ rotate: Number(event.target.value) })} /></label>
        <div className="admin-fields two">
          <label className="admin-field"><span>Ngang (%)</span><input type="number" min={0} max={100} step={0.5} value={Math.round(draft.x * 1000) / 10} onChange={(event) => set({ x: clamp(Number(event.target.value) / 100, 0, 1) })} /></label>
          <label className="admin-field"><span>Dọc (%)</span><input type="number" min={0} max={100} step={0.5} value={Math.round(draft.y * 1000) / 10} onChange={(event) => set({ y: clamp(Number(event.target.value) / 100, 0, 1) })} /></label>
        </div>
        <label className="toggle-row"><input type="checkbox" checked={draft.status === 'approved'} onChange={(event) => set({ status: event.target.checked ? 'approved' : 'hidden' })} /><span><strong>Hiển thị trên thiệp</strong><small>Tắt để ẩn chữ ký khỏi ảnh mà không xoá.</small></span></label>
        {error && <p className="admin-alert error" role="alert">{error}</p>}
        <div className="admin-signature-actions">
          <button type="button" className="admin-secondary danger" onClick={remove} disabled={saving}>Xoá chữ ký</button>
          <span />
          <button type="button" className="admin-secondary" onClick={onClose} disabled={saving}>Huỷ</button>
          <button type="button" className="admin-primary" onClick={save} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
        </div>
      </div>
    </div>
  </div>;
}
