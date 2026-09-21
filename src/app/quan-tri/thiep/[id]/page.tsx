import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase';
import { AdminEditor } from '@/components/admin-editor';

export const dynamic = 'force-dynamic';
export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) redirect('/quan-tri/dang-nhap');
  return <AdminEditor id={(await params).id} />;
}
