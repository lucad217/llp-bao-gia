# LLP – BÁO GIÁ NHANH & CẤU HÌNH THIẾT BỊ HIỆN TRƯỜNG

## 1. Cấu trúc
- `index.html`: giao diện responsive, các màn hình lập báo giá, danh mục, lịch sử, thiết lập và modal.
- `styles.css`: giao diện bổ sung cho Tailwind CSS.
- `app.js`: dữ liệu mẫu, tính toán VAT/chiết khấu/lãi gộp, CRUD danh mục, lưu báo giá, xuất PDF/Excel, sao lưu/khôi phục.
- `manifest.json`: cấu hình cài đặt PWA.
- `sw.js`: cache tài nguyên cùng origin và hỗ trợ mở lại ứng dụng offline.
- `assets/logo-llp.png`: logo trích xuất từ file Excel mẫu LLP.

## 2. Chạy thử
PWA cần chạy qua HTTP/HTTPS, không mở trực tiếp bằng `file://`.
- Cài Node.js, mở terminal tại thư mục dự án.
- Chạy: `npx serve .`
- Mở địa chỉ localhost mà terminal hiển thị.
- Dùng Chrome/Edge → DevTools → Application để kiểm tra Manifest và Service Worker.

## 3. Triển khai GitHub Pages
1. Tạo repository GitHub, ví dụ `llp-bao-gia`.
2. Upload toàn bộ nội dung thư mục này lên root repository.
3. Vào Settings → Pages.
4. Build and deployment: Deploy from a branch.
5. Chọn `main` và `/ (root)` → Save.
6. Chờ GitHub cấp URL HTTPS, ví dụ `https://<username>.github.io/llp-bao-gia/`.
7. Mở URL trên điện thoại, chọn Add to Home Screen / Install app.

## 4. Triển khai Vercel
1. Đẩy thư mục dự án lên GitHub.
2. Đăng nhập Vercel → Add New → Project.
3. Import repository.
4. Framework Preset: Other; Build Command để trống; Output Directory `.`.
5. Deploy. Dùng URL HTTPS được cấp để mở trên điện thoại.

## 5. Lưu ý kỹ thuật và vận hành
- Tailwind, Lucide, SheetJS và html2pdf đang được tải từ CDN. Service Worker cache các tài nguyên CDN sau khi trình duyệt tải được chúng khi online. Để triển khai offline tuyệt đối ngay lần đầu, cần đóng gói thư viện vào thư mục `vendor/` và sửa đường dẫn script.
- LocalStorage chỉ lưu dữ liệu trong trình duyệt/thiết bị hiện tại. Xóa dữ liệu trình duyệt hoặc đổi máy có thể làm mất dữ liệu. Dùng Sao lưu toàn bộ và Phục hồi sao lưu định kỳ.
- Không có backend trong gói này nên không có đồng bộ đa thiết bị, phân quyền nhân viên, khóa báo giá hoặc liên kết báo giá công khai. Không gửi dữ liệu nhạy cảm qua thiết bị dùng chung.
- Nút chia sẻ dùng Web Share API nếu trình duyệt hỗ trợ chia sẻ tệp. Nếu không, ứng dụng tải PDF và sao chép nội dung chia sẻ. Zalo/WhatsApp/Email sẽ được chọn từ bảng chia sẻ của hệ điều hành khi được hỗ trợ.
- Bản xuất PDF được dựng từ HTML. Cần kiểm tra lại ngắt trang, font và logo trên trình duyệt/thiết bị thực tế trước khi sử dụng chính thức.
- Dữ liệu danh mục khởi tạo chỉ là dữ liệu DEMO để kiểm tra tính năng, không phải bảng giá NCC/giá chuẩn LLP. Cần nhập dữ liệu đã được LLP phê duyệt.
- Để tính lãi gộp chính xác, cần cập nhật COGS vật tư và COGS nhân công trong danh mục/dòng tự do. Chi phí bổ sung đang được xem là khoản thu hộ/chi phí giá vốn tương ứng (không tạo lãi gộp) cho đến khi người dùng cấu hình chi phí thực tế.

## 6. Công thức
- Thành tiền vật tư = SL × đơn giá vật tư × (1 − chiết khấu dòng) × (1 − chiết khấu toàn báo giá).
- Thành tiền nhân công = SL × đơn giá nhân công × các hệ số chiết khấu tương tự.
- VAT được tính theo từng nhóm vật tư/nhân công và mức 0%, 8%, 10%.
- Lãi gộp ước tính = doanh thu trước thuế − giá vốn vật tư − giá vốn nhân công − chi phí bổ sung.
- Margin = lãi gộp / doanh thu trước thuế; Markup = lãi gộp / giá vốn.

## 7. Kiểm tra trước khi dùng thật
1. Nhập danh mục và giá vốn chính thức.
2. Kiểm tra VAT theo chính sách thuế áp dụng cho từng hàng hóa/dịch vụ tại thời điểm xuất báo giá.
3. So sánh bản xem trước với mẫu PDF/Excel LLP.
4. Xuất PDF và Excel, kiểm tra số liệu, chữ ký, điều khoản và số trang.
5. Sao lưu dữ liệu trước khi cập nhật phiên bản mới.
