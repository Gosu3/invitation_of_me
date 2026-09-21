import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  const invitationId = String(form.get('invitationId') || '');
  const alt = String(form.get('alt') || '').trim().slice(0, 200);
  if (!(file instanceof File) || !/^[0-9a-f-]{36}$/i.test(invitationId)) return NextResponse.json({ error: 'Thiếu ảnh hoặc thiệp.' }, { status: 400 });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) return NextResponse.json({ error: 'Chỉ nhận JPG, PNG, WebP tối đa 12 MB.' }, { status: 400 });
  const { data: invitation } = await admin.service.from('wedding_invitations').select('id').eq('id', invitationId).maybeSingle();
  if (!invitation) return NextResponse.json({ error: 'Không tìm thấy thiệp.' }, { status: 404 });
  let image: Buffer;
  try { image = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 }).rotate().resize({ width: 1800, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(); }
  catch { return NextResponse.json({ error: 'Không đọc được tệp ảnh.' }, { status: 400 }); }
  const bucket = 'wedding-media';
  const bucketStatus = await admin.service.storage.getBucket(bucket);
  if (bucketStatus.error) {
    const create = await admin.service.storage.createBucket(bucket, { public: false, fileSizeLimit: 8 * 1024 * 1024, allowedMimeTypes: ['image/webp'] });
    if (create.error) return NextResponse.json({ error: 'Không thể tạo vùng lưu ảnh riêng tư.' }, { status: 500 });
  }
  const id = randomUUID();
  const storagePath = `${invitationId}/${id}.webp`;
  const uploaded = await admin.service.storage.from(bucket).upload(storagePath, image, { contentType: 'image/webp', upsert: false });
  if (uploaded.error) return NextResponse.json({ error: 'Không thể tải ảnh lên.' }, { status: 500 });
  const { error } = await admin.service.from('wedding_media').insert({ id, invitation_id: invitationId, storage_path: storagePath, alt_text: alt, mime_type: 'image/webp', byte_size: image.length });
  if (error) { await admin.service.storage.from(bucket).remove([storagePath]); return NextResponse.json({ error: 'Không thể lưu thông tin ảnh.' }, { status: 500 }); }
  return NextResponse.json({ id, url: `/api/media/${id}`, alt, sortOrder: 0 }, { status: 201 });
}
