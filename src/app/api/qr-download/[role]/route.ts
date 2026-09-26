const qrAssets = {
  groom: {
    path: '/assets/wedding/qr/chu-re-original-v2.jpg',
    fileName: 'ma-qr-chu-re.jpg',
  },
  bride: {
    path: '/assets/wedding/qr/co-dau-original-v2.jpg',
    fileName: 'ma-qr-co-dau.jpg',
  },
} as const;

export async function GET(request: Request, { params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const asset = qrAssets[role as keyof typeof qrAssets];
  if (!asset) return new Response('Không tìm thấy mã QR.', { status: 404 });

  const source = await fetch(new URL(asset.path, request.url), { cache: 'force-cache' });
  if (!source.ok || !source.body) return new Response('Không thể tải mã QR.', { status: 502 });

  return new Response(source.body, {
    headers: {
      'Content-Type': source.headers.get('content-type') || 'image/jpeg',
      'Content-Disposition': `attachment; filename="${asset.fileName}"`,
      'Cache-Control': 'public, max-age=86400, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
