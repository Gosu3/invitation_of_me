# Initial Review — thiệp cưới, 26/09/2026

Báo cáo được hoàn thành trước khi sửa source. Baseline: `main`, commit `7bcbc37`; working tree sạch khi bắt đầu. Không thay đổi dữ liệu Supabase, không commit/push/deploy trong đợt review này.

## 1. Project Overview

- Next.js 16.3.5 App Router, React 19, TypeScript strict, build bằng Turbopack. Đã đọc hướng dẫn Route Handler đi kèm phiên bản Next đang cài.
- Server Components tải nội dung thiệp, metadata và kiểm tra quyền; `InvitationExperience` là ranh giới client điều khiển mở thiệp, nhạc, cuộn và popup.
- Supabase: Postgres, Auth, Storage, Realtime. Các route quản trị gọi `requireAdmin`; service-role dùng phía server. Proxy làm mới phiên đăng nhập, không thay thế kiểm tra quyền ở API.
- Nội dung từ DB được map sang `Invitation`, rồi `createWeddingConfig`. Có dữ liệu demo và ảnh dự phòng trong repo. Hai thiệp nhà trai/nhà gái dùng cùng trải nghiệm, khác dữ liệu.
- CSS toàn cục gồm nhiều lớp override theo thứ tự import; hero còn dùng CSS Module. Animation bằng CSS và React/timer/RAF, không dùng thư viện carousel hay motion bên ngoài.
- Ảnh local và `next/image`; ảnh `/api/media/*` bỏ qua optimizer và lấy từ Storage. Nhạc là 5 MP3 local, shuffle bag lưu localStorage. Không tự khôi phục bài nhạc đã bị xóa.
- Vercel là đích triển khai hiện có. Review chạy production build trên local cổng 3001; không xuất bản.

## 2. Current Project Structure

| Khu vực | Vai trò |
| --- | --- |
| `src/app/layout.tsx`, `page.tsx` | Font, thứ tự stylesheet, metadata gốc và kho mẫu công khai |
| `src/app/thiep/[slug]` | Trang thiệp, query tên khách, Open Graph image |
| `src/app/m/[code]` | Link ngắn cá nhân hóa, kiểm tra trạng thái xuất bản |
| `src/app/quan-tri` | Đăng nhập, dashboard, editor, xem trước |
| `src/app/api/admin` | CRUD thiệp/media, link mời, phản hồi, moderation, CSV |
| `src/app/api/rsvp`, `wishes`, `media` | Nhận phản hồi/lời chúc, danh sách lời chúc, phục vụ ảnh |
| `src/components/invitation-experience.tsx` | Trình tự section, state mở thiệp, auto-scroll, dock |
| `src/components/wedding` | Hero, khung thông tin, album, quà, modal, decorations, nhạc |
| `src/hooks` | Nhạc, swipe, khóa cuộn body |
| `src/lib` | Types, schema validation, Supabase, mapper/config/theme, QR, submission |
| `public` | 52 file, tổng khoảng 52.94 MiB trên đĩa; không phải dung lượng tải lần đầu |
| `supabase/migrations` | 14 migration: schema/RLS/RPC, seed và thay đổi riêng từng thiệp |
| `scripts`, `docs`, `STUDY.md` | Chuẩn bị ảnh, tài liệu tiếp tục công việc và lịch sử thiết kế |

Luồng chính: URL → server tải DB/demo → map dữ liệu → config → envelope → opening phases → hero/lễ cưới/album/tiệc/lịch/map/timeline/guestbook/quà → API có validation và rate limit cho form.

## 3. Feature Map

