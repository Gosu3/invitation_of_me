# Final Review Report — 26/09/2026

Đã hoàn thành Initial Review trước khi sửa source, sau đó áp dụng một batch hẹp gồm hai bug fix và một sửa lint tương đương. Xem `INITIAL_REVIEW_2026-09-26.md` để biết kiến trúc, feature map, findings và kế hoạch đầy đủ.

## Files changed

### `src/hooks/use-wedding-music.ts`

- **CHANGE:** Kiểm tra JSON localStorage có object, signature dạng string, remainingIds là mảng string; chỉ nhận lastId dạng string. Cache sai được bỏ qua và tạo queue mới.
- **WHY:** Cache JSON hợp lệ nhưng sai shape từng gây TypeError đồng bộ trước khi mở thiệp.
- **RISK:** LOW.
- **VISUAL IMPACT:** NONE.
- **BEHAVIOR IMPACT:** NONE với cache hợp lệ; cache hỏng được phục hồi thay vì chặn mở thiệp. Không đổi thuật toán shuffle, danh sách nhạc, âm lượng, timing hoặc thứ tự chuyển bài khi kết thúc.
- **PERFORMANCE IMPACT:** Thêm kiểm tra nhỏ trên danh sách 5 bài tại click mở; không tuyên bố tăng hiệu năng.
- **VERIFY:** Test malformed JSON/null/missing/object/string/mixed queue, storage bị chặn, playlist đổi, lọc duplicate/stale ID, hai vòng shuffle đầy đủ và không lặp ở ranh giới vòng. Browser mở thiệp và pause nhạc thành công.

### `src/app/api/admin/invitations/[id]/rsvps.csv/route.ts`

- **CHANGE:** Prefix apostrophe cho giá trị CSV bắt đầu bằng ký tự công thức hoặc tab/CR/LF, kể cả công thức có whitespace phía trước; giữ escape nháy kép như cũ.
- **WHY:** Nội dung khách nhập phải được export như text, không bị ứng dụng bảng tính hiểu thành công thức.
- **RISK:** LOW.
- **VISUAL IMPACT:** NONE trên website.
- **BEHAVIOR IMPACT:** POSSIBLE trong file CSV: các giá trị nguy hiểm có thêm dấu bảo vệ. Nội dung gốc trong DB không đổi; tên tiếng Việt/lời chúc bình thường giữ nguyên.
- **PERFORMANCE IMPACT:** Hai kiểm tra regex ngắn mỗi ô, không có thêm request/DB query.
- **VERIFY:** Test các prefix `= + - @`, whitespace/control character, Unicode, nháy kép, xuống dòng, BOM UTF-8, numeric count, header tải file, 401 khi thiếu auth, 500 khi query lỗi. Chưa mở file bằng Excel thực, chưa export dữ liệu production.

### `src/components/wedding/gallery.tsx`

- **CHANGE:** Thay ternary statement trong onClick bằng if/else cùng hai nhánh.
- **WHY:** Xử lý cảnh báo ESLint `no-unused-expressions`.
- **RISK:** LOW.
- **VISUAL IMPACT:** NONE.
- **BEHAVIOR IMPACT:** NONE. Vẫn gọi pauseAutoplay trước; ảnh active mở lightbox, ảnh khác được select.
- **PERFORMANCE IMPACT:** Không đáng kể.
- **VERIFY:** Lint sạch; browser next chuyển active, click ảnh active mở lightbox, Escape đóng. JSX attributes, class, timers và transform giữ nguyên.

### `scripts/review-regressions.test.mjs`

- **CHANGE:** 7 regression tests dùng Node test runner và TypeScript đã có trong repo; transpile source thật, mock React primitives/Audio/localStorage/Supabase boundary.
- **WHY:** Tái hiện hai lỗi trước khi sửa và giữ kiểm tra cho các lần chỉnh tiếp theo, không ghi DB thật.
- **RISK:** LOW; script chỉ chạy khi gọi rõ lệnh test, không import vào ứng dụng.
- **VISUAL IMPACT / BEHAVIOR IMPACT:** NONE trong runtime.
- **PERFORMANCE IMPACT:** Không ảnh hưởng bundle production.
- **VERIFY:** Trước fix: 5 pass, 2 fail đúng lỗi cần sửa. Sau fix: 7/7 pass. Harness không thay thế React lifecycle test hay browser test. Một dòng ESLint exception có giải thích dành riêng cho hook invocation trong harness; không tắt rule ở source hoặc toàn repo.

### Tài liệu

- `docs/INITIAL_REVIEW_2026-09-26.md`: 9 mục review trước sửa; giữ findings theo trạng thái baseline.
- `docs/FINAL_REVIEW_2026-09-26.md`: phạm vi sửa, kết quả và giới hạn kiểm chứng.
- RISK LOW; không ảnh hưởng visual/behavior/bundle.

## Bugs fixed

1. Cache shuffle sai shape có thể làm nút mở thiệp không chạy.
2. CSV thiếu bảo vệ dữ liệu có thể bị hiểu thành công thức.
3. Đã xử lý một lint warning trong album; đây là cleanup tương đương, không phải lỗi chuyển ảnh.

## Performance improvements

