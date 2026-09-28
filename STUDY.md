# Bản ghi nhớ dự án Nét Duyên

Tài liệu này là điểm bắt đầu khi tiếp tục dự án trên máy công ty hoặc máy ở nhà. Hãy đọc `STUDY.md`, `AGENTS.md` và `README.md` trước khi sửa mã. Mục tiêu hiện tại là một website quản lý nhiều thiệp cưới bằng **một mẫu thiệp Hoa Mộc Xanh**; mỗi thiệp mang dữ liệu riêng. Không tạo một template khác khi chủ dự án chỉ yêu cầu chỉnh mẫu hiện có.

## Mục tiêu thiết kế đã thống nhất

- Thiệp `/thiep/tho-va-tham` dùng tone xanh lá trầm, trắng ngà, hoa xanh trắng. Cảm hứng về bố cục, tỷ lệ khung, chữ và album từ [Minimalism Đỏ Đậm](https://chungdoi.com/vi/mau-thiep/minimalism-do-dam/demo), nhưng không đổi sang màu đỏ. Tham khảo thêm [Hoa Mộc Xanh](https://chungdoi.com/vi/mau-thiep/hoa-moc-xanh/demo) cho tinh thần hoa và phong bì.
- Phần đầu có phong bì, ảnh cưới và nhiều lớp hoa cân đối; nút mở tạo hiệu ứng bung hoa. Sau đó là lời mời, khung lễ cưới, album trượt ngang, khung tiệc cưới **chứa cả lịch tháng và đếm ngược**, RSVP, địa điểm, khung lịch trình, lời chúc, hộp quà và lời cảm ơn.
- Hai khung lễ cưới/tiệc cưới khoảng 560px trên desktop, nền giấy xanh trầm với hoa trắng; lịch trình dùng nền giấy ghi chú. Không để chữ đè lên cụm hoa. Album là carousel ngang nhỏ, ảnh đứng, ảnh giữa nổi bật, có mũi tên và chấm điều hướng; nhấn ảnh mở lightbox.
- Font đo từ F12 của mẫu đỏ đậm: nhãn `THÔNG TIN LỄ CƯỚI` là Times New Roman serif, 16px/24px, đậm, giãn chữ 0.48px; tên cô dâu/chú rể dùng `Viaoda Libre` khoảng 46px/60px trên mẫu gốc. Trong dự án font đã được cài bằng `@fontsource/viaoda-libre`, và cỡ được giảm phù hợp với tên tiếng Việt dài. Card mẫu gốc khoảng 560 × 848px, padding 36px 20px 40px, bo góc 13px; đây là tham chiếu thị giác, không phải kích thước cứng cho mọi nội dung.
- Hoa và giấy dùng trên web đã được commit trong `public/decor/hoa-moc-xanh/` và `public/assets/wedding/`. Máy khác không cần thư mục ảnh OneDrive để chạy dự án.

## Nội dung hiện tại

- Tên trên bìa: **Văn Thọ & Hồng Thắm**. Tên đầy đủ trong khung lễ cưới: **Nguyễn Văn Thọ** và **Trương Thị Hồng Thắm**.
- Tên cha mẹ, địa chỉ, ngày giờ và lịch trình hiện đã được cập nhật trong dữ liệu production; `src/lib/demo.ts` là dữ liệu xem thử khi không kết nối Supabase.
- Thiệp nhà trai dùng slug `tho-va-tham`; thiệp nhà gái dùng slug `tham-va-tho`. Hai thiệp đồng bộ lời chúc và giữ RSVP riêng.
- Hộp quà có hai ảnh QR chính thức trong `public/assets/wedding/qr/`, hỗ trợ lưu hoặc chia sẻ trên mobile. Không ghi số tài khoản hoặc khóa bí mật vào tài liệu.
- Nhạc nền dùng playlist MP3 trong `public/music/`, chỉ bắt đầu sau thao tác mở thiệp và lưu hàng đợi shuffle hợp lệ trong localStorage.

## Đường đi của mã

| Nhu cầu | Tệp chính |
|---|---|
| Dữ liệu mẫu, tên, ngày và địa điểm | `src/lib/demo.ts` |
| Chuyển dữ liệu thiệp thành cấu hình hiển thị, feature flags | `src/lib/wedding-config.ts` |
| Bảng màu, đường dẫn asset | `src/lib/wedding-theme.ts` |
| Thứ tự các phần và trạng thái mở thiệp, modal | `src/components/invitation-experience.tsx` |
| Bìa/phong bì và hiệu ứng mở | `src/components/wedding/envelope-intro.tsx` |
| Lời mời, lễ cưới, tiệc cưới + lịch, timeline | `src/components/wedding/sections.tsx` |
| Carousel và lightbox | `src/components/wedding/gallery.tsx` |
| Hộp quà, QR và tải/chia sẻ ảnh | `src/components/wedding/gift.tsx`, `src/app/api/qr-download/[role]/route.ts` |
| Nhạc và nút điều khiển | `src/hooks/use-wedding-music.ts`, `src/components/wedding/music-controller.tsx` |
| CSS thiệp và responsive | `src/app/invitation-motion.css`, `wedding-composition.css`, `wedding-typography.css`, `wedding-mobile.css`, `mobile-forms.css` |
| Form quản trị và API/Supabase | `src/components/admin-editor.tsx`, `src/app/api/`, `src/lib/invitations.ts`, `supabase/migrations/` |

`README.md` chỉ dẫn cài đặt, cấu hình Supabase và triển khai; `docs/CAU_TRUC_DU_AN.md` mô tả luồng dữ liệu. `docs/PHAN_TICH_HOA_MOC_XANH.md` lưu phân tích mẫu ban đầu. Lưu ý các tài liệu cũ có thể mô tả CSS và cấu trúc component trước khi tách thành `src/components/wedding/`; kiểm tra mã hiện tại nếu có khác biệt.

## Cách tiếp tục trên máy khác

1. Clone `https://github.com/Gosu3/invitation_of_me`, checkout `main`, chạy `npm ci` bằng Node.js 20.9+ (khuyến nghị Node 22/24).
2. Sao chép `.env.example` thành `.env.local` nếu cần kết nối Supabase. **Không commit hoặc dán khóa bí mật vào chat.** Chưa có biến môi trường thì xem demo tại `http://localhost:3000/thiep/tho-va-tham` sau `npm run dev`.
3. Trước khi sửa Next.js, đọc hướng dẫn tương ứng trong `node_modules/next/dist/docs/` như `AGENTS.md` yêu cầu; dự án dùng Next.js 16.3.5, React 19.2.
4. Kiểm tra `git status` và các thay đổi chưa commit trước khi chỉnh. Sửa dữ liệu ở lớp dữ liệu, không hardcode tên/ngày trong CSS. Giữ phần quản trị và các thiệp khác hoạt động.
5. Sau khi sửa: `npm run typecheck`, `npm run lint`, `npm run build`; mở demo trên desktop và điện thoại, thử mở thiệp, album, popup quà, play/pause/mute, lịch và các link. Chỉ commit/push khi kiểm tra xong và được yêu cầu.

## Kế hoạch tiếp theo

1. Khi có thông tin thật: cập nhật tên cha mẹ, ngày âm/dương, giờ đón khách/khai tiệc, địa chỉ, bản đồ, lịch trình và lời mời; đối chiếu từng dữ kiện với chủ dự án.
2. Nhận hai bộ thông tin ngân hàng/QR và ảnh chính thức; thay placeholder trong dữ liệu thiệp qua quản trị hoặc demo theo môi trường. Không sinh QR từ thông tin chưa xác nhận.
3. Kiểm tra màn hình nhỏ thực tế, độ tương phản chữ, cắt ảnh album và âm thanh trên trình duyệt điện thoại; tinh chỉnh nhẹ mà vẫn giữ nhịp giấy/hoa hiện tại.
4. Nếu đưa lên production, cấu hình Supabase và Vercel theo `README.md`, kiểm tra migration, bảo mật, RSVP/lời chúc và backup trước khi công bố đường dẫn.

## Prompt khởi động cho lần làm việc sau

> Hãy đọc `STUDY.md`, `AGENTS.md`, `README.md` và kiểm tra `git status` trong repo `invitation_of_me`. Đây là dự án thiệp cưới Nét Duyên dùng một template Hoa Mộc Xanh; giữ tone xanh trắng và bố cục giấy/hoa lấy cảm hứng từ mẫu Minimalism Đỏ Đậm. Xem trang `/thiep/tho-va-tham` trên desktop và mobile, rồi thực hiện yêu cầu mới của tôi trong đúng cấu trúc hiện có. Không suy đoán thông tin cưới thật hoặc tài khoản ngân hàng; hai QR đang để trống. Chạy typecheck, lint, build và kiểm tra thao tác chính trước khi kết thúc. Nếu tôi yêu cầu, commit và push thay đổi lên `main`.
