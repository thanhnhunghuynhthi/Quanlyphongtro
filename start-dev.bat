@echo off
chcp 65001 > nul
echo ===================================================================
echo   HỆ THỐNG QUẢN LÝ PHÒNG TRỌ ^& CĂN HỘ CHO THUÊ (SMARTTRO PRO)
echo ===================================================================
echo.

set NODE_OPTIONS=--max-old-space-size=4096

echo [1/2] Đang khởi động Backend API Server (Port 5000)...
start "Backend SmartTro API - Port 5000" cmd /k "cd backend && npm run dev"

echo [2/2] Đang khởi động Frontend Web UI (Port 3000)...
start "Frontend SmartTro Web - Port 3000" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================================
echo  🚀 Hệ thống đã sẵn sàng!
echo  👉 Website công khai & cổng đăng nhập: http://localhost:3000
echo.
echo  👑 1. CHỦ NHÀ TRỌ (OWNER):
echo     - Tài khoản: chutro / 123456 (Bác Ba - Toàn quyền quản trị)
echo.
echo  👤 2. NGƯỜI THUÊ TRỌ (TENANT):
echo     - Tài khoản: khach1 / 123456 (Trần Thị Mai Phương - Phòng 101)
echo     - Tài khoản: khach2 / 123456 (Lê Hoàng Nam - Phòng 201)
echo     - Tài khoản: khach4 / 123456 (Nguyễn Thu Hà - Bắt buộc đổi pass)
echo.
echo  🌐 3. NGƯỜI XEM PHÒNG (PUBLIC VISITOR):
echo     - Truy cập trực tiếp trang chủ tìm phòng, không cần tài khoản
echo ===================================================================
echo.
timeout /t 3 > nul
start http://localhost:3000
