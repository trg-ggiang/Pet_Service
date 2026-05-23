Hãy tiếp tục thiết kế UI/UX cho hệ thống PetCare Center, tập trung vào giao diện CUSTOMER / Chủ nuôi, dựa trên style hiện tại trong các màn hình đã có.

GIỮ NGUYÊN STYLE HIỆN TẠI:
- Giao diện sạch, hiện đại, nhiều khoảng trắng.
- Màu chủ đạo teal/cyan như hiện tại.
- Bo góc lớn, card mềm, shadow nhẹ.
- Font sans-serif hiện đại.
- Header cố định phía trên gồm logo PetCare Center, notification bell, avatar, tên khách hàng, role badge “Khách hàng”, nút Đăng xuất.
- Thanh navigation gồm: Trang chủ, Lịch hẹn, Thú cưng, Lịch sử.
- Các modal dùng overlay blur/dim background giống màn hình hiện tại.
- Icon line style đồng bộ với giao diện hiện có.
- Tất cả text bằng tiếng Việt.

MỤC TIÊU:
Hoàn thiện UI/UX phía Customer để chủ nuôi có thể:
1. Xem danh sách lịch hẹn.
2. Xem chi tiết lịch hẹn.
3. Đặt lịch khám/dịch vụ/lưu trú/grooming/tiêm phòng.
4. Xem hồ sơ chi tiết thú cưng.
5. Xem trạng thái hiện tại của thú cưng.
6. Xem lịch sử khám bệnh.
7. Xem lịch sử tiêm chủng.
8. Xem lịch sử grooming/lưu trú.
9. Xem hóa đơn/thanh toán.
10. Xem thông báo và nhắc lịch.
11. Đánh giá bác sĩ/dịch vụ/lưu trú sau khi hoàn thành.

CẦN THIẾT KẾ BỔ SUNG CÁC MÀN HÌNH SAU:

1. MÀN “LỊCH HẸN CỦA TÔI” - NÂNG CẤP
Giữ layout danh sách hiện tại nhưng bổ sung:
- Tabs lọc trạng thái:
  + Sắp tới
  + Đang xử lý
  + Đã hoàn thành
  + Đã hủy
  + Tất cả
- Bộ lọc nhanh:
  + Theo thú cưng
  + Theo loại dịch vụ: Khám bệnh, Tiêm phòng, Grooming, Lưu trú
  + Theo ngày
- Mỗi card lịch hẹn hiển thị:
  + Tên dịch vụ
  + Loại dịch vụ bằng badge màu: Khám bệnh / Grooming / Lưu trú / Tiêm phòng
  + Tên thú cưng
  + Bác sĩ phụ trách nếu là khám bệnh hoặc tiêm phòng
  + Nhân viên phụ trách nếu là grooming/lưu trú
  + Ngày hẹn
  + Giờ hẹn
  + Phòng khám/phòng dịch vụ/chuồng lưu trú nếu có
  + Số thứ tự hàng đợi nếu đã check-in
  + Trạng thái: Chờ xác nhận, Đã xác nhận, Đã check-in, Đang thực hiện, Hoàn thành, Đã hủy, Không đến
- Action theo trạng thái:
  + Với PENDING/CONFIRMED: Xem chi tiết, Đổi lịch, Hủy lịch
  + Với CHECKED_IN/IN_PROGRESS: Xem tiến trình
  + Với COMPLETED: Xem kết quả, Xem hóa đơn, Đánh giá
  + Với CANCELLED/NO_SHOW: Đặt lại lịch

2. MODAL / DRAWER “CHI TIẾT LỊCH HẸN”
Thiết kế modal lớn hoặc side drawer khi bấm vào lịch hẹn.
Thông tin cần có:
- Header:
  + Tên dịch vụ
  + Badge trạng thái
  + Mã lịch hẹn, ví dụ: #APT-20260525-001
- Thông tin chính:
  + Thú cưng: ảnh, tên, loài, giống
  + Chủ nuôi: tên, số điện thoại
  + Loại dịch vụ: Khám bệnh / Tiêm phòng / Grooming / Lưu trú
  + Ngày hẹn
  + Giờ hẹn
  + Thời lượng dự kiến
  + Phòng/chuồng nếu có
  + Số thứ tự queue nếu có
- Nhân sự phụ trách:
  + Bác sĩ phụ trách nếu là khám bệnh/tiêm phòng
  + Nhân viên phụ trách nếu là grooming/lưu trú
  + Hiển thị avatar nhỏ, tên, chuyên môn/chức vụ
