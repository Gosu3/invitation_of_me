'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import type { SignatureZone } from '@/lib/signature-mark';
import type { WeddingMedia } from '@/lib/types';

const MAX_ZONES = 12;
const round = (value: number) => Math.round(value * 1000) / 1000;

export type SignatureSettings = { signaturesEnabled: boolean; signatureImage: string; signatureAvoidZones: SignatureZone[] };

export function AdminSignatureSettings({ value, media, onChange }: {
  value: SignatureSettings;
  media: WeddingMedia[];
  onChange: (next: Partial<SignatureSettings>) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [draft, setDraftState] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  // Pointer events can arrive faster than re-renders; the ref always holds the latest rectangle.
  const draftRef = useRef(draft);
  const setDraft = (next: typeof draft) => { draftRef.current = next; setDraftState(next); };
  const zones = value.signatureAvoidZones;
  const choices = [
    ...(value.signatureImage && !value.signatureImage.startsWith('/api/media/') ? [{ url: value.signatureImage, label: 'Ảnh hiện tại' }] : []),
    ...media.map((item, index) => ({ url: item.url, label: `Ảnh ${index + 1}${item.alt ? `: ${item.alt}` : ''}` })),
  ];

  const point = (event: ReactPointerEvent) => {
    const rect = boardRef.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) };
  };
  const start = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button') || zones.length >= MAX_ZONES) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
    const p = point(event);
    setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = draftRef.current;
    if (!current) return;
    const p = point(event);
    setDraft({ ...current, x1: p.x, y1: p.y });
  };
  const end = () => {
    const draft = draftRef.current;
    if (!draft) return;
    const zone = { x: round(Math.min(draft.x0, draft.x1)), y: round(Math.min(draft.y0, draft.y1)), w: round(Math.abs(draft.x1 - draft.x0)), h: round(Math.abs(draft.y1 - draft.y0)) };
    setDraft(null);
    if (zone.w > 0.02 && zone.h > 0.02) onChange({ signatureAvoidZones: [...zones, zone] });
  };
  const box = (zone: SignatureZone) => ({ left: `${zone.x * 100}%`, top: `${zone.y * 100}%`, width: `${zone.w * 100}%`, height: `${zone.h * 100}%` });

  return <>
    <label className="toggle-row"><input type="checkbox" checked={value.signaturesEnabled} onChange={(event) => onChange({ signaturesEnabled: event.target.checked })} /><span><strong>Bật bảng chữ ký</strong><small>Khách ký tên lên ảnh cưới, hiện ngay dưới sổ lưu bút. Cần chọn ảnh bên dưới.</small></span></label>
    <label className="admin-field"><span>Ảnh để khách ký</span>
      <select value={value.signatureImage} onChange={(event) => onChange({ signatureImage: event.target.value })}>
        <option value="">Chưa chọn</option>
        {choices.map((choice) => <option key={choice.url} value={choice.url}>{choice.label}</option>)}
      </select>
      <small>Nên dùng ảnh dọc tỉ lệ 2:3 (ảnh khác tỉ lệ sẽ bị cắt). Tải ảnh ở mục 04 rồi chọn tại đây.</small>
    </label>
    {value.signaturesEnabled && !value.signatureImage && <div className="admin-help">Bảng chữ ký chỉ hiện khi đã chọn ảnh.</div>}
    {value.signatureImage && <div className="admin-field"><span>Vùng không nên ký ({zones.length}/{MAX_ZONES})</span>
      <div ref={boardRef} className="admin-zone-board" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={() => setDraft(null)}>
        <Image src={value.signatureImage} alt="" width={1400} height={2100} sizes="320px" unoptimized={value.signatureImage.startsWith('/api/')} draggable={false} />
        {zones.map((zone, index) => <div className="admin-zone" key={index} style={box(zone)}>
          <button type="button" aria-label={`Xoá vùng ${index + 1}`} onClick={() => onChange({ signatureAvoidZones: zones.filter((_, i) => i !== index) })}><X size={12} /></button>
        </div>)}
        {draft && <div className="admin-zone is-draft" style={box({ x: Math.min(draft.x0, draft.x1), y: Math.min(draft.y0, draft.y1), w: Math.abs(draft.x1 - draft.x0), h: Math.abs(draft.y1 - draft.y0) })} />}
      </div>
      <small>Kéo trên ảnh để khoanh mặt cô dâu chú rể, bó hoa… Khách được cảnh báo khi đặt chữ ký đè lên các vùng này.</small>
    </div>}
  </>;
}