| Feature | Component / file điều khiển |
| --- | --- |
| Mở đầu, tên khách, dấu tim, hoa trái/phải | `wedding/envelope-intro.tsx`, `hero-cover.module.css` |
| Opening, auto-scroll, chạm pause/play, dock | `invitation-experience.tsx` |
| Bìa ảnh, tên đôi, thông tin gia đình/lễ cưới | `WeddingHero`, `FamilyCeremonySection` trong `wedding/sections.tsx` |
| Tiệc, lịch tháng, countdown, RSVP modal | `ReceptionSection`, `Countdown`, RSVP trong `sections.tsx` |
| Địa điểm, Google Maps, dress code | `VenueSection` trong `sections.tsx` |
| Lịch trình, icon gate/cake/water | `TimelineSection` trong `sections.tsx` |
| Album 7 ảnh, CoverFlow, prev/next, dots, hold | `WeddingGallery` trong `wedding/gallery.tsx` |
| Lightbox, keyboard, swipe, thumbnails | `GalleryLightbox`, `hooks/use-swipe.ts` |
| Hoa, paper, petals, layering | `wedding/decorations.tsx`, `lib/wedding-theme.ts`, các stylesheet wedding |
| Guestbook, gợi ý lời chúc, cập nhật realtime | `GuestbookSection`, `wishes/route.ts`, `wedding-wish-groups.ts` |
| Quà, mini gift bay, sao/confetti, QR | `wedding/gift.tsx`, CSS, `lib/wedding-qr.ts` |
| Modal, Escape/focus, khóa cuộn | `wedding/shared.tsx`, `use-body-scroll-lock.ts` |
| Random nhạc, retry bài lỗi, pause/play | `use-wedding-music.ts`, `wedding-playlist.ts`, `music-controller.tsx` |
| Tạo link ngắn riêng từng khách | `admin-dashboard.tsx`, API `guest-links`, trang `/m/[code]` |
| Quản trị, CSV, media, moderation | `admin-editor.tsx`, `admin-responses.tsx`, các admin API |

## 4. Issues Found

Mức độ là mức ảnh hưởng, không phải mức rủi ro khi sửa. “Code xác nhận” không đồng nghĩa đã tái hiện trên production.

### CRITICAL

Chưa tìm thấy vấn đề đủ bằng chứng để xếp critical. Điều này không phải chứng nhận an toàn tuyệt đối.

### HIGH

1. **Thu hồi xuất bản có thể vẫn hiện thiệp demo.** `src/lib/invitations.ts:76` trả localFallback khi query không thấy bản published hoặc có lỗi. Với slug demo `tho-va-tham`, draft/archived/deleted có thể vẫn hiện nội dung dự phòng. Editor lại thông báo thu hồi sẽ làm link công khai ngừng hoạt động. Code xác nhận; chưa thao tác thu hồi dữ liệu thật. Cần tách chế độ demo không cấu hình DB khỏi trường hợp DB không tìm thấy. Không tự sửa vì thay đổi chính sách fallback ảnh hưởng tính sẵn sàng.

2. **CSV có thể bị ứng dụng bảng tính hiểu là công thức.** `src/app/api/admin/invitations/[id]/rsvps.csv/route.ts:4` chỉ escape dấu nháy CSV. Tên/lời nhắn từ khách bắt đầu bằng `=`, `+`, `-`, `@` vẫn được xuất nguyên. Quoting CSV không biến công thức thành text. Đề xuất bảo vệ riêng bước export, không sửa dữ liệu lưu và không đổi UI.

### MEDIUM

3. **Cache shuffle sai cấu trúc chặn mở thiệp.** `use-wedding-music.ts:108–114`: JSON hợp lệ với signature đúng nhưng `remainingIds: null`/object sẽ lỗi `.filter()`. `openInvitation()` gọi `playRandom()` trước khi đổi phase, nên lỗi đồng bộ làm nút mở không tiến tiếp. Đề xuất kiểm tra shape và quay về queue mới; giữ thuật toán/random/timing hiện có.

4. **Thiệp nhà gái có địa điểm rỗng nhưng schema bắt buộc.** Migration `202609250008_remove_bride_reception_venue_title.sql` chủ động đặt `venue=''`; `lib/validation.ts:25` lại yêu cầu ít nhất một ký tự. Editor giữ nguyên dữ liệu rỗng khi lưu. Có xung đột rõ trong repo, chưa thử lưu thiệp production. Cần xác định quy tắc field optional/required trước khi thay schema và label.

