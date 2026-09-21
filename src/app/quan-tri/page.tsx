import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isDatabaseConfigured, requireAdmin } from '@/lib/supabase';
import { AdminDashboard } from '@/components/admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!isDatabaseConfigured()) return <main className="admin-setup"><h1>Thiết lập Supabase</h1><p>Ứng dụng đang chạy ở chế độ xem thiệp mẫu. Hãy điền biến môi trường và áp dụng migration theo README.md để dùng trang quản trị.</p><Link href="/">Về trang chủ</Link></main>;
  if (!await requireAdmin()) redirect('/quan-tri/dang-nhap');
  return <AdminDashboard />;
}
