import QRCode from 'qrcode';
import type { GiftAccount } from './types';

const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

function crc16(value: string) {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function createVietQrPayload(account: GiftAccount) {
  if (!account.bankBin || !account.accountNumber) return null;
  const beneficiary = tlv('00', account.bankBin) + tlv('01', account.accountNumber);
  const merchant = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  const additional = tlv('08', `MUNG CUOI ${account.recipient}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().slice(0, 25));
  const body = tlv('00', '01') + tlv('01', '12') + tlv('38', merchant) + tlv('53', '704') + tlv('58', 'VN') + tlv('62', additional) + '6304';
  return body + crc16(body);
}

export async function getBankQrDataUrl(account: GiftAccount) {
  if (account.qrUrl) return account.qrUrl;
  const payload = createVietQrPayload(account);
  if (!payload) return null;
  return QRCode.toDataURL(payload, { width: 900, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#203A0D', light: '#FFFAF7' } });
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
