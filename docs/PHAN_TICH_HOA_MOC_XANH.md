# Phân tích mẫu Hoa Mộc Xanh và cách triển khai

Đối chiếu ngày 21/09/2026 với [trang mẫu](https://chungdoi.com/vi/mau-thiep/hoa-moc-xanh/demo), HTML người dùng cung cấp (`pasted-text.txt`), và ba ảnh trong thư mục `OneDrive/Hình ảnh/images_invitation`.

## 1. Phần đọc được từ source

HTML cho thấy đây là ứng dụng React/Next.js: có `/_next/static`, các chunk JavaScript, payload `self.__next_f`, stylesheet và tên class scoped `jsx-…`. Những chuỗi class như `fixed inset-0`, `md:…`, `rounded-lg` là dấu hiệu sử dụng utility CSS. Không thể suy ra toàn bộ source React, backend hay thư viện animation chỉ từ HTML đã render.

`data-theme="halloween"` ở thẻ HTML thuộc giao diện nền tảng, không phải bảng màu thiệp Hoa Mộc Xanh. Màu thiệp được khai báo trực tiếp trong style của thiệp.

| Chi tiết | Bằng chứng trong HTML / giao diện |
| --- | --- |
| Nền màn mở thiệp | Gradient `#1a3005 → #0f2003 → #081500` |
| Chữ và nút chính | `#30530F` |
| Màu phụ / đường kẻ | `#6B8040` |
| Màu sáng | `#FFFAF7` |
| Lá rơi | `#c8dfa0`, `#a5c862`, `#8bc34a`; vị trí, delay và thời lượng riêng từng lá |
| Font tiêu đề | `Playfair Display`, dự phòng Baskerville/Times New Roman |
| Font nội dung | `Lora`, dự phòng Times New Roman |
| Font preload của trang | `/fonts/Pattaya-Regular.woff`; không đồng nghĩa font này dùng cho mọi tiêu đề |
| Hoa | `/images/themes/boho-floral-green/flower.webp`, nhiều bản sao absolute, opacity và xoay khác nhau |
| Mở thiệp | Link `?open=1`; chuyển sang nội dung sau tương tác |
| Seal | Vòng tròn xanh có tim, gradient, shadow và `seal-pulse` |
| Nút mở | Bo tròn, bóng đổ và vệt sáng `shine` |
| Lá rơi | `ambient-fall`, thời lượng và độ lệch ngang riêng từng phần tử |

Danh sách đầy đủ URL script, stylesheet, ảnh `<img>`, màu hex và tên animation inline trích từ HTML nằm trong [hoa-moc-xanh-assets.json](./hoa-moc-xanh-assets.json). Danh sách này cũng chứa tài nguyên nền tảng, không phải tất cả đều cần cho thiệp.

Phần HTML gửi kèm chủ yếu chứa màn thiệp đóng và payload Next.js. Trình duyệt mở được phần nội dung; công cụ tải bundle JavaScript trực tiếp bị giới hạn kết nối. Do vậy chưa xác nhận được thuật toán gốc của hiệu ứng bung hoa, thư viện slider, hoặc mã popup từ bundle; phần tương tác trong dự án được viết lại độc lập.

## 2. Bố cục quan sát được trên trang mẫu

1. Thiệp mở đầu: nền rừng tối, giấy kem, hai góc hoa, tên hai người, ngày cưới, lời mời, nút mở.
2. Nội dung có ảnh chân dung đóng khung hơi nghiêng, hoa lớn ở góc, dải hoa nền xanh.
3. Thông tin hai gia đình và lễ thành hôn.
4. Album ảnh; trạng thái quan sát hiển thị bốn ảnh cùng số ảnh còn lại.
5. Thông tin tiệc, giờ đón khách, lịch tháng, ngày được đánh dấu và thêm vào Google Calendar.
6. Xác nhận tham dự, địa điểm và đường dẫn chỉ đường.
7. Lịch trình, sổ lời chúc, hộp quà, lời cảm ơn.
8. Có nút nhạc nền và widget chat của nền tảng. Không có file nhạc do người dùng cung cấp nên bản chỉnh sửa chưa thêm nhạc. Widget chat, quảng cáo, analytics, script thanh toán không thuộc thiệp của dự án.

Không dùng dữ liệu gia đình, ảnh cặp đôi hay tài khoản ngân hàng của demo làm thông tin của Văn Thọ & Hồng Thắm.

## 3. Tài nguyên của người dùng đã dùng

Đường dẫn thực tế tìm được là `images_invitation`, không phải `images/_invitation`.

| File trong `public/decor/hoa-moc-xanh/` | Kích thước | Vai trò |
| --- | --- | --- |
| `boho_floral_green.webp` | 420 × 604, có alpha | Phong bì trong lớp mở đầu nội dung |
| `flower.webp` | 1800 × 1800, có alpha | Góc hoa, bó hoa, sáu lớp bung hoa |
| `decoration_bar.webp` | 3304 × 421 | Nền dải hoa cho các section xanh |

Ảnh cưới giữ bộ ảnh `/photos/wedding-*.webp` đang có. Font giữ Noto Serif và Be Vietnam Pro đã cài cục bộ, giúp hỗ trợ tiếng Việt và không cần tải font mạng; kiểu serif tương tự nhưng không trùng tuyệt đối với mẫu.

## 4. Cấu trúc code sau chỉnh sửa

```text
InvitationExperience
├── FallingPieces                 lá / tim rơi trang trí
├── Cover gate                    giấy kem + hoa + nút mở
│   └── Bloom burst               6 lớp hoa tỏa hướng, 1.5 giây
├── Letter story                  ảnh phong bì + giấy + ảnh cưới + bó hoa
├── Lời mời / gia đình / sự kiện
├── Calendar + Countdown
├── WeddingAlbum                  slider, thumbnail, tự chạy, vuốt
├── Địa điểm / dress code / lịch trình
├── RSVP / lời chúc               giữ API và dữ liệu hiện có
├── GiftBox                       rung nhẹ, nơ, nắp bật mở, ngôi sao
├── Footer + thanh điều hướng nổi
├── PhotoLightbox                 dialog xem ảnh
└── GiftDialog                    dialog tài khoản / hai ô QR chờ
```

- `src/components/invitation-experience.tsx`: ghép các section, điều khiển mở thiệp, dùng dữ liệu `Invitation`.
- `src/components/invitation-interactions.tsx`: tách slider, modal, lightbox, hộp quà.
- `src/app/invitation-motion.css`: bảng màu scoped `.botanical-theme`, bố cục responsive, keyframes. Không thay màu toàn bộ trang quản trị.
- `src/lib/demo.ts`: bật hộp quà cho thiệp mẫu; tài khoản vẫn là mảng rỗng, dress code tương ứng bảng màu xanh.

## 5. Các hiệu ứng đã làm

| Thành phần | Cách triển khai |
| --- | --- |
| Mở thiệp bung hoa | Chữ mờ đi; hai nhánh hoa tách ra; sáu lớp hoa xoay 60° cách nhau, tỏa ra và mờ; nội dung thiệp xuất hiện sau 1.5 giây |
| Phong bì và ảnh | Xếp lớp absolute, ảnh xoay 9°, giấy xoay -7°, ảnh xuất hiện từ dưới, bó hoa đung đưa nhẹ |
| Hiện nội dung theo cuộn | IntersectionObserver, opacity + translateY; hiện một lần |
| Album | Track flex dịch `translateX`, chuyển 650 ms, tự chạy mỗi 4.5 giây khi nhìn thấy; dừng khi hover, focus, mở dialog hoặc tab bị ẩn |
| Điều khiển album | Mũi tên, thumbnail, phím trái/phải, vuốt ngang, bật/tắt tự chạy |
| Lightbox | Native dialog; ảnh contain; nút/phím/vuốt chuyển ảnh; Escape; khóa cuộn nền và trả focus |
| Hộp quà | CSS dựng thân hộp, nắp, nơ, tag tim; rung mỗi 4 giây; bật nắp 480 ms khi nhấn rồi mở popup |
| Popup QR | Backdrop mờ, card zoom/fade, hai ô trống Chú rể/Cô dâu; tài khoản cấu hình sẽ hiện QR, tên ngân hàng/chủ tài khoản, số tài khoản và nút sao chép |
| Lịch / countdown | Ngày có tim nhịp nhẹ; đếm theo ngày cưới của dữ liệu, không theo ngày của trang mẫu |
| Giảm chuyển động | Tôn trọng `prefers-reduced-motion`: không bung hoa, không lá rơi, không tự chạy album; mở trực tiếp |

Các component dialog dùng `<dialog>.showModal()` để khóa focus trong popup. Dùng Escape, click vùng ngoài hoặc nút đóng; khi đóng trả focus về nút mở. Nút sao chép xử lý lỗi clipboard.

## 6. Bổ sung QR sau này

Theo yêu cầu, hiện để trống hai ô QR, không tạo QR giả hoặc điền ngân hàng mẫu.

Trong quản trị: tải ảnh QR ngân hàng lên phần ảnh → mở mục **07 · Hộp quà mừng** → bật hiển thị → thêm tài khoản Chú rể/Cô dâu → nhập ngân hàng, số tài khoản, chủ tài khoản → chọn ảnh QR đã tải lên → lưu thiệp.

Nếu đang chạy demo không có Supabase, chỉnh `gifts` của thiệp trong `src/lib/demo.ts`, theo kiểu `GiftAccount` trong `src/lib/types.ts`. `qrUrl` có thể trỏ tới ảnh cục bộ trong `public`. Không tạo QR thanh toán chỉ bằng cách mã hóa số tài khoản như một chuỗi văn bản; hãy dùng QR do ngân hàng cung cấp.

RSVP và lời chúc tiếp tục cần cấu hình Supabase như trước. Bản xem trước thông báo rõ khi chưa kết nối, không giả lập gửi thành công.

## 7. Chạy và kiểm tra

Thiệp chính: `/thiep/tho-va-tham`.

Máy hiện có wrapper `npm` trỏ nhầm đường dẫn `npm-cli.js`; có thể dùng CLI đã cài trong dự án:

```powershell
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js .
node node_modules/next/dist/bin/next build
```

Trước khi viết code đã đọc guide Next.js cục bộ về CSS, client components và ảnh theo AGENTS.md.

Kết quả kiểm tra: TypeScript, ESLint và production build đều thành công. Đã kiểm tra bằng trình duyệt: thiệp đóng/mở, chuyển ảnh, lightbox và phím mũi tên, popup hai ô QR, Escape và trả focus. Popup hiển thị đủ hai ô ở viewport 390 × 844. Chưa kiểm tra giao dịch QR thật vì người dùng yêu cầu để trống; chưa gửi RSVP/lời chúc do bản demo chưa có kết nối dữ liệu.
