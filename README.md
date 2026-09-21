# Nét Duyên — website thiệp cưới

Một website lưu trữ nhiều thiệp cưới bằng **một mẫu giao diện duy nhất**. Ứng dụng dùng Next.js, TypeScript và Supabase. Nội dung giao diện ưu tiên tiếng Việt.

## Yêu cầu

- Node.js 20.9 trở lên (khuyến nghị Node.js 22 hoặc 24)
- npm
- Một dự án Supabase và quyền cấu hình Vercel nếu triển khai

## Chạy trên máy

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`. Khi chưa cấu hình Supabase, ứng dụng hiển thị **hai thiệp demo chỉ để xem giao diện** tại `/thiep/tho-va-tham` và `/thiep/lan-va-huy`. Biểu mẫu RSVP/lời chúc được tắt trong chế độ demo; chúng không giả vờ lưu dữ liệu. Tên Văn Thọ & Hồng Thắm, ảnh cưới và ngày 29/11/2026 trong thiệp đầu theo thông tin bạn cung cấp; giờ, địa điểm, hạn RSVP và lời mời vẫn là nội dung mẫu cần xác nhận.

## Kết nối Supabase

1. Mở dự án Supabase `lerfgehzqvyjvbklwggt`. Kiểm tra bảng và bucket hiện có trước khi chạy migration.
2. Áp dụng lần lượt các tệp SQL trong `supabase/migrations/` bằng quy trình migration của bạn hoặc SQL Editor. Migration chỉ thêm các bảng `wedding_*` và chính sách liên quan.
3. Cấu hình `.env.local` (không commit tệp này):

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://lerfgehzqvyjvbklwggt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key>
   SUPABASE_SERVICE_ROLE_KEY=<secret service role key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Trong Supabase Auth, tạo hoặc mời tài khoản quản trị của bạn. Lấy `user_id` của tài khoản và thêm vào `public.wedding_admins`:

   ```sql
   insert into public.wedding_admins (user_id)
   values ('<UUID của tài khoản quản trị>')
   on conflict (user_id) do nothing;
   ```

5. Đăng nhập tại `/quan-tri/dang-nhap`. Không bật đăng ký công khai nếu chỉ có một quản trị viên.

Chỉ `NEXT_PUBLIC_*` được đưa vào trình duyệt. `SUPABASE_SERVICE_ROLE_KEY` phải được giữ bí mật ở máy chủ. Không gửi khóa trong chat hoặc commit vào Git.

## Ảnh cưới mẫu

Ảnh trong `public/photos/` được chuyển từ thư mục ảnh do chủ dự án cung cấp. `scripts/prepare-photos.mjs` tạo lại các bản WebP kích thước web từ một thư mục nguồn mà không sửa ảnh gốc:

```powershell
node scripts/prepare-photos.mjs 'C:\duong-dan\den\anh-cuoi'
```

Ứng dụng chỉ dùng ảnh này trong dữ liệu demo tại `src/lib/demo.ts`. Thiệp production lấy ảnh từ Supabase Storage.

## Các lệnh kiểm tra

```powershell
npm run lint
npm run typecheck
npm run build
npm run start
```

## Triển khai Vercel

1. Xác định đúng project Vercel cần dùng; URL team/project list không xác định một website cụ thể.
2. Kết nối repository với project đó.
3. Thêm bốn biến môi trường ở trên cho Preview và Production; `NEXT_PUBLIC_SITE_URL` đặt thành URL thật của từng môi trường.
4. Chạy migration Supabase trước khi đưa các route quản trị lên production.
5. Triển khai Preview, kiểm tra luồng tạo thiệp, xuất bản, RSVP, ảnh và quyền truy cập; sau đó triển khai Production.

## Sao lưu và quyền riêng tư

- Sao lưu PostgreSQL **và** các tệp trong bucket `wedding-media`; bản sao lưu database không bao gồm nội dung tệp Storage.
- Thiệp đã xuất bản mặc định dùng `noindex` để hạn chế xuất hiện trên công cụ tìm kiếm. Bất kỳ ai có đường dẫn vẫn xem được thiệp; `noindex` không phải mật khẩu.
- RSVP và lời chúc là dữ liệu cá nhân. Chỉ quản trị viên có thể xem RSVP; lời chúc cần duyệt trước khi hiển thị.

Xem [tài liệu cấu trúc](docs/CAU_TRUC_DU_AN.md) để biết vị trí mã nguồn và cách mở rộng.
