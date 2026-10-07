'use client';

import { useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { SignatureBoard, type SignatureDraft } from '@/components/wedding/signature-board';
import type { PublicSignature } from '@/lib/signature-mark';
import { bohoFloralGreen, themeVariables } from '@/lib/wedding-theme';
import styles from './prototype.module.css';

// Bản thử không cần DB: lời chúc và chữ ký lưu localStorage thay cho /api/wishes và /api/signatures.

type LocalWish = { id: string; name: string; message: string };
type LocalSignature = Omit<PublicSignature, 'wish'> & { wishId?: string };

const WISHES_KEY = 'net-duyen:demo-wishes:v1';
const MY_WISH_KEY = 'net-duyen:demo-my-wish:v1';
const SIGNATURES_KEY = 'net-duyen:demo-signatures:v2';
const seedTime = '2026-10-07T00:00:00.000Z';

const seedWishes: LocalWish[] = [
  { id: 'w-1', name: 'Minh Anh', message: 'Chúc hai bạn trăm năm hạnh phúc, mãi yêu thương nhau như ngày đầu.' },
  { id: 'w-2', name: 'Hoàng Long', message: 'Chúc mừng hạnh phúc! Sớm có thiên thần nhỏ nhé.' },
  { id: 'w-3', name: 'Thu Trang', message: 'Cô dâu xinh quá! Chúc hai bạn luôn bình yên bên nhau.' },
];

const seedSignatures: LocalSignature[] = [
  { id: 's-1', guestName: 'Minh Anh', wishId: 'w-1', mark: { kind: 'text', text: 'Minh Anh', w: 304, h: 120 }, ink: 'moss', x: 0.2, y: 0.08, scale: 0.62, rotate: -6, createdAt: seedTime },
  { id: 's-2', guestName: 'Hoàng Long', wishId: 'w-2', mark: { kind: 'text', text: 'Hoàng Long', w: 380, h: 120 }, ink: 'gold', x: 0.76, y: 0.12, scale: 0.55, rotate: 5, createdAt: seedTime },
  { id: 's-3', guestName: 'Thu Trang', wishId: 'w-3', mark: { kind: 'text', text: 'Thu Trang', w: 342, h: 120 }, ink: 'moss', x: 0.76, y: 0.86, scale: 0.6, rotate: -3, createdAt: seedTime },
  { id: 's-4', guestName: 'Bảo Ngọc', mark: { kind: 'text', text: 'Bảo Ngọc', w: 304, h: 120 }, ink: 'moss', x: 0.86, y: 0.62, scale: 0.45, rotate: -8, createdAt: seedTime },
];

// Cùng vùng tránh với migration 202610070002 cho ảnh Tho_MAIA7187 (mặt + hoa cưới; tay được ký).
const avoidZones = [
  { x: 0.27, y: 0.2, w: 0.22, h: 0.18 },
  { x: 0.49, y: 0.26, w: 0.2, h: 0.17 },
  { x: 0.69, y: 0.27, w: 0.24, h: 0.23 },
];

function read<T>(key: string, fallback: T): T {
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* bỏ qua */ }
}

const noopSubscribe = () => () => {};
const localStamp = (prefix: string) => ({ id: `${prefix}-${Date.now()}`, createdAt: new Date().toISOString() });

export function SignaturePrototype() {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return <main className={styles.page} style={themeVariables(bohoFloralGreen)}>{isClient && <PrototypeContent />}</main>;
}

function PrototypeContent() {
  const [localWishes, setLocalWishes] = useState<LocalWish[]>(() => read<LocalWish[]>(WISHES_KEY, []));
  const [myWishId, setMyWishId] = useState<string | null>(() => read<string | null>(MY_WISH_KEY, null));
  const [localSignatures, setLocalSignatures] = useState<LocalSignature[]>(() => read<LocalSignature[]>(SIGNATURES_KEY, []));
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const wishesRef = useRef<HTMLElement>(null);

  const wishes = [...seedWishes, ...localWishes];
  const myWish = wishes.find((wish) => wish.id === myWishId) ?? null;
  const signatures: PublicSignature[] = [...seedSignatures, ...localSignatures].map(({ wishId, ...sig }) => {
    const wish = wishes.find((item) => item.id === wishId);
    return { ...sig, wish: wish ? { guestName: wish.name, message: wish.message } : undefined };
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !message.trim()) { setStatus('Hãy nhập tên và lời chúc.'); return; }
    const wish = { id: `w-${Date.now()}`, name: name.trim(), message: message.trim() };
    const next = [...localWishes, wish];
    setLocalWishes(next); write(WISHES_KEY, next);
    setMyWishId(wish.id); write(MY_WISH_KEY, wish.id);
    setMessage(''); setStatus('Đã gửi lời chúc — giờ hãy ký tên lên ảnh bên dưới nhé.');
  };

  const sign = async (draft: SignatureDraft): Promise<PublicSignature> => {
    if (myWish && localSignatures.some((sig) => sig.wishId === myWish.id)) throw new Error('Lời chúc này đã có chữ ký đi kèm.');
    const saved: LocalSignature = { ...draft, ...localStamp('mine'), wishId: myWish?.id };
    const next = [...localSignatures, saved];
    setLocalSignatures(next); write(SIGNATURES_KEY, next);
    const wish = myWish ? { guestName: myWish.name, message: myWish.message } : undefined;
    return { ...draft, id: saved.id, createdAt: saved.createdAt, wish };
  };

  const resetAll = () => {
    try { [WISHES_KEY, MY_WISH_KEY, SIGNATURES_KEY, 'net-duyen:signature-board:v1'].forEach((key) => window.localStorage.removeItem(key)); } catch { /* bỏ qua */ }
    window.location.reload();
  };

  return <>
    <p className={styles.banner}>Bản thử — dữ liệu chỉ lưu trong trình duyệt này <button type="button" onClick={resetAll}>Làm mới</button></p>

    <section ref={wishesRef} className={styles.wishes} aria-labelledby="wishes-title">
      <h2 id="wishes-title">Sổ lưu bút</h2>
      <p className={styles.note}>(Giả lập phần lời chúc đã có trên thiệp)</p>
      <form className={styles.form} onSubmit={submit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên của bạn" maxLength={60} aria-label="Tên của bạn" />
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Lời chúc..." maxLength={500} rows={3} aria-label="Lời chúc" />
        <button type="submit">Gửi lời chúc</button>
      </form>
      <p className={styles.status} role="status">{status}{myWish && !status && `Bạn đã gửi lời chúc với tên “${myWish.name}”.`}</p>
      <ul className={styles.list}>{[...wishes].reverse().slice(0, 4).map((wish) => <li key={wish.id}><strong>{wish.name}</strong>{wish.message}</li>)}</ul>
    </section>

    <SignatureBoard
      photo="/photos/signature-board-tho.webp"
      photoAlt="Ảnh cưới cô dâu chú rể"
      avoidZones={avoidZones}
      signatures={signatures}
      myWish={myWish ? { guestName: myWish.name } : null}
      onSign={sign}
      onGoToWishes={() => wishesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
    />
  </>;
}