5. **Hold album có thể không tự chạy lại nếu thả chuột ngoài nút.** `gallery.tsx:42,81,85,87` tạm dừng khi pointerdown nhưng chỉ nhận pointerup/cancel trên target; không có pointer capture hoặc release listener toàn cục. Đây là đường lỗi theo event flow; cần test thao tác kéo-thả thực tế trước khi sửa. Không đổi tốc độ/transform CoverFlow để xử lý vấn đề này.

6. **Tên khách dài bị cắt trên mobile.** `.cover-invite>strong` nowrap/max-width; thử tên dài 60 ký tự tại 320px: text scrollWidth 572px, clientWidth 216px. Document không tràn ngang vì ancestor cắt overflow, nhưng text không vừa khung. Chỉ report: wrap/auto-size sẽ thay thiết kế.

7. **Các request quản trị chưa xử lý network rejection đầy đủ.** `admin-editor.tsx` có reorder/delete/duplicate/loadResponses/moderation không bọc catch. Reorder cập nhật local trước khi batch PATCH hoàn thành và không rollback nếu lỗi, dễ hiển thị thứ tự chưa lưu. Cần thử riêng bằng mock, không dùng dữ liệu thật.

8. **Copy thất bại có thể bị báo thành lỗi tạo link.** `admin-dashboard.tsx` tạo link và copy nằm chung try/catch. Nếu clipboard bị từ chối, link đã tồn tại nhưng UI có thể vừa báo thành công vừa báo lỗi. Không nên retry POST chỉ vì clipboard lỗi.

9. **QR generation có promise chưa catch.** `gift.tsx:42` gọi `getBankQrDataUrl().then(...)` không catch. Trường hợp QR tùy cấu hình bị lỗi có thể sinh unhandled rejection. Hiện hai QR trống là yêu cầu hợp lệ, không phải lỗi.

10. **Save thiệp + admin title chưa atomic.** RPC lưu nội dung rồi mới UPDATE `admin_title`; nếu bước thứ hai fail, API trả lỗi dù bước đầu đã lưu. Không refactor transaction/migration trong batch giao diện.

11. **RLS cần kiểm tra quyền theo cột.** Migration core cho anon đọc hàng lời chúc approved; bảng có `submitter_hash`. RLS theo hàng không tự ẩn cột. API công khai đã select field giới hạn, nhưng cần kiểm tra grants/view trên DB live để biết direct REST có đọc thêm được hay không. Chưa chứng minh dữ liệu production bị lộ; không tự đổi policy.

### LOW

12. Lint cảnh báo ternary dùng như statement tại `gallery.tsx:81`; đổi thành if/else tương đương, giữ nguyên callback/DOM.
13. Alias `/thiep/tho-va-tham-nha-gai` redirect sang `/thiep/tham-va-tho` bỏ query tên khách; cần giữ query nếu vẫn chia sẻ alias.
14. Route link ngắn chưa có Open Graph image như route slug. Không tự thêm nội dung/metadata mới.
15. Trang chủ `listInvitations()` map không kèm events, nên ngày thẻ có thể luôn là “Ngày cưới” với DB. Không tự thay nội dung.
16. Editor nói lời chúc phải duyệt, nhưng API hiện insert `approved`. Cần đồng bộ mô tả theo business behavior đã chọn, không tự chuyển về pending.
17. Timer trạng thái “đã copy” ở gift/dashboard chưa cleanup; ảnh hưởng nhỏ, chưa thấy leak dài hạn.

## 5. Performance Opportunities

