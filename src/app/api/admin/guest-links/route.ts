import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';
import { guestLinkSchema } from '@/lib/validation';

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const CODE_LENGTH = 5;

function createShortCode() {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { data, error } = await admin.service
    .from('wedding_guest_links')
    .select('id,invitation_id,code,guest_name,created_at')
    .order('created_at', { ascending: false })
    .limit(12);
  if (error) return NextResponse.json({ error: 'Chưa thể tải link khách mời. Hãy kiểm tra migration guest invite links.' }, { status: 500 });
  return NextResponse.json({ links: data || [] });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  const parsed = guestLinkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Hãy chọn thiệp và nhập tên người được mời.' }, { status: 400 });

  const { data: invitation } = await admin.service
    .from('wedding_invitations')
    .select('id,status')
    .eq('id', parsed.data.invitationId)
    .maybeSingle();
  if (!invitation) return NextResponse.json({ error: 'Không tìm thấy thiệp đã chọn.' }, { status: 404 });
  if (invitation.status !== 'published') return NextResponse.json({ error: 'Hãy xuất bản thiệp trước khi tạo link khách mời.' }, { status: 400 });

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = createShortCode();
    const { data, error } = await admin.service
      .from('wedding_guest_links')
      .insert({ invitation_id: parsed.data.invitationId, guest_name: parsed.data.guestName, code, created_by: admin.user.id })
      .select('id,invitation_id,code,guest_name,created_at')
      .single();
    if (!error && data) return NextResponse.json({ link: data, path: `/m/${code}` }, { status: 201 });
    if (error?.code !== '23505') return NextResponse.json({ error: 'Không thể tạo link. Hãy kiểm tra migration guest invite links.' }, { status: 500 });
  }

  return NextResponse.json({ error: 'Không thể tạo mã duy nhất. Vui lòng thử lại.' }, { status: 503 });
}
