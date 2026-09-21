'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Copy, Download, Gift, QrCode } from 'lucide-react';
import type { GiftAccount } from '@/lib/types';
import { downloadDataUrl, getBankQrDataUrl } from '@/lib/wedding-qr';
import { Modal, SectionTitle } from './shared';

export function GiftBox({ open }: { open: () => void }) {
  const [opening, setOpening] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  function reveal() {
    if (timer.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { open(); return; }
    setOpening(true);
    timer.current = window.setTimeout(() => { open(); setOpening(false); timer.current = null; }, 520);
  }
  return <button className={`gift-box-button${opening ? ' is-unwrapping' : ''}`} onClick={reveal} aria-busy={opening} aria-label="Mở hộp quà mừng">
    <span className="gift-sparkles" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i></span>
    <span className="present" aria-hidden="true"><span className="present-lid"><span className="present-bow" /></span><span className="present-base"><span className="present-heart">♡</span></span></span>
    <span className="gift-box-caption">Nhấn để mở <Gift size={16} /></span><small>Gửi một chút yêu thương</small>
  </button>;
}

function BankCard({ account, fallbackRole }: { account: GiftAccount | null; fallbackRole: string }) {
  const [qr, setQr] = useState<string | null>(account?.qrUrl || null);
  const [copied, setCopied] = useState(false);
  const [saveHint, setSaveHint] = useState('');
  useEffect(() => { let active = true; if (account) void getBankQrDataUrl(account).then((value) => { if (active) setQr(value); }); return () => { active = false; }; }, [account]);
  async function copy() {
    if (!account) return;
    try { await navigator.clipboard.writeText(account.accountNumber); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setSaveHint('Hãy chọn số tài khoản và sao chép thủ công.'); }
  }
  function saveQr() {
    if (!qr || !account) return;
    try { downloadDataUrl(qr, `vietqr-${account.recipient.toLowerCase().replace(/\s+/g, '-')}.png`); setSaveHint('Đã chuẩn bị ảnh QR để tải xuống.'); }
    catch { setSaveHint('Nếu thiết bị không tải tự động, hãy nhấn giữ ảnh QR để lưu.'); }
  }
  return <article className="bank-card">
    <span className="bank-role">{account?.recipient || fallbackRole}</span>
    {account?.bankLogo && <Image className="bank-logo" src={account.bankLogo} alt={`Logo ${account.bankName}`} width={100} height={34} unoptimized />}
    {qr ? <Image className="bank-qr" src={qr} alt={`Mã QR chuyển khoản ${account?.recipient}`} width={230} height={230} unoptimized /> : <div className="qr-placeholder"><QrCode size={36} strokeWidth={1} /><span>Mã QR sẽ được bổ sung</span></div>}
    {account ? <><strong>{account.accountHolder}</strong><span>{account.bankName}</span><span className="account-number">{account.accountNumber}</span><div className="bank-actions"><button onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Đã sao chép' : 'Sao chép STK'}</button>{qr && <button onClick={saveQr}><Download size={15} /> Lưu QR</button>}</div></> : <p>Thông tin ngân hàng sẽ được bổ sung sau.</p>}
    {saveHint && <small role="status">{saveHint}</small>}
  </article>;
}

export function GiftSection({ accounts, inline, open }: { accounts: GiftAccount[]; inline: boolean; open: () => void }) {
  return <section className="invite-section gift-section" id="qua-mung"><SectionTitle eyebrow="TẤM LÒNG CỦA BẠN">Hộp quà mừng</SectionTitle><p>Sự hiện diện của bạn đã là món quà rất quý.</p>{inline ? <div className="gift-accounts inline"><BankCard account={accounts[0] || null} fallbackRole="Chú rể" /><BankCard account={accounts[1] || null} fallbackRole="Cô dâu" /></div> : <GiftBox open={open} />}</section>;
}

export function GiftModal({ accounts, close }: { accounts: GiftAccount[]; close: () => void }) {
  return <Modal label="Hộp Quà Mừng" className="gift-dialog" close={close}>
    <span className="gift-modal-icon"><Gift size={26} /></span><span className="eyebrow">GỬI GẮM YÊU THƯƠNG</span><h2>Hộp Quà Mừng</h2><p>Cảm ơn bạn đã cùng chúng mình<br />lưu giữ một ngày thật đẹp.</p>
    <div className="gift-accounts"><BankCard account={accounts[0] || null} fallbackRole="Chú rể" /><BankCard account={accounts[1] || null} fallbackRole="Cô dâu" /></div>
    <p className="gift-thanks">Sự hiện diện của bạn là món quà quý giá nhất ♡</p>
  </Modal>;
}