- Sáu global stylesheet có tổng khoảng 195 KB source, 238 lần `!important`. Đây là lịch sử override, không phải bằng chứng có thể xóa an toàn. Không gộp hoặc đổi thứ tự import.
- Có 9 font families, 19 font-weight/style imports ở root. Mỗi family đều có reference trong source/CSS; không kết luận unused chỉ vì trang đang kiểm tra chưa dùng. Font CSS dùng unicode ranges; số import không bằng số file font tải thật.
- Một số PNG trang trí 1.7–2.65 MB/file; audio khoảng 2.9–3.6 MB/file. Ví dụ `paper02.png` 2.65 MB, các thumbnail trang chủ khoảng 2.5 MB. Ưu tiên đo bytes thực tế trước khi đề xuất variant; không resize/compress asset gốc.
- Nhạc `preload=none` và chỉ play sau click là điểm tốt. Không preload tất cả MP3 để “fix random”.
- Guestbook có realtime **và** polling 5 giây; một tab mở liên tục có thể tạo khoảng 12 request/phút chưa kể broadcast. API trả tối đa 1000 lời chúc, render hai bản để chạy ticker. Polling hiện là đường hồi phục mất broadcast; không xóa đơn thuần. Có thể đo và thêm backoff khi realtime ổn định ở batch riêng.
- `getInvitation()` được gọi từ metadata và page, không có wrapper React cache như `/m`. Có thể thử request memoization và đo query count; chưa khẳng định bao nhiêu query bị lặp vì fetch/cache của SDK cần đo.
- Lightbox preload ảnh gốc trong khi ảnh local hiển thị qua optimizer có thể tải cả hai biến thể. Gift chính ở cuối trang đang priority. Đổi loading strategy cần network trace và kiểm tra lần mở đầu popup/album; chỉ đề xuất.
- Animation chủ yếu transform/opacity, có filter/drop-shadow/blur và nhiều lớp hoa. Không bỏ will-change, blur, shadow hay đổi timing nếu chưa có profile CPU/GPU.
- Countdown state nằm tại component riêng; cleanup interval/RAF/IntersectionObserver có sẵn ở các luồng chính. Không rải memo/useMemo hàng loạt.
- Chưa có Lighthouse/Web Vitals/trace mạng dưới throttling: không đưa ra điểm số hay hứa phần trăm cải thiện.

## 6. Code Quality Opportunities

- Ưu tiên guard dữ liệu biên và lỗi async, thay vì chia nhỏ component/CSS chỉ vì dài.
- `sections.tsx` và editor dày, nhiều dòng JSX dài: có thể tách logic thuần khi có nhu cầu thực tế, giữ nguyên DOM/class; chưa cần rewrite.
- Phân biệt lỗi DB, not-found, dữ liệu demo, relation query lỗi; hiện nhiều trường hợp thành mảng rỗng/dữ liệu dự phòng nên khó chẩn đoán.
- Admin đã kiểm tra auth trên route; input dùng Zod, React render text, không tìm thấy `dangerouslySetInnerHTML`/eval trong source. Upload dùng xử lý ảnh server; API xóa media **có** kiểm tra lỗi Storage và ảnh đang được dùng làm cover/QR.
- Không tìm thấy secret theo các mẫu token/JWT phổ biến trong các file text tracked đã quét. `.env.local` ignored; chỉ `.env.example` tracked. Đây là scan giới hạn, không audit toàn bộ git history hoặc chứng nhận không có secret.
- `npm audit` thành công: 0 advisory được báo cho dependency tree hiện tại. Không upgrade/uninstall package.

## 7. Potential Dead Code — chỉ liệt kê

- `FloralDecoration`, `FloralDivider` trong `wedding/shared.tsx`: search repo chưa thấy nơi gọi ngoài định nghĩa. Giữ lại để kiểm tra ý định tái dùng.
- Nhóm selector cũ `.album-viewport`, `.album-thumbnails`, `.present-*`, `.letter-caption`, `.letter-scroll` cần kiểm tra coverage qua mọi route/biến thể trước khi xóa. CSS override không đồng nghĩa dead code.
- API hook nhạc còn volume/mute/next/previous/loop dù UI hiện chỉ toggle play/pause. Chưa xóa vì có thể là khả năng tái sử dụng và ảnh hưởng logic hook.
- Không có dependency đủ bằng chứng để khuyến nghị gỡ ngay. Không xóa asset chỉ vì không xuất hiện trong một màn hình.

## 8. Risk Areas và baseline verification

**Giữ nguyên:** thứ tự section; màu xanh/paper; font/spacing/line-height; hoa và stacking; kích thước ảnh/album; `translateX/Z`, `rotateY`, opacity; animation opening/quà/petals; responsive; tên/nội dung riêng từng thiệp; hai QR trống.

