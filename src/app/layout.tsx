import type { Metadata } from 'next';
import '@fontsource/noto-serif/400.css';
import '@fontsource/noto-serif/500.css';
import '@fontsource/noto-serif/600.css';
import '@fontsource/noto-serif/400-italic.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/lora/400.css';
import '@fontsource/lora/500.css';
import '@fontsource/viaoda-libre/400.css';
import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/500.css';
import '@fontsource/eb-garamond/600.css';
import '@fontsource/ms-madi/400.css';
import '@fontsource/uchen/400.css';
import '@fontsource/the-nautigal/400.css';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import './globals.css';
import './invitation-motion.css';
import './wedding-composition.css';
import './wedding-typography.css';

export const metadata: Metadata = {
  title: { default: 'Nét Duyên — Thiệp cưới lưu giữ yêu thương', template: '%s | Nét Duyên' },
  description: 'Một không gian riêng để lưu giữ và chia sẻ những lời mời ngày cưới.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