Không áp dụng thay đổi loading, image compression, font, polling, cache server, animation hoặc memoization vì chưa có measurement đủ để đảm bảo không ảnh hưởng trải nghiệm. Các cơ hội tối ưu đã được liệt kê trong Initial Review. Không đưa ra điểm benchmark hoặc phần trăm cải thiện không đo được.

## Refactoring

Chỉ sửa biểu thức điều kiện tương đương và guard ở ranh giới dữ liệu. Không đổi kiến trúc, component hierarchy, route, DOM, tên file source hoặc dependency. Không xóa dead code/asset.

## Behavior preserved

- Giữ nguyên 5 bài nhạc hiện có; shuffle hợp lệ vẫn đi hết queue trước khi lặp, không lặp ngay ở ranh giới hai vòng.
- Giữ 7 ảnh và cách chuyển CoverFlow; các timer 2800ms/2000ms/900ms của gallery không đổi.
- Opening phases/timers, cuộn 67px/s, dock, gift animation, QR placeholders, schema và dữ liệu hai thiệp giữ nguyên.
- Giữ auth/HTTP status/CSV download headers, không sửa dữ liệu tên hoặc lời chúc trong DB.

## Visual preserved

Không sửa file CSS, font, asset, theme, breakpoint, content hoặc thứ tự section. Gallery chỉ đổi JS statement trong callback, không đổi markup. Diff source chỉ gồm 20 dòng thêm, 3 dòng bỏ ở 3 file.

Đây là xác nhận phạm vi code và smoke test, **không phải** chứng nhận pixel-perfect trên mọi thiết bị. Chưa thực hiện screenshot diff tin cậy và chưa có Safari/iPhone thực trong môi trường kiểm tra.

## Verification

| Check | Baseline | Sau sửa |
| --- | --- | --- |
| `npm run lint` | 0 error, 1 warning | Pass, 0 error/warning |
| `npm run typecheck` | Pass | Pass |
| `npm run build` | Pass | Pass |
| `node --test scripts/review-regressions.test.mjs` | 5 pass / 2 fail trước sửa | 7 pass / 0 fail |
| `npm audit --json` | 0 advisory | Dependencies không thay đổi |
| `git diff --check` | Tree sạch | Không có whitespace error; Git chỉ nhắc LF→CRLF theo cấu hình Windows |

Browser trên production build local: mở đầu/tên khách tiếng Việt → mở thiệp → phase opened → pause nhạc → next album → ảnh active mở lightbox → Escape → gift modal với hai QR trống → Escape. Console warn/error của lần smoke test rỗng. Autoplay tiếp tục đổi ảnh trong lúc kiểm tra; locator test được chuyển sang ảnh active thay vì giả định index cố định.

Responsive baseline đã đo 9 nhóm chiều rộng, ghi số đo và giới hạn rounding ở Initial Review. Các file điều khiển responsive không đổi. Đã mở RSVP và nhập tên nháp không submit ở baseline; chưa test submit form trên DB thật, Safari focus zoom/bàn phím, touch hold/swipe thật, nghe hết 5 bài hay QR ngân hàng thật.

Có cảnh báo **server baseline** khi request trang: chưa đặt `metadataBase`, Next dùng localhost trong môi trường này. Browser console rỗng không có nghĩa server không có warning. Chưa sửa metadata vì ngoài batch và cần xác minh URL production.

## Remaining issues

Các ID 1, 4–11, 13–17 trong Initial Review còn nguyên: fallback khi thu hồi thiệp; schema venue nhà gái; release chuột ngoài album; tên khách dài; lỗi mạng admin; clipboard; lỗi QR async; save chưa atomic; quyền đọc cột Supabase cần xác minh; alias mất query; metadata link ngắn; ngày trang chủ; mô tả moderation; timer copy.

Không phân loại những finding chưa tái hiện runtime thành bug production đã được chứng minh. Không sửa fallback/RLS/venue bằng phỏng đoán vì có thể thay behavior hoặc ảnh hưởng dữ liệu thực.

## Recommendations

1. Batch tiếp: kiểm tra thu hồi thiệp và lưu thiệp nhà gái bằng DB thử nghiệm, thống nhất behavior fallback/venue rồi mới sửa.
2. Kiểm tra quyền cột trên Supabase production ở chế độ read-only; chuẩn bị migration riêng nếu cần, không gộp vào sửa giao diện.
3. Reproduce pointer release ngoài album, clipboard denied, QR rejection và network error bằng test riêng; giữ mọi timing khi xử lý.
4. Đo network/CPU trên iPhone Safari và Android Chrome trước thay loading/polling/font; chọn giải pháp tên dài cùng visual reference.
5. Chạy regression bằng `node --test scripts/review-regressions.test.mjs` cùng lint/typecheck/build ở những lần sửa tiếp theo.

## Risky areas intentionally untouched

Toàn bộ CSS cascade, hoa/paper/absolute positioning/z-index, typography, CoverFlow 3D/easing/opacity, image pipeline, auto-scroll, opening/gift animation, Supabase schema/RLS/data, metadata, nhạc/QR thật, routing và toàn bộ dependencies.

Chưa commit, push hoặc deploy. Các thay đổi đang ở local để review; production và dữ liệu Supabase không được cập nhật trong tác vụ này.
