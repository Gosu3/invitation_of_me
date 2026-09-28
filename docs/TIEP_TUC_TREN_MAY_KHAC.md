# Tiếp tục dự án trên máy khác

Tài liệu này là điểm bàn giao chung giữa máy công ty và máy ở nhà. Luôn cập nhật file này khi thay đổi hạ tầng, luồng dữ liệu hoặc quy trình triển khai. Không ghi mật khẩu, access token hay API key vào repository.

## Trạng thái hiện tại

- Repository: `https://github.com/Gosu3/invitation_of_me.git`
- Nhánh chính: `main`
- Điểm đồng bộ: luôn dùng commit mới nhất của `origin/main`; không dựa vào một hash bàn giao cố định.
- Website production: `https://invitationofme.vercel.app`
- Thiệp chính: `https://invitationofme.vercel.app/thiep/tho-va-tham`
- Vercel project: `invitation_of_me`
- Supabase organization: `yalhieicjzgtclzloarp`
- Supabase project: `ThoTham_invitation`
- Supabase project ref: `lerfgehzqvyjvbklwggt`
- Trang quản trị: `https://invitationofme.vercel.app/quan-tri/dang-nhap`

Repository hiện có 14 migration theo thứ tự trong `supabase/migrations/`. Ngoài schema nền và link mời ngắn, các migration mới hơn cập nhật lịch riêng, địa điểm, slug và nhãn quản trị của hai thiệp. Không sửa migration đã chạy; mọi thay đổi dữ liệu tiếp theo phải tạo migration có timestamp mới.

- Nhà trai: `/thiep/tho-va-tham`, nhãn **Văn Thọ & Hồng Thắm (Thiệp Nhà Trai)**.
- Nhà gái: `/thiep/tham-va-tho`, nhãn **Văn Thọ & Hồng Thắm (Thiệp Nhà Gái)**.
- Alias cũ `/thiep/tho-va-tham-nha-gai` chuyển hướng sang slug nhà gái.
- Hai thiệp dùng chung danh sách lời chúc nhưng giữ RSVP, lịch trình và địa điểm riêng.

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

- Khách gửi lời chúc qua `POST /api/wishes`; lời chúc hợp lệ được lưu ở trạng thái `approved`.
- Lời chúc được phát tín hiệu realtime và đồng bộ giữa thiệp nhà trai/nhà gái; polling định kỳ là đường dự phòng khi mất broadcast.
- Quản trị viên sửa, ẩn, hiện lại hoặc xóa tại tab **Tất cả lời chúc** trên dashboard.
- `GET /api/wishes` chỉ trả các trường công khai của lời chúc đang ở trạng thái `approved`.
- RSVP được gửi qua `POST /api/rsvp` và chỉ quản trị viên được xem.
- Tài khoản quản trị được lưu trong Supabase Auth; quyền quản trị được cấp qua bảng `public.wedding_admins`.

## Các file cần biết

- `src/components/wedding/sections.tsx`: các section chính, sổ lưu bút và RSVP.
- `src/app/wedding-composition.css`: bố cục thiệp, album, lịch trình và sổ lưu bút.
- `src/app/wedding-typography.css`: font và cỡ chữ.
- `src/components/wedding/gallery.tsx`: album coverflow và lightbox.
- `src/app/api/wishes/route.ts`: đọc và gửi lời chúc.
- `src/app/api/rsvp/route.ts`: gửi xác nhận tham dự.
- `src/components/admin-dashboard.tsx`, `src/components/admin-responses.tsx`: quản lý link mời, RSVP và lời chúc.
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

### 2026-09-28

- Đồng bộ code mới nhất từ `origin/main`.
- Lời chúc hiển thị ngay, đồng bộ realtime giữa hai thiệp và cuộn vòng tự động.
- Trang quản trị tách phản hồi nhà trai/nhà gái, quản lý link mời và toàn bộ lời chúc.
- Hộp quà dùng hai QR chính thức, hỗ trợ lưu/chia sẻ ảnh trên mobile.
- Bổ sung regression test cho nhạc và CSV; lệnh chạy chuẩn là `npm test`.

## Cá nhân hóa tên khách mời

Cách dùng chính là đăng nhập `/quan-tri`, nhập tên ở khung **Tạo link mời riêng** và sao chép link ngắn dạng `/m/A7kP3`. Tên tiếng Việt được lưu trong bảng `wedding_guest_links`, không nằm trong URL.

Áp dụng migration mới trước khi dùng:

```powershell
npx --yes supabase@latest db push
```

Tham số `guest` dưới đây được giữ lại để tương thích với những link đã tạo trước đó.

Tên khách ở bìa thiệp được lấy từ tham số `guest` trên URL. Không cần sửa code hoặc build lại cho từng khách.

Ví dụ:

```text
http://localhost:3000/thiep/tho-va-tham?guest=B%E1%BA%A1n%20A%20%26%20ng%C6%B0%E1%BB%9Di%20th%C6%B0%C6%A1ng
```

Khi mở link trên, bìa thiệp hiển thị `Thân Mời: Bạn A & người thương`. Có thể dùng `khach` thay cho `guest`. Khi URL không có hai tham số này, bìa giữ nội dung mặc định `Thân Mời`.

