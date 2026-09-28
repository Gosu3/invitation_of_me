# Codebase Audit Report — 28/09/2026

## Summary trước cleanup

| Hạng mục | Kết quả |
| --- | --- |
| File Git được quét | 152 |
| Unused imports | 0 theo ESLint và TypeScript |
| Unused variables/parameters | 0 theo `tsc --noUnusedLocals --noUnusedParameters` |
| Unused components chắc chắn | 2: `FloralDecoration`, `FloralDivider` |
| Asset hoa cũ không còn dùng | 7 file, đã xóa sau khi chủ dự án xác nhận |
| Missing asset đã xác nhận | 0 |
| Local-only asset trong runtime source | 0 |
| Asset trùng nội dung theo SHA-256 | 0 |
| Legacy file theo tên `.old/.bak/.tmp/copy` | 0 |
| Debug/TODO/FIXME trong runtime | 0 |
| Dependency có thể gỡ chắc chắn | 0 |
| Vulnerability từ `npm audit` | 0 |

Phạm vi quét gồm `src`, `public`, `scripts`, `supabase`, config, package manifest và toàn bộ Markdown. Việc đánh giá asset có xét CSS `background-image`, object mapping, path nội suy và route động; không kết luận unused chỉ dựa trên một màn hình.

## Dependency map cơ bản

```text
Next.js App Router
├─ /                         → listInvitations → Supabase/demo
├─ /thiep/[slug]             → getInvitation → InvitationExperience
├─ /m/[code]                 → wedding_guest_links → InvitationExperience
├─ /quan-tri/*                → requireAdmin → AdminDashboard/AdminEditor
└─ /api/*                    → Zod validation → Supabase service/public client

InvitationExperience
├─ EnvelopeIntro + useWeddingMusic
├─ WeddingHero / ceremony / reception / venue / timeline / guestbook
├─ WeddingGallery + GalleryLightbox + useSwipe
├─ GiftSection + GiftModal + QR download/share
└─ Modal + useBodyScrollLock
```

Các route trong `src/app` là entry point của framework nên không cần được import từ module khác. Asset QR nhân vật dùng path nội suy theo `role`; media cưới production dùng `/api/media/[id]` và Supabase Storage.

## Phân loại phát hiện

### SAFE TO CLEAN

- `FloralDecoration` và `FloralDivider` chỉ tồn tại ở nơi định nghĩa, không có import/call.
- CSS album cũ (`wedding-album`, `album-viewport`, `album-track`, `album-thumbnails`, `album-controls`) không có markup tương ứng; album hiện dùng nhóm `album-carousel-*` và `lightbox-*`.
- CSS hộp quà vector cũ (`present-*`, `gift-sparkles`, `gift-rock`, `sparkle`) không có markup tương ứng; hộp quà hiện dùng nhóm `image-gift-*`.
- Selector hoa cũ gắn với hai component đã bỏ không còn nơi tạo DOM.
- Script regression đã tồn tại nhưng chưa có lệnh `npm test` trong package manifest.

### DOCUMENTATION

- README mô tả lời chúc phải duyệt, trong khi API hiện lưu `approved` và phát realtime.
- Tài liệu cấu trúc chưa phản ánh các stylesheet/component đã tách.
- Tài liệu chuyển máy còn số migration, slug, nhãn quản trị và luồng lời chúc cũ.
- `STUDY.md` còn mô tả cha mẹ placeholder, QR trống và nhạc tổng hợp đã không còn đúng.
- Hai báo cáo review ngày 26/09 đã hết vai trò bàn giao và được xóa theo yêu cầu của chủ dự án.

### ASSET CLEANUP — đã xác nhận

Đã xóa 7 ảnh hoa cũ không còn tham chiếu runtime, giải phóng 12.23 MiB trong repository:

- `public/assets/wedding/hoa-cuoi/ceremony-flower-sprite.png`
- `public/assets/wedding/hoa-cuoi/ceremony-lily-reference.png`
- `public/assets/wedding/hoa-cuoi/linh-lan-roses-trailing.png`
- `public/assets/wedding/hoa-cuoi/linhlan2.png`
- `public/assets/wedding/hoa-cuoi/linhlan3.png`
- `public/assets/wedding/hoa-cuoi/tulip01.png`
- `public/assets/wedding/hoa-cuoi/tulip3.png`

Các file còn lại trong `hoa-cuoi` đều được dùng: hai cành lễ cưới được dựng bằng path nội suy, `hoatrai03`/`hoaphai03` dùng cho lịch trình, `linhlan5` dùng cho tiệc cưới, còn `paper01`/`paper02` dùng trong CSS nền. Mọi file trong `public/assets/wedding/hoa-moc` và `public/decor/hoa-moc-xanh` cũng có tham chiếu runtime nên được giữ. `flower.webp` được giữ nguyên vì trực tiếp tạo hiệu ứng bung hoa khi mở thiệp.

### LOCAL ASSET

Không tìm thấy path `C:\Users`, OneDrive, Desktop, Documents, Downloads, `file://` hoặc localhost trong runtime source để tải asset. Localhost chỉ có ở fallback URL/config và hướng dẫn development; đường dẫn Windows chỉ có trong ví dụ script/tài liệu lịch sử.

### MISSING ASSET

Không có asset public tĩnh bị thiếu. Các kết quả dạng `${id}.webp` là đường dẫn Supabase Storage; `${role}-character.png` ánh xạ đến hai file `groom-character.png` và `bride-character.png` đang có trong repo.

### OPTIMIZATION SUGGESTION — chưa áp dụng

