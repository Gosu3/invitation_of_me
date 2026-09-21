import type { Metadata } from 'next';
import '@fontsource/noto-serif/400.css';
import '@fontsource/noto-serif/500.css';
import '@fontsource/noto-serif/600.css';
import '@fontsource/noto-serif/400-italic.css';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import './globals.css';
import './invitation-motion.css';

export const metadata: Metadata = {
  title: { default: 'Nét Duyên — Thiệp cưới lưu giữ yêu thương', template: '%s | Nét Duyên' },
  description: 'Một không gian riêng để lưu giữ và chia sẻ những lời mời ngày cưới.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
