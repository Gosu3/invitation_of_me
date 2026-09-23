# Tiếp tục dự án trên máy khác

Tài liệu này là điểm bàn giao chung giữa máy công ty và máy ở nhà. Luôn cập nhật file này khi thay đổi hạ tầng, luồng dữ liệu hoặc quy trình triển khai. Không ghi mật khẩu, access token hay API key vào repository.

## Trạng thái hiện tại

- Repository: `https://github.com/Gosu3/invitation_of_me.git`
- Nhánh chính: `main`
- Commit bàn giao nền: `96a95c5`
- Website production: `https://invitationofme.vercel.app`
- Thiệp chính: `https://invitationofme.vercel.app/thiep/tho-va-tham`
- Vercel project: `invitation_of_me`
- Supabase organization: `yalhieicjzgtclzloarp`
- Supabase project: `ThoTham_invitation`
- Supabase project ref: `lerfgehzqvyjvbklwggt`
- Trang quản trị: `https://invitationofme.vercel.app/quan-tri/dang-nhap`

Hai migration production đã áp dụng:

1. `202609210001_wedding_core.sql`
2. `202609230001_seed_tho_tham.sql`

## Bắt đầu trên máy ở nhà

Nếu chưa có repository:

```powershell
git clone https://github.com/Gosu3/invitation_of_me.git
Set-Location invitation_of_me
```

Nếu đã có repository:

```powershell
git status
git switch main
git pull --ff-only origin main
```

Không chạy `git reset --hard` khi còn thay đổi chưa commit. Nếu `git status` không sạch, hãy commit hoặc stash trước khi pull.

Cài dependency đúng theo lockfile:

```powershell
npm ci
```

Đăng nhập và liên kết Vercel:

```powershell
npx --yes vercel@59.25.4 login
npx --yes vercel@59.25.4 link --yes --project invitation_of_me
npx --yes vercel@59.25.4 env pull .env.local
```

Lệnh `env pull` lấy biến môi trường Development đã lưu trên Vercel. Tuyệt đối không commit `.env.local`.

Liên kết Supabase khi cần chạy hoặc tạo migration:

```powershell
npx --yes supabase@latest login
npx --yes supabase@latest link --project-ref lerfgehzqvyjvbklwggt --yes
npx --yes supabase@latest migration list
```

Chạy dự án:

```powershell
npm run dev
```

Mở `http://localhost:3000/thiep/tho-va-tham`.

## Kiểm tra trước khi commit

```powershell
npm run build
git diff --check
git status --short
```

Xác nhận `.env.local`, `.vercel/` và `supabase/.temp/` không xuất hiện trong danh sách file chuẩn bị commit.

## Kết thúc buổi làm việc trên mỗi máy

```powershell
git add <cac-file-da-thay-doi>
git commit -m "mo ta ngan gon thay doi"
git push origin main
```

Sau khi push, ghi lại thay đổi đáng chú ý trong mục **Nhật ký bàn giao** ở cuối file này. Máy còn lại luôn `git pull --ff-only origin main` trước khi bắt đầu sửa code.

## Luồng dữ liệu đang hoạt động

- Khách gửi lời chúc qua `POST /api/wishes`.
- Lời chúc mới có trạng thái `pending`.
- Quản trị viên duyệt hoặc ẩn tại tab **Phản hồi & lời chúc** trong trang chỉnh sửa thiệp.
- Chỉ lời chúc `approved` được trả về từ `GET /api/wishes` và hiển thị công khai.
- RSVP được gửi qua `POST /api/rsvp` và chỉ quản trị viên được xem.
- Tài khoản quản trị được lưu trong Supabase Auth; quyền quản trị được cấp qua bảng `public.wedding_admins`.

## Các file cần biết

- `src/components/wedding/sections.tsx`: các section chính, sổ lưu bút và RSVP.
- `src/app/wedding-composition.css`: bố cục thiệp, album, lịch trình và sổ lưu bút.
- `src/app/wedding-typography.css`: font và cỡ chữ.
- `src/components/wedding/gallery.tsx`: album coverflow và lightbox.
- `src/app/api/wishes/route.ts`: đọc và gửi lời chúc.
- `src/app/api/rsvp/route.ts`: gửi xác nhận tham dự.
- `src/components/admin-editor.tsx`: quản lý RSVP và duyệt lời chúc.
- `src/lib/demo.ts`: dữ liệu dự phòng cho thiệp Thọ & Thắm.
- `src/lib/invitations.ts`: đọc dữ liệu thiệp từ Supabase.
- `supabase/migrations/`: lịch sử schema và dữ liệu nền.

## Quy tắc tránh mất đồng bộ

1. Không sửa cùng một tính năng trên hai máy khi chưa push thay đổi của máy trước.
2. Luôn pull trước khi bắt đầu và push khi kết thúc.
3. Không chuyển `.env.local` qua Git, chat hoặc tài liệu.
4. Migration mới phải có timestamp lớn hơn migration gần nhất và phải commit cùng code sử dụng schema đó.
5. Chạy `supabase migration list` trước `supabase db push` để tránh áp dụng nhầm project.
6. Production chỉ deploy vào Vercel project `invitation_of_me`.
7. Sau deploy, kiểm tra `/thiep/tho-va-tham`, `/api/wishes` và trang quản trị.

## Nhật ký bàn giao

### 2026-09-23

- Kết nối production với Supabase project `lerfgehzqvyjvbklwggt`.
- Áp dụng schema wedding core và seed thiệp Thọ & Thắm.
- Bật lưu RSVP, gửi lời chúc và duyệt lời chúc trong trang quản trị.
- Tạo và xác minh hai tài khoản quản trị trong Supabase Auth; thông tin đăng nhập không lưu trong Git.
- Cập nhật danh sách lời chúc thành card rộng tối đa 600px, cao tối đa 500px, có tên, thời gian và nội dung.
- Build và deploy thành công tại `invitationofme.vercel.app`.

