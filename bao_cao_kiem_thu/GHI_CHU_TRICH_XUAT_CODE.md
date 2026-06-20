# Ghi chú trích xuất mã nguồn làm minh chứng kiểm thử

Tài liệu này liệt kê các đoạn mã nên chụp để đưa vào **Tài liệu đặc tả kiểm thử Pet Service**. Số dòng được xác định trên trạng thái hiện tại của nhánh `unit-test`; cần kiểm tra lại nếu mã nguồn thay đổi trước khi chụp.

## Nguyên tắc chụp

- Hiển thị tên file và số dòng trong IDE.
- Chụp trọn ba phần `Arrange`, `Act`, `Assert` nếu có thể.
- Không chụp `.env`, token, service-role key hoặc dữ liệu thật.
- Mỗi ảnh chỉ nên minh họa một mục tiêu kiểm thử; không ghép nhiều đoạn không liên quan.
- Nếu đoạn mã dài, có thể chụp hai ảnh liên tiếp và giữ phần dòng giao nhau để người đọc theo dõi.

## Danh sách ảnh đề xuất

| Hình | Nội dung minh chứng | File | Dòng |
| --- | --- | --- | --- |
| 1 | Đăng nhập thành công và tạo session cho customer | `backend/tests/unit/authService.test.js` | 42-72 |
| 2 | JWT thật: ký token, xác minh và gắn auth context | `backend/tests/middleware/jwtIntegration.test.js` | 30-49 |
| 3 | Từ chối đặt lịch khi slot vừa bị request khác giữ | `backend/tests/unit/customerAppointmentsService.test.js` | 398-426 |
| 4 | Luồng đổi lịch rồi hủy, giải phóng cả slot cũ và slot mới | `backend/tests/integration/crossFeatureCriticalFlows.test.js` | 414-500 |
| 5 | Checkout lưu trú, tạo invoice item và cập nhật trạng thái cuối | `backend/tests/unit/boardingService.test.js` | 253-318 |
| 6 | Upload ảnh chăm sóc lưu trú bằng Supabase Storage mock | `backend/tests/unit/staffPortalService.test.js` | 235-285 |
| 7 | Tạo lịch tái khám và giữ doctor slot khả dụng | `backend/tests/unit/doctorExamCompletionService.test.js` | 201-258 |
| 8 | Route bác sĩ chỉ định dịch vụ chuyên khoa | `backend/tests/routes/doctorSpecialistRoutes.test.js` | 87-117 |
| 9 | Route admin cập nhật email template | `backend/tests/routes/adminRoutes.test.js` | 309-324 |
| 10 | Audit event không làm lộ dữ liệu nhạy cảm | `backend/tests/unit/adminAuditService.test.js` | 7-27 |
| 11 | Sinh nội dung PDF hóa đơn và kiểm tra quyền sở hữu | `backend/tests/unit/invoicePdfService.test.js` | 44-93 |
| 12 | LoginView chuyển tiếp input và submit form | `frontend/src/components/auth/LoginView.test.tsx` | 25-41 |
| 13 | CustomerProfileTab cập nhật dữ liệu nhưng giữ email read-only | `frontend/src/components/customer/profile/CustomerProfileTab.test.tsx` | 36-70 |
| 14 | Contract concurrency chỉ cho phép đúng một request thắng | `backend/tests/unit/realDbAppointmentConcurrencyRunner.test.js` | 66-73 |

## Ảnh kết quả thực thi cần bổ sung

Các ảnh này nên chụp từ terminal sau khi chạy lại lệnh ngay trước khi hoàn thiện báo cáo:

1. Backend regression:

   ```powershell
   npm --prefix backend run test:run
   ```

   Kết quả kỳ vọng hiện tại: `29 suites passed`, `205 tests passed`.

2. Frontend regression:

   ```powershell
   npm --prefix frontend run test:run
   ```

   Kết quả kỳ vọng hiện tại: `14 files passed`, `66 tests passed`.

3. Backend coverage:

   ```powershell
   npm --prefix backend run test:coverage
   ```

   Kết quả gần nhất: statements `62.56%`, branches `44.12%`, functions `64.31%`, lines `62.56%`.

4. Frontend coverage:

   ```powershell
   npm --prefix frontend run test:coverage
   ```

   Kết quả gần nhất: statements `87.23%`, branches `69.77%`, functions `79.86%`, lines `88.20%`.

5. Playwright smoke:

   ```powershell
   npm run test:e2e
   ```

   Kết quả kỳ vọng: Chromium smoke test pass.

## Chú thích ảnh đề xuất

- **Hình 1.** Unit Test kiểm tra đăng nhập customer thành công với thông tin hợp lệ.
- **Hình 2.** Integration Test kiểm tra JWT được ký và xác minh bằng module thật.
- **Hình 3.** Unit Test kiểm tra xung đột khi hai request cùng giữ một doctor slot.
- **Hình 4.** Mocked Integration Test kiểm tra giải phóng slot khi đổi và hủy lịch.
- **Hình 5.** Unit Test kiểm tra checkout lưu trú và lập hóa đơn.
- **Hình 6.** Unit Test kiểm tra upload ảnh cập nhật chăm sóc với Storage mock.
- **Hình 7.** Unit Test kiểm tra tạo lịch tái khám và giữ slot.
- **Hình 8.** Route Test kiểm tra bác sĩ tạo chỉ định chuyên khoa.
- **Hình 9.** Route Test kiểm tra admin cập nhật mẫu email.
- **Hình 10.** Unit Test kiểm tra cấu trúc audit log và bảo vệ dữ liệu nhạy cảm.
- **Hình 11.** Unit Test kiểm tra nội dung và quyền tải PDF hóa đơn.
- **Hình 12.** Component Test kiểm tra hành vi nhập và gửi form đăng nhập.
- **Hình 13.** Component Test kiểm tra cập nhật hồ sơ khách hàng.
- **Hình 14.** Concurrency contract kiểm tra đúng một request giữ slot thành công.

## Lưu ý về bằng chứng Real Integration

Không ghi hoặc chụp kết quả `Real DB passed` cho Phase 8B-4 khi chưa có Supabase/PostgreSQL test project riêng. Hiện chỉ có thể dùng ảnh runner unit `7/7 passed` và ảnh CLI fail-closed. Báo cáo phải ghi trạng thái Real DB là **Not run**, không suy diễn từ mock test.