| Baseline check | Kết quả |
| --- | --- |
| `npm run lint` | Pass exit 0, 1 warning `no-unused-expressions` trong album |
| `npm run typecheck` | Pass |
| `npm run build` | Pass, compile + TypeScript + route generation |
| Test framework/script | Chưa có test script trong package.json |
| `npm audit --json` | 0 vulnerabilities; lần đầu bị giới hạn mạng, retry quyền mạng thành công |
| Mở thiệp local production | Mở được, phase chuyển sang nội dung, tên tiếng Việt đúng |
| Nhạc | Bắt đầu sau mở; nút pause chuyển về “Phát nhạc” |
| Album | 7 ảnh; next đổi active 1→2; mở lightbox; Escape đóng |
| RSVP | Popup mở; nhập tên nháp nhưng không gửi; input computed 16px ở 320px |
| Gift | Popup mở, hai placeholder QR; Escape đóng |
| Console | Không có warn/error trong lần mở/kiểm tra ban đầu |
| Responsive DOM | Đã đo 320, 360, 375, xấp xỉ 390 (391 do zoom/rounding), 393, 414, 430, 768, 1440 CSS px; không thấy document rộng hơn viewport |

Album container tương ứng: 300, 340, 355, 360, 360, 360, 360, 748, 780px. Bản đồ: 230, 265, 270, 270, 270, 270, 270, 520, 520px. Đây là số đo baseline, không phải kích thước đề xuất.

**Giới hạn kiểm chứng:** browser desktop Chromium với viewport thay đổi, không phải iPhone/Safari thực hoặc Chrome Android. Không mô phỏng bàn phím iOS, pinch/hold thật, background audio, reduced-motion OS hoặc mạng di động. Screenshot tab nền không cho bằng chứng hình ảnh ổn định; không khẳng định đã pixel-diff hay kiểm tra mọi góc hoa bằng ảnh. Cần visual QA trên điện thoại thật trước những thay đổi CSS/animation. Chưa đăng nhập/ghi dữ liệu admin, chưa gửi RSVP/lời chúc thật, chưa quét quyền production trực tiếp. QR thật và tải QR chưa test vì baseline để trống.

SEO: có `lang=vi`, title/description và OG riêng route slug; `noindex` trên thiệp được giữ vì tính riêng tư. Không thấy favicon/canonical/theme-color riêng trong các entry đã rà; chỉ đề xuất xác định nhu cầu. Link ngắn không phải cơ chế authentication; không tự tăng độ dài khi người dùng đã yêu cầu link ngắn.

## 9. Optimization Plan

### Phase A — zero-risk optimization (mục tiêu rủi ro tối thiểu, không cam kết tuyệt đối)

Ghi baseline và regression checks. Đổi đúng một ternary statement sang if/else để hết warning; không đổi DOM, callback timing, CSS hoặc asset.

### Phase B — low-risk optimization / bug fixes

1. Validate shape shuffle localStorage, reset queue khi hỏng. Test malformed/null/mixed data, storage denied, queue không lặp, đổi playlist. Không đổi thuật toán chọn bài/timing.
2. Vô hiệu hóa formula ở CSV export. Test dữ liệu nguy hiểm, Unicode, nháy kép/xuống dòng, BOM, auth và lỗi DB. Không chỉnh bản ghi thật.
3. Các lỗi khác (venue rỗng, clipboard/QR async, pointer release) cần regression riêng trước khi áp dụng; không gộp vào batch đầu.

### Phase C — optional optimization

Đo network/profile trước: guestbook fallback polling, request memoization, font CSS, lightbox preload, ảnh lớn. Kiểm tra Safari/Android thật; thống nhất fallback khi DB lỗi/thu hồi, semantics tên khách dài và metadata link ngắn. Review RLS live riêng, không tự triển khai migration bảo mật.

### Phase D — không khuyến nghị thay đổi

Không thay carousel, framework, motion library, strategy CSS/routing/image pipeline; không restructure DOM/absolute positioning, không gộp stylesheet, không giảm chất lượng ảnh; không xóa dependency/asset theo phỏng đoán; không đổi timings để tăng benchmark.

Sau báo cáo này chỉ thực hiện batch A/B có phạm vi hẹp nêu trên, kiểm tra lại rồi ghi Final Review. Mọi đề xuất khác giữ trạng thái chưa áp dụng.