- Ghi chú khách hàng:
  + Triệu chứng / yêu cầu đặc biệt
  + Dị ứng / bệnh mãn tính nếu có
- Timeline trạng thái:
  + Đặt lịch
  + Nhân viên xác nhận
  + Check-in
  + Đang thực hiện
  + Hoàn thành
- Chi phí:
  + Giá dịch vụ dự kiến
  + Phụ phí nếu có
  + Tổng tạm tính
- Nút hành động:
  + Đổi lịch
  + Hủy lịch
  + Liên hệ trung tâm
  + Thanh toán nếu có hóa đơn pending
  + Xem kết quả nếu đã hoàn thành

3. FLOW “ĐẶT LỊCH MỚI” - HOÀN THIỆN 2-3 BƯỚC
Dựa trên modal hiện có nhưng làm rõ hơn.

Bước 1: Chọn dịch vụ
- Grid service card:
  + Khám tổng quát
  + Tiêm phòng
  + Grooming
  + Khám da liễu
  + Lưu trú
  + Khám ngoại khoa
- Mỗi card có icon, tên, mô tả ngắn, giá từ bao nhiêu.
- Chọn thú cưng.
- Chọn bác sĩ nếu là khám bệnh/tiêm phòng.
- Chọn nhân viên nếu là grooming/lưu trú hoặc để “Trung tâm tự phân công”.
- Chọn ngày.
- Chọn giờ.
- Nhập ghi chú:
  + Triệu chứng
  + Yêu cầu đặc biệt
  + Lưu ý về ăn uống/thói quen nếu là lưu trú

Bước 2: Xác nhận lịch
Hiển thị summary card:
- Dịch vụ
- Thú cưng
- Bác sĩ/nhân viên phụ trách
- Thời gian
- Phòng/chuồng nếu đã phân bổ
- Ghi chú
- Giá tạm tính
- Chính sách hủy lịch ngắn gọn
Nút:
- Quay lại
- Xác nhận đặt lịch

Bước 3: Đặt lịch thành công
- Icon check lớn
- Text: “Đặt lịch thành công”
- Hiển thị mã lịch hẹn
- Nút:
  + Xem lịch hẹn
  + Đặt thêm lịch khác
  + Về trang chủ

4. MÀN “THÚ CƯNG CỦA TÔI” - NÂNG CẤP CARD
Giữ layout card hiện tại nhưng bổ sung thông tin trạng thái hiện tại:
- Badge sức khỏe:
  + Khỏe mạnh
  + Cần theo dõi
  + Đang điều trị
  + Đang lưu trú
- Card thú cưng hiển thị:
  + Ảnh
  + Tên
  + Loài + giống
  + Tuổi
  + Cân nặng
  + Lần khám gần nhất
  + Tiêm nhắc lại gần nhất
  + Trạng thái hiện tại
- Nút:
  + Hồ sơ đầy đủ
  + Đặt lịch khám
  + Xem lịch sử

5. MODAL / PAGE “HỒ SƠ THÚ CƯNG ĐẦY ĐỦ”
Nâng cấp modal hiện có thành modal chi tiết hơn, gồm các section:

Header:
- Ảnh thú cưng
- Tên
- Loài + giống
- Badge trạng thái hiện tại
- Nút Sửa

Thông tin cơ bản:
- Tuổi
- Giới tính
- Cân nặng
- Màu lông
- Dị ứng
- Bệnh mãn tính
- Ghi chú đặc biệt

Trạng thái hiện tại:
- Sức khỏe hiện tại: Khỏe mạnh / Cần theo dõi / Đang điều trị
- Ăn uống: Bình thường / Ăn ít / Bỏ ăn
- Hoạt động: Bình thường / Ít vận động / Cần theo dõi
- Nếu đang lưu trú:
  + Chuồng/phòng
  + Ngày check-in
  + Ngày dự kiến đón
  + Tình trạng hôm nay
  + Ảnh cập nhật mới nhất

Theo dõi sức khỏe:
- Cân nặng hiện tại
- Biểu đồ mini cân nặng theo thời gian
- Lần khám gần nhất
- Lịch tái khám nếu có
- Lịch tiêm nhắc lại nếu có

Tabs trong hồ sơ:
- Tổng quan
- Lịch sử khám
- Tiêm chủng
- Grooming
- Lưu trú
- Hóa đơn

