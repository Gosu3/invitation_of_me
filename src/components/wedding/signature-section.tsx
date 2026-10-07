'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { WeddingInvitationConfig } from '@/lib/wedding-config';
import type { PublicSignature } from '@/lib/signature-mark';
import { useMyWish } from '@/lib/my-wish';
import { weddingSubmissions } from '@/lib/wedding-submissions';
import { SignatureBoard, type SignatureDraft } from './signature-board';

export function SignatureSection({ config, connected, onSigningChange }: { config: WeddingInvitationConfig; connected: boolean; onSigningChange?: (open: boolean) => void }) {
  const board = config.signatureBoard;
  const [signatures, setSignatures] = useState<PublicSignature[]>([]);
  const revision = useRef(0);
  const myWish = useMyWish(config.id);

  useEffect(() => {
    if (!connected) return;
    let active = true;
    let loading = false;
    let refreshAgain = false;
    async function refresh() {
      if (loading) { refreshAgain = true; return; }
      loading = true;
      const started = revision.current;
      try {
        const latest = await weddingSubmissions.listSignatures(config.id);
        if (active && started === revision.current) setSignatures(latest);
      } catch { /* Keep the current board if a refresh fails. */ }
      finally {
        loading = false;
        if (active && refreshAgain) { refreshAgain = false; void refresh(); }
      }
    }
    void refresh();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const realtime = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
    const channel = realtime?.channel(`wedding-signatures:${config.id}`)
      .on('broadcast', { event: 'updated' }, () => { void refresh(); })
      .subscribe((state) => { if (state === 'SUBSCRIBED') void refresh(); });
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      if (channel) void realtime?.removeChannel(channel);
    };
  }, [config.id, connected]);

  if (!board) return null;

  const sign = async (draft: SignatureDraft) => {
    if (!connected) throw new Error('Trang đang ở chế độ xem thử và chưa kết nối Supabase.');
    const result = await weddingSubmissions.signature({
      invitationId: config.id, ...draft,
      wishId: myWish?.wishId, wishToken: myWish?.token, website: '',
    });
    revision.current += 1;
    setSignatures((current) => [...current.filter((sig) => sig.id !== result.signature.id), result.signature]);
    return result.signature;
  };

  return <SignatureBoard
    photo={board.image}
    photoAlt={board.alt}
    avoidZones={board.avoidZones}
    signatures={signatures}
    myWish={myWish ? { guestName: myWish.guestName } : null}
    onSign={sign}
    onComposerChange={onSigningChange}
    onGoToWishes={() => document.getElementById('so-luu-but')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
  />;
}