- Một số PNG trang trí/thumbnail có kích thước khoảng 1–2,7 MB và MP3 khoảng 2,7–3,4 MB. Cần đo network trên thiết bị thật trước khi tạo biến thể; không nén hoặc đổi ảnh đang dùng trong batch này.
- Realtime guestbook vẫn có polling 5 giây để hồi phục broadcast bị lỡ. Chỉ giảm polling sau khi đo độ ổn định production.
- CSS toàn cục khoảng 197 KB và có 238 `!important`. Đây là cascade tích lũy của giao diện; không gộp file, đổi thứ tự import hoặc mass refactor.
- Root layout tải nhiều font family/weight, nhưng mỗi family hiện đều có reference trong CSS/theme. Cần trace network trước khi giảm.

### REVIEW REQUIRED / HIGH RISK — cố ý giữ nguyên

- Fallback demo khi query invitation production lỗi hoặc không tìm thấy.
- Quyền đọc theo cột của RLS trên Supabase live, đặc biệt `submitter_hash`.
- Save nội dung thiệp và `admin_title` chưa cùng transaction.
- Redirect alias nhà gái không giữ query cá nhân hóa.
- Trang chủ không nạp relation events nên ngày card có thể dùng fallback.
- Error handling của clipboard/QR async và timer trạng thái copy.
- CSS selector cũ khác như `gallery-preview-*`, `gift-account` và các override nhiều lớp cần coverage runtime trước khi xóa.
- Toàn bộ timing, transform, opacity, z-index, carousel, hoa rơi, mở thiệp, hộp quà, realtime, responsive, route, schema và dữ liệu.

## Kiểm tra chất lượng ảnh album

- Production hiện không có dòng `wedding_media` cho hai thiệp; code dùng bộ fallback gồm 8 ảnh trong `public/photos`.
- Cả 8 ảnh là WebP 1600×2400, từ 123,586 đến 462,796 byte. Kích thước pixel đủ cho khung carousel và lightbox hiện tại.
- `scripts/prepare-photos.mjs` và API upload đều resize tối đa 1800×2400 rồi mã hóa WebP ở quality 82. Như vậy file có nén mất dữ liệu, nhưng contact sheet không cho thấy lỗi vỡ khối rõ ràng. Không nên mã hóa lại từ chính các WebP này vì sẽ giảm chất lượng thêm; muốn tăng chất lượng cần lấy lại ảnh gốc rồi tạo một lần ở quality cao hơn.
- Ảnh trung tâm không có CSS blur. Các ảnh hai bên cố ý dùng opacity `.75`, `.5`, `.3` cùng perspective/rotate để tạo coverflow, nên chúng nhìn mềm hơn dù file nguồn giống nhau.
- Một số ảnh dùng độ sâu trường ảnh, làm chủ thể tiền cảnh hoặc hậu cảnh mờ có chủ ý. Không áp dụng sharpen hàng loạt vì sẽ tạo viền giả và thay đổi ảnh cưới.

## Cleanup plan đã thực hiện

1. **Phase 1 — Safe cleanup:** bỏ đúng component và CSS legacy đã chứng minh không render.
2. **Phase 2 — Code simplification:** không refactor component hierarchy hoặc business logic; thêm lệnh chạy regression hiện có.
3. **Phase 3 — Asset cleanup:** xóa 7 ảnh hoa cũ sau xác nhận; không nén, resize hoặc đổi định dạng asset đang dùng.
4. **Phase 4 — Documentation:** cập nhật README, cấu trúc, bàn giao và ghi nhớ dự án.
5. **Phase 5 — Verification:** chạy test, lint, typecheck, production build, unused checks và review toàn bộ diff.

## Optimization Result

### Removed

- Hai component React không được sử dụng và hai import chỉ phục vụ chúng.
- CSS/keyframe của gallery cũ, hộp quà CSS cũ và floral divider cũ không còn markup.
- 7 ảnh hoa cũ không còn tham chiếu (12.23 MiB).
- Hai tài liệu `INITIAL_REVIEW_2026-09-26.md` và `FINAL_REVIEW_2026-09-26.md` theo yêu cầu của chủ dự án.

### Modified

- `package.json`: thêm `npm test` trỏ tới regression suite sẵn có.
- `README.md`, `docs/CAU_TRUC_DU_AN.md`, `docs/TIEP_TUC_TREN_MAY_KHAC.md`, `STUDY.md`: đồng bộ với code hiện tại.

### Unused assets removed

7 ảnh hoa cũ đã được xóa sau khi đối chiếu cả reference trực tiếp lẫn path nội suy. Không xóa bất kỳ ảnh đang render hoặc dùng cho animation bung hoa.

### Dependencies reviewed

Các dependency runtime/dev chính đều có nơi sử dụng trực tiếp hoặc trong build/config. Không gỡ package và không nâng version. `npm audit` báo 0 advisory cho dependency tree hiện tại.

### High-risk items intentionally untouched

Không thay UI, layout, font, màu, responsive, animation, URL, API contract, data format, Supabase schema/RLS, asset chất lượng, image pipeline, playlist hoặc business logic.

## Verification

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` | Pass 7/7 regression tests |
| `npm run lint` | Pass, 0 warning/error |
| `npm run typecheck` | Pass |
| `tsc --noUnusedLocals --noUnusedParameters` | Pass |
| `npm run build` | Pass; Next.js 16.3.5 compile, TypeScript và 9 static pages hoàn tất |
| `git diff --check` | Pass; chỉ có cảnh báo line ending LF/CRLF của Git trên Windows |

Build sau khi xóa asset xác nhận không có import, route hoặc static asset reference nào bị gãy. Batch này chưa thay thế kiểm tra cảm quan trên toàn bộ thiết bị thật; các selector/timing giao diện đang hoạt động được giữ nguyên.