6. TAB “LỊCH SỬ KHÁM”
Thiết kế timeline hoặc danh sách card theo từng lần khám.
Mỗi item hiển thị:
- Ngày khám
- Tên bác sĩ
- Dịch vụ khám
- Triệu chứng
- Chẩn đoán
- Trạng thái: Hoàn thành
- Nút “Xem chi tiết”

Chi tiết lần khám gồm:
- Triệu chứng ban đầu
- Khám lâm sàng
- Chẩn đoán
- Kết quả xét nghiệm nếu có
- Đơn thuốc:
  + Tên thuốc
  + Liều lượng
  + Tần suất
  + Số ngày dùng
  + Hướng dẫn sử dụng
- Lịch tái khám
- File/ảnh kết quả nếu có
- Nút tải kết quả hoặc gửi email

7. TAB “TIÊM CHỦNG”
Thiết kế danh sách vaccine:
- Tên vaccine
- Ngày tiêm
- Ngày nhắc lại
- Bác sĩ/nhân viên thực hiện
- Trạng thái:
  + Đã tiêm
  + Sắp đến hạn
  + Quá hạn
- Nút “Đặt lịch tiêm nhắc lại”
- Có card cảnh báo nhẹ nếu vaccine sắp đến hạn.

8. TAB “GROOMING”
Thiết kế lịch sử dịch vụ chăm sóc:
- Tên dịch vụ: Tắm, cắt tỉa lông, cắt móng, vệ sinh tai, spa...
- Ngày thực hiện
- Nhân viên phụ trách
- Trạng thái
- Ghi chú sau dịch vụ
- Ảnh trước/sau nếu có
- Nút đánh giá dịch vụ nếu chưa đánh giá

9. TAB “LƯU TRÚ”
Thiết kế lịch sử pet hotel:
- Ngày check-in
- Ngày check-out
- Chuồng/phòng
- Chế độ ăn
- Lưu ý đặc biệt
- Tình trạng lưu trú
- Daily updates:
  + Ngày
  + Tình trạng sức khỏe
  + Tình trạng ăn uống
  + Ghi chú nhân viên
  + Ảnh cập nhật
- Nút “Nhắc lịch đón” hoặc “Đặt lại lưu trú”

10. MÀN “LỊCH SỬ DỊCH VỤ”
Nâng cấp màn hiện tại thành lịch sử tổng hợp.
Có tabs:
- Tất cả
- Khám bệnh
- Tiêm phòng
- Grooming
- Lưu trú
- Thanh toán

Mỗi dòng/card hiển thị:
- Icon loại dịch vụ
- Tên dịch vụ
- Tên thú cưng
- Ngày thực hiện
- Người phụ trách
- Tổng tiền
- Trạng thái thanh toán
- Nút “Chi tiết”

Khi bấm chi tiết:
- Hiện modal “Chi tiết dịch vụ”
- Có thông tin dịch vụ, kết quả nếu có, hóa đơn, đánh giá.

11. MÀN / MODAL “HÓA ĐƠN & THANH TOÁN”
Thiết kế chi tiết hóa đơn:
- Mã hóa đơn
- Dịch vụ liên quan
- Thú cưng
- Ngày tạo
- Danh sách khoản tiền:
  + Khám bệnh
  + Xét nghiệm
  + Tiêm chủng
  + Grooming
  + Lưu trú
  + Gói dịch vụ
- Tạm tính
- Giảm giá
- Thuế nếu có
- Tổng tiền
- Phương thức thanh toán:
  + Tiền mặt
  + Chuyển khoản
  + VNPay
- Trạng thái:
  + Chờ thanh toán
  + Đã thanh toán
  + Đã hủy
  + Hoàn tiền
- Nút:
  + Thanh toán ngay
  + Tải hóa đơn
  + Gửi email hóa đơn

12. NOTIFICATION CENTER
Khi bấm icon chuông ở header, mở dropdown hoặc side panel:
- Thông báo lịch hẹn
- Nhắc lịch tái khám
- Nhắc lịch tiêm chủng
- Nhắc lịch grooming định kỳ
- Nhắc lịch đón thú cưng lưu trú
- Thông báo thanh toán
- Có trạng thái đọc/chưa đọc
- Có nút “Đánh dấu tất cả là đã đọc”
- Mỗi notification có icon, title, nội dung ngắn, thời gian.

