@AGENTS.md

# Project map — Nét Duyên (thiệp cưới)

Website nhiều thiệp cưới dùng **một template duy nhất** (Hoa Mộc Xanh, tone xanh/trắng). Mỗi thiệp = một bộ dữ liệu. UI tiếng Việt. Production: `invitationofme.vercel.app`, Vercel project `invitation_of_me`, Supabase ref `lerfgehzqvyjvbklwggt`.

## Stack
Next.js 16.3.5 App Router (đọc `node_modules/next/dist/docs/` trước khi dùng API Next; middleware ở đây là `src/proxy.ts`), React 19.2, TypeScript, Supabase (Postgres + Storage + Auth + Realtime), Zod 4, plain CSS (không Tailwind), `@fontsource/*`, `lucide-react`, `qrcode`, `sharp`.

## Lệnh
`npm run dev` · `npm test` (node:test, `scripts/review-regressions.test.mjs`: nhạc shuffle + CSV) · `npm run lint` · `npm run typecheck` · `npm run build`

Visual regression (Playwright, `tests/visual/`, baseline trong `tests/visual/__screenshots__/{mobile,tablet,desktop}`):
- `npm run test:visual` — tự `next build` + `next start` cổng 3100 ở chế độ demo (env Supabase để trống), reduced-motion, đồng hồ giả cố định, chặn mạng ngoài. So khớp 0 pixel.
- `npm run test:visual:update` — chỉ chạy khi thay đổi giao diện là **cố ý** và đã được chủ dự án duyệt; commit ảnh baseline mới cùng thay đổi CSS.
- Không phủ: animation mở thiệp/hoa rơi (bị tắt bởi reduced-motion), bản đồ Google (mask), dữ liệu production.

## Luồng dữ liệu
- `/thiep/[slug]` và `/m/[code]` (link mời ngắn, tên khách trong `wedding_guest_links`) → `getInvitation` (`src/lib/invitations.ts`: DB row → `Invitation`) → `createWeddingConfig` (`src/lib/wedding-config.ts`: config + feature flags) → `InvitationExperience` (client).
- Thiếu env Supabase → dùng `src/lib/demo.ts`. Có DB: lỗi query thì throw (trang lỗi), không tìm thấy thì 404 — không bao giờ thay bằng nội dung demo; chỉ ảnh/cover còn thiếu mới mượn từ demo (`public/photos`).
- Tên khách trên bìa chỉ đến từ link `/m/[code]` (tạo ở trang quản trị); `?guest=` đã bị gỡ.
- Chữ ký trên ảnh: `wedding/signature-section.tsx` (GET/POST `/api/signatures`, realtime + polling 15s) → `signature-board.tsx` (UI thuần); hình học/giới hạn ở `src/lib/signature-mark.ts`. Bật theo thiệp bằng `signatures_enabled` + `signature_image`; chưa có UI admin. Trang thử không cần DB: `/thu-ky-ten`.
- Lời chúc: `POST /api/wishes` lưu `approved` ngay, realtime + polling 5s; `tho-va-tham` & `tham-va-tho` dùng chung lời chúc (`src/lib/wedding-wish-groups.ts`), RSVP/lịch/địa điểm riêng.
- Admin: `/quan-tri/*` + `/api/admin/*` → `requireAdmin()` (`src/lib/supabase.ts`, bảng `wedding_admins`) → service-role client.

## File chính
| Việc | Vị trí |
|---|---|
| Thứ tự section, mở thiệp, auto-scroll, modal | `src/components/invitation-experience.tsx` |
| Section (lời mời, lễ, tiệc + lịch, timeline, guestbook, RSVP) | `src/components/wedding/sections.tsx` |
| Bìa/phong bì | `src/components/wedding/envelope-intro.tsx`, `hero-cover.module.css` |
| Album / quà + QR / nhạc | `wedding/gallery.tsx` / `wedding/gift.tsx`, `api/qr-download/[role]` / `hooks/use-wedding-music.ts`, `lib/wedding-playlist.ts` |
| Theme, asset path | `src/lib/wedding-theme.ts` |
| CSS thiệp (import order trong `layout.tsx`, đừng đổi) | `src/app/invitation-motion.css`, `wedding-composition.css`, `wedding-typography.css`, `wedding-mobile.css`, `mobile-forms.css`; `globals.css` cho home/admin |
| Kiểu dữ liệu / validation | `src/lib/types.ts` / `src/lib/validation.ts` |
| Admin UI | `src/components/admin-{dashboard,editor,responses}.tsx` |
| Schema | `supabase/migrations/` (15 file; core = `202609210001_wedding_core.sql`) |

Thêm trường thiệp: migration mới → `types.ts` → `invitations.ts` → form admin → template → docs.

## Quy tắc
- Không tạo template thứ hai; trường tùy chọn rỗng thì ẩn gọn.
- Không sửa migration đã áp dụng; tạo migration timestamp mới.
- Sửa nội dung ở lớp dữ liệu, không hardcode tên/ngày vào CSS. Dữ liệu production nằm trong DB (migration), `demo.ts` chỉ là fallback.
- CSS có nhiều lớp override/`!important` tích lũy: sửa cục bộ, không refactor/gộp file. Timing/animation/z-index/carousel là vùng rủi ro cao.

## Quy ước CSS (không chồng thêm lớp)
1. Trước khi sửa: grep selector trong tất cả `src/app/*.css` + `hero-cover.module.css`, xác định rule **đang thắng** (file nạp sau, specificity, `!important`, media query) — sửa ngay tại dòng đó, không viết rule mới đè lên.
2. Vị trí chuẩn: bố cục desktop → `wedding-composition.css`; chữ → `wedding-typography.css`; mobile (≤650px…) → `wedding-mobile.css`; form mobile → `mobile-forms.css`; animation → `invitation-motion.css`.
3. Không thêm `!important` mới; chỉ khi bắt buộc thắng một `!important` có sẵn, kèm comment lý do.
4. Màu/font dùng biến có sẵn (`--w-*` từ `wedding-theme.ts`, `--burgundy`, `--serif`…), không hardcode giá trị mới nếu đã có biến.
5. Scope selector dưới `.botanical-theme`/section tương ứng; không sửa selector chung có thể lan sang admin/trang chủ.
6. Sau khi sửa CSS: chạy `npm run test:visual`. Chỉ phần được yêu cầu được phép lệch; lệch chỗ khác = sửa lại, không update baseline.
- Không commit `.env.local`, `.vercel/`, `supabase/.temp/`; không đưa khóa/số tài khoản vào repo hay chat.
- `next-env.d.ts` bị `next dev` tự đổi (`.next/dev/types`) — không commit thay đổi đó trừ khi được yêu cầu.

## Docs
`README.md` (setup/deploy), `docs/CAU_TRUC_DU_AN.md` (cấu trúc), `docs/CODEBASE_AUDIT_2026-09-28.md` (vùng rủi ro đã biết). `STUDY.md` mục "Kế hoạch tiếp theo"/"Prompt khởi động" đã lỗi thời (QR đã có, thông tin cưới đã cập nhật).
