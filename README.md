# HỆ THỐNG QUẢN LÝ PHÒNG TRỌ & NHÀ CHO THUÊ TOÀN DIỆN (SMARTTRO PRO)
**Đồ án tốt nghiệp / Dự án Chuyên ngành Công nghệ Thông tin & Kỹ thuật Phần mềm**

---

## 📌 1. GIỚI THIỆU DỰ ÁN
**SmartTro Pro** là hệ thống phần mềm web hoàn chỉnh, hiện đại giúp số hóa toàn diện quy trình vận hành kinh doanh nhà trọ và căn hộ dịch vụ:
* **Giao diện người dùng**: Thiết kế chuẩn SaaS hiện đại với tone màu xanh Navy (`#0f172a`), điểm nhấn xanh ngọc (`#0d9488`), chữ rõ ràng, bố cục chuẩn mực, responsive toàn diện từ PC đến Mobile.
* **Ba phân hệ giao diện**:
  1. **Website công khai**: Tìm kiếm, lọc phòng theo giá/tiện ích, xem ảnh studio, bảng giá dịch vụ niêm yết và gửi form đặt lịch hẹn xem phòng trực tuyến.
  2. **Cổng Chủ nhà trọ (OWNER)**: Thanh điều hướng bên trái (Sidebar), Dashboard KPIs, quản lý khu trọ/tầng/phòng, hồ sơ người thuê & cấp tài khoản, hợp đồng (chống trùng lấn, in HĐ, thanh lý đối soát cọc), điện nước (chống chỉ số âm), hóa đơn (snapshot đơn giá, đa thanh toán), duyệt minh chứng bill, lịch xem phòng, sửa chữa, thông báo, báo cáo công nợ & xuất file Excel CSV UTF-8 BOM, nhật ký kiểm toán hệ thống.
  3. **Cổng Người thuê trọ (TENANT)**: Tối ưu trên điện thoại, xem phòng, hợp đồng, tra cứu hóa đơn chi tiết điện nước, thông tin chuyển khoản VietQR, gửi minh chứng thanh toán, gửi báo hỏng thiết bị & theo dõi tiến trình, nhận thông báo, đổi mật khẩu lần đầu.

---

## 🛠️ 2. CÔNG NGHỆ ÁP DỤNG
* **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts (Biểu đồ doanh thu 6 tháng), In phiếu thu và hợp đồng trực tiếp.
* **Backend**: Node.js, Express, TypeScript, Prisma ORM, JSON Web Token (JWT), Bcrypt password hashing.
* **Cơ sở dữ liệu**: Đầy đủ 22 thực thể liên kết chặt chẽ (User, TenantProfile, Property, Floor, Room, RoomImage, Amenity, RoomAmenity, Contract, ContractOccupant, Service, ContractService, MeterReading, Invoice, InvoiceItem, Payment, PaymentSubmission, ViewingAppointment, MaintenanceRequest, MaintenanceUpdate, Notification, NotificationRecipient, AuditLog).

---

## 🚀 3. HƯỚNG DẪN KHỞI CHẠY (QUICK START)

### Cách 1: Khởi động tự động bằng file Batch (Khuyên dùng trên Windows)
Nhấp đúp chuột vào file:
```cmd
start-dev.bat
```
Hệ thống sẽ tự động bật 2 cửa sổ Backend (Port 5000) và Frontend (Port 3000), sau đó mở trình duyệt tại `http://localhost:3000`.

---

### Cách 2: Khởi động thủ công bằng dòng lệnh

1. **Khởi động Backend API Server**:
   ```bash
   cd backend
   npm run dev
   ```
   *Địa chỉ API: `http://localhost:5000`*

2. **Khởi động Frontend Web Client**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Giao diện Web: `http://localhost:3000`*

3. **Chạy kiểm thử tự động 8 luồng nghiệp vụ**:
   ```bash
   cd backend
   npx tsx test-flows.ts
   ```

---

## 🔑 4. TÀI KHOẢN MẪU DÙNG THỬ (ĐÃ SEED DỮ LIỆU)

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn khi Demo |
| :--- | :--- | :---: | :--- |
| **Chủ nhà trọ (OWNER)** | `chutro` | `123456` | Toàn quyền: Xem báo cáo doanh thu & nợ phòng, lập HĐ (chống trùng lấn), thêm phòng, chốt điện nước, thanh lý hợp đồng hoàn cọc, duyệt bill. |
| **Người thuê trọ (P.101)** | `khach1` | `123456` | Xem phòng 101 SkyHome, hóa đơn tiền phòng, gửi minh chứng chuyển khoản VCB, gửi yêu cầu sửa máy lạnh. |
| **Người thuê trọ (P.201)** | `khach2` | `123456` | Xem phòng 201 SkyHome, hóa đơn trả góp đợt 1, xem lịch sử thanh toán. |
| **Người thuê trọ (P.202)** | `khach4` | `123456` | Tài khoản mới cấp: Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên. |
| **Người xem phòng (PUBLIC)** | Không cần | Không cần | Truy cập trực tiếp trang chủ tìm phòng, xem chi tiết và đặt lịch xem phòng. |

---

## 📑 5. TÀI LIỆU CHI TIẾT
Toàn bộ tài liệu phân tích nghiệp vụ, ma trận phân quyền, đặc tả Use Case, sơ đồ PlantUML (Use Case, ERD 22 thực thể, Sequence Diagram, Activity Diagram) được lưu trữ tại:
👉 `docs/TAI_LIEU_PHAN_TICH_THIET_KE_UML_SMARTTRO.md`