13. ĐÁNH GIÁ & PHẢN HỒI
Sau khi dịch vụ hoàn thành, thêm modal đánh giá:
- Đánh giá bác sĩ nếu là khám bệnh
- Đánh giá dịch vụ grooming nếu là grooming
- Đánh giá lưu trú nếu là pet hotel
- Rating 1-5 sao
- Textarea phản hồi
- Checkbox “Tôi muốn trung tâm liên hệ lại”
- Nút Gửi đánh giá

14. EMPTY STATE / LOADING / ERROR STATE
Thiết kế thêm các trạng thái:
- Chưa có lịch hẹn: hiển thị icon + text + nút “Đặt lịch mới”
- Chưa có thú cưng: icon + text + nút “Thêm thú cưng”
- Chưa có lịch sử dịch vụ
- Loading skeleton cho card
- Error state nhẹ: “Không thể tải dữ liệu, vui lòng thử lại”

YÊU CẦU UX:
- Customer phải dễ hiểu, không dùng thuật ngữ kỹ thuật.
- Ưu tiên thao tác nhanh: đặt lịch, xem chi tiết, hủy/đổi lịch.
- Các trạng thái cần có màu rõ:
  + Chờ xác nhận: vàng nhạt
  + Đã xác nhận: xanh dương nhạt
  + Đang thực hiện: tím nhạt
  + Hoàn thành: xanh lá nhạt
  + Đã hủy: đỏ nhạt
- Giao diện phải responsive desktop trước, nhưng modal/card có thể dễ chuyển sang mobile.
- Tạo component reusable:
  + AppointmentCard
  + AppointmentDetailModal
  + PetCard
  + PetDetailModal
  + ServiceHistoryItem
  + InvoiceModal
  + NotificationDropdown
  + RatingModal
  + StatusBadge
  + TimelineStep

DỮ LIỆU DEMO:
Khách hàng:
- Nguyễn Thị Hà
- Role: Khách hàng

Thú cưng:
1. Mochi
- Chó
- Poodle
- 2 tuổi
- 4.2 kg
- Trạng thái: Khỏe mạnh
- Lần khám gần nhất: 12/05/2026
- Tiêm nhắc lại: 12/08/2026

2. Luna
- Mèo
- British Shorthair
- 3 tuổi
- 5.1 kg
- Trạng thái: Cần theo dõi nhẹ
- Lần grooming gần nhất: 03/04/2026
- Tiêm nhắc lại: 03/07/2026

Lịch hẹn demo:
1. Khám tổng quát
- Pet: Mochi
- Bác sĩ: BS. Trần Hoài Nam
- Ngày: 25/05/2026
- Giờ: 09:30
- Phòng: Phòng khám 02
- Queue: A012
- Trạng thái: Chờ khám
- Ghi chú: Kiểm tra sức khỏe định kỳ

2. Tiêm phòng dại
- Pet: Luna
- Bác sĩ: BS. Lê Thị Hoa
- Ngày: 02/06/2026
- Giờ: 10:00
- Phòng: Phòng tiêm 01
- Trạng thái: Đã xác nhận

3. Lưu trú
- Pet: Mochi
- Nhân viên: Nguyễn Văn An
- Check-in: 10/06/2026
- Check-out: 13/06/2026
- Chuồng: CAGE-A03
- Trạng thái: Đã xác nhận

Lịch sử demo:
1. Khám tổng quát
- Pet: Mochi
- Ngày: 12/05/2026
- Bác sĩ: BS. Trần Hoài Nam
- Chẩn đoán: Sức khỏe ổn định
- Tổng tiền: 250.000đ
- Trạng thái: Hoàn thành

2. Grooming đầy đủ
- Pet: Luna
- Ngày: 03/04/2026
- Nhân viên: Phạm Minh Anh
- Tổng tiền: 350.000đ
- Trạng thái: Hoàn thành

3. Tiêm phòng combo
- Pet: Mochi
- Ngày: 18/03/2026
- Bác sĩ: BS. Lê Thị Hoa
- Tổng tiền: 320.000đ
- Trạng thái: Hoàn thành

Hãy tạo các màn hình UI đầy đủ, có prototype flow cơ bản:
- Từ “Lịch hẹn” → bấm card → mở chi tiết lịch hẹn.
- Từ “Đặt lịch mới” → bước chọn dịch vụ → xác nhận → thành công.
- Từ “Thú cưng” → bấm “Hồ sơ đầy đủ” → mở hồ sơ thú cưng có tabs.
- Từ “Lịch sử” → bấm “Chi tiết” → mở kết quả dịch vụ/hóa đơn.
- Từ notification bell → mở notification center.