# Cấu trúc dự án Nét Duyên

Tài liệu này mô tả các vị trí cần tìm khi chỉnh giao diện, dữ liệu và luồng quản trị. Thiết kế sản phẩm giữ **một template thiệp duy nhất**; mỗi thiệp là một bộ dữ liệu.

## Sơ đồ thư mục

```text
Project_Invitation/
├─ public/photos/                 Ảnh WebP chỉ dùng cho thiệp demo local
├─ scripts/prepare-photos.mjs     Chuyển ảnh nguồn thành WebP cho web
├─ src/
│  ├─ app/
│  │  ├─ globals.css              Design tokens và toàn bộ style hiện tại
│  │  ├─ layout.tsx                HTML layout và metadata mặc định
│  │  ├─ page.tsx                  Trang chủ, danh sách thiệp đã xuất bản
│  │  ├─ invitation-motion.css     Phong bì mở thiệp, hiệu ứng rơi/cuộn, lịch và đếm ngược
│  │  ├─ thiep/[slug]/             Thiệp công khai và ảnh Open Graph
│  │  ├─ quan-tri/                Đăng nhập, danh sách và biên tập thiệp
│  │  └─ api/                     RSVP, lời chúc, ảnh và thao tác quản trị
│  ├─ components/
│  │  └─ invitation-experience.tsx Template thiệp duy nhất
│  └─ lib/
│     ├─ types.ts                 Kiểu dữ liệu dùng chung
│     ├─ demo.ts                  Hai thiệp mẫu local
│     ├─ invitations.ts           Chuyển hàng DB thành dữ liệu template
│     ├─ supabase.ts              Client Supabase và kiểm tra admin
│     └─ utils.ts                 Định dạng ngày giờ và URL
├─ supabase/migrations/           SQL thêm bảng, chỉ mục, RLS
├─ .env.example                   Danh sách biến môi trường, không có khóa
└─ README.md                      Hướng dẫn chạy và triển khai
```

## Luồng dữ liệu

```text
Trang quản trị → API quản trị → Supabase PostgreSQL + Storage
                                    ↓
Khách mở /thiep/[slug] → đọc thiệp published → InvitationExperience
Khách gửi RSVP/lời chúc → API công khai → kiểm tra + giới hạn tần suất → PostgreSQL
```

Khi thiếu biến môi trường Supabase, `src/lib/invitations.ts` dùng `src/lib/demo.ts` để xem giao diện local. Khi Supabase đã cấu hình, dữ liệu thiệp đọc từ database; dữ liệu demo không được tự xuất bản lên production.

## Nơi chỉnh sửa theo nhu cầu

| Nhu cầu | Vị trí |
|---|---|
| Đổi màu, font, khoảng cách | `src/app/globals.css`, các biến `:root` |
| Đổi thứ tự hoặc cấu trúc phần thiệp | `src/components/invitation-experience.tsx` |
| Thêm trường nội dung cho thiệp | Migration SQL → `src/lib/types.ts` → `src/lib/invitations.ts` → form quản trị → template |
| Đổi nội dung demo | `src/lib/demo.ts` |
| Đổi logic hiển thị ngày giờ | `src/lib/utils.ts` |
| Đổi quyền đọc/ghi dữ liệu | `supabase/migrations/` và các route API liên quan |
| Đổi ảnh bìa/album thật | Trang quản trị; tệp được lưu trong Supabase Storage |

## Bảng dữ liệu

- `wedding_admins`: tài khoản được phép quản trị.
- `wedding_invitations`: nội dung chính, slug và trạng thái `draft/published/archived`.
- `wedding_events`: lễ cưới, tiệc cưới và địa điểm.
- `wedding_timeline_items`: lịch trình trong ngày.
- `wedding_media`: metadata ảnh và đường dẫn tệp trong Storage.
- `wedding_rsvps`: phản hồi tham dự, chỉ quản trị được đọc.
- `wedding_wishes`: lời chúc, chỉ dòng `approved` được công khai.
- `wedding_gift_accounts`: thông tin hộp quà bật/tắt theo thiệp.
- `wedding_submission_limits`: giới hạn tần suất gửi biểu mẫu.

Các bảng và chính sách được định nghĩa trong `supabase/migrations/202609210001_wedding_core.sql`. Không sửa migration đã áp dụng trên production; tạo migration mới cho lần thay đổi sau.

## Quy tắc khi mở rộng

1. Không tạo template thứ hai nếu yêu cầu sản phẩm vẫn là một mẫu duy nhất.
2. Mọi trường tùy chọn phải được ẩn gọn khi chưa có dữ liệu.
3. Không cho đường dẫn công khai đọc bản nháp hoặc nội dung quản trị.
4. Giữ ảnh gốc bên ngoài repo; ảnh `public/photos/` chỉ phục vụ demo.
5. Khi sửa schema, cập nhật kiểu dữ liệu, mapping, form và tài liệu trong cùng một thay đổi.
