# BÁO CÁO ĐỒ ÁN TỐT NGHIỆP: HỆ THỐNG QUẢN LÝ PHÒNG TRỌ & NHÀ CHO THUÊ (SMARTTRO)

---

## 1. TỔNG QUAN & TÍNH CẤP THIẾT
Tại các thành phố lớn và khu công nghiệp, nhu cầu thuê nhà trọ của sinh viên và người lao động rất cao. Tuy nhiên, phần lớn các chủ nhà trọ hiện nay vẫn quản lý bằng sổ tay hoặc file Excel rời rạc:
* **Ghi số điện nước thủ công**: Dễ ghi nhầm số, tính sai tiền gây tranh chấp giữa chủ trọ và khách thuê.
* **Theo dõi công nợ phức tạp**: Khó kiểm soát phòng nào đã đóng tiền, phòng nào đang nợ tiền, hạn chót ngày nào.
* **Quản lý an ninh & tạm trú**: Thường xuyên bỏ sót khai báo tạm trú cho công an khu vực, dẫn đến bị phạt hành chính.
* **Không nắm bắt được hiệu suất kinh doanh**: Thiếu biểu đồ tỷ lệ lấp đầy phòng (Occupancy Rate) và dự báo doanh thu.

**Mục tiêu của dự án SmartTro**:
Xây dựng giải pháp phần mềm hiện đại, trực quan, giải quyết trọn vẹn nghiệp vụ quản lý nhà trọ từ khâu nhận phòng, ký hợp đồng, ghi điện nước hàng tháng đến xuất phiếu thu tiền và báo cáo doanh thu.

---

## 2. PHÂN TÍCH NGHIỆP VỤ CỐT LÕI

### 2.1. Phân hệ Sơ đồ phòng trực quan (Floor & Room Layout)
* Hiển thị danh sách các phòng theo tầng (Tầng 1, Tầng 2, Tầng 3).
* Màu sắc trực quan hóa trạng thái:
  * **Màu xanh lá**: Phòng trống (Sẵn sàng đón khách mới).
  * **Màu cam**: Phòng đang có người thuê (Hiển thị tên khách đại diện, SĐT, giá thuê).
  * **Màu xám**: Phòng đang sửa chữa/bảo trì.

### 2.2. Phân hệ Hợp đồng thuê phòng & Tiền cọc (Rental Contracts)
* Lưu trữ ngày bắt đầu, ngày kết thúc, tiền đặt cọc (Deposit), giá thuê, đơn giá điện (đ/kWh), đơn giá nước (đ/m3), phí rác, wifi.
* **Giao dịch Transaction**: Khi tạo hợp đồng thành công -> Phòng tự động chuyển sang trạng thái `OCCUPIED`. Khi thanh lý hợp đồng -> Phòng tự động hoàn về trạng thái `AVAILABLE`.

### 2.3. Phân hệ Ghi điện nước & Tự động xuất hóa đơn (Billing & Utility Meters)
* Chủ trọ chọn phòng -> Hệ thống tự động truy xuất chỉ số điện/nước cũ của tháng trước.
* Nhập chỉ số mới -> Hệ thống tự động tính:
  * Số kWh điện tiêu thụ $\times$ Đơn giá điện.
  * Số m3 nước tiêu thụ $\times$ Đơn giá nước.
  * Tự động cộng tiền phòng, phí rác, phí wifi và phát sinh khác -> Xuất ra **Phiếu Báo Tiền Phòng**.
* Hỗ trợ in hóa đơn nhiệt hoặc chụp gửi Zalo kèm mã VietQR chuyển khoản nhanh.

### 2.4. Phân hệ Khách thuê & Khai báo tạm trú (Tenants & Residence Status)
* Quản lý họ tên, số điện thoại, số CCCD 12 số, quê quán.
* Cột trạng thái **Đã khai báo tạm trú công an** (Đỏ/Xanh) giúp chủ trọ không bị bỏ sót thủ tục pháp lý.

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE ERD)

Dự án sử dụng cơ sở dữ liệu quan hệ quản lý bằng **Prisma ORM**, gồm các thực thể:
1. **User**: `id`, `username`, `password`, `fullName`, `role` (`LANDLORD`, `STAFF`), `phone`.
2. **Room**: `id`, `roomNumber`, `floor`, `area`, `basePrice`, `status` (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`), `amenities`, `maxRenters`.
3. **Tenant**: `id`, `fullName`, `phone`, `identityCard`, `dateOfBirth`, `hometown`, `hasTemporaryResidence`, `currentRoomId`.
4. **Contract**: `id`, `contractCode`, `roomId`, `tenantId`, `startDate`, `endDate`, `depositAmount`, `rentalPrice`, `electricityRate`, `waterRate`, `garbageFee`, `internetFee`, `status` (`ACTIVE`, `ENDED`).
5. **MeterReading**: `id`, `roomId`, `monthYear`, `oldElectricity`, `newElectricity`, `usedElectricity`, `oldWater`, `newWater`, `usedWater`, `readingDate`.
6. **Invoice**: `id`, `invoiceCode`, `roomId`, `contractId`, `monthYear`, `roomFee`, `electricityFee`, `waterFee`, `garbageFee`, `internetFee`, `otherFees`, `totalAmount`, `paidAmount`, `status` (`UNPAID`, `PAID`), `paymentDate`, `paymentMethod`.

---

## 4. KỊCH BẢN THUYẾT TRÌNH BẢO VỆ TRƯỚC HỘI ĐỒNG (5 BƯỚC)

1. **Bước 1: Sơ đồ phòng trực quan**:
   * Mở tab **Sơ Đồ Phòng**. Giới thiệu cách bố trí phòng theo tầng với các màu sắc trực quan (Xanh = Trống, Cam = Đang thuê).
2. **Bước 2: Lập hợp đồng cho thuê phòng**:
   * Vào tab **Hợp Đồng** -> Bấm **"Lập Hợp Đồng Mới"** -> Chọn 1 phòng trống (Ví dụ P.103) -> Chọn khách thuê -> Điền tiền cọc và giá thuê -> Bấm Lưu.
   * Quay lại tab **Sơ Đồ Phòng**: Chỉ cho hội đồng thấy phòng P.103 từ màu xanh trống đã lập tức chuyển sang màu cam (Đang thuê) với tên khách thuê vừa ký.
3. **Bước 3: Ghi điện nước & Tự động tính tiền**:
   * Vào tab **Tính Tiền & Hóa Đơn** -> Bấm **"Ghi Chỉ Số & Lập Hóa Đơn"**.
   * Chọn phòng -> Chỉ số điện cũ và nước cũ tự động hiển thị -> Nhập chỉ số mới -> Hệ thống tự động tính thành tiền điện nước theo biểu phí hợp đồng.
4. **Bước 4: Xuất hóa đơn & Phiếu thu tiền phòng**:
   * Danh sách hóa đơn hiện ra -> Bấm **"Xem / In"** -> Mở ra Phiếu thu tiền phòng chi tiết: Tiền phòng + Điện + Nước + Rác + Wifi + Mã QR thanh toán.
   * Bấm nút **"Đã Thu Tiền"** -> Trạng thái chuyển sang Đã Thu (Màu xanh).
5. **Bước 5: Báo cáo tài chính & Doanh thu**:
   * Mở tab **Thống Kê**: Thấy được Tỷ lệ lấp đầy phòng (%), Tổng doanh thu dự kiến, Thực thu và Tiền nợ phòng.
   * Mục **Hợp đồng sắp hết hạn trong 30 ngày** cảnh báo chủ trọ các phòng cần gia hạn hợp đồng.
