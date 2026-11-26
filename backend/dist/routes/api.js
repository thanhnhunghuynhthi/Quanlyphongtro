import { Router } from 'express';
import { login, changePassword, getMe, getTenantUsers, provisionTenantAccount, toggleUserStatus, resetUserPassword } from '../controllers/authController.js';
import { getPublicRooms, getPublicRoomById, getRooms, getRoomById, createRoom, updateRoom, deleteRoom, getProperties, createProperty, getAmenities } from '../controllers/roomController.js';
import { getTenants, getTenantById, createTenant, updateTenant, getMyTenantProfile, updateMyTenantProfile } from '../controllers/tenantController.js';
import { getContracts, getContractById, createContract, liquidateContract, extendContract, getMyContracts } from '../controllers/contractController.js';
import { getServices, updateService, getMeterReadings, recordMeterReading, getInvoices, getInvoiceById, createInvoice, adjustInvoice, recordPayment, submitPaymentProof, reviewPaymentProof, getMyInvoices } from '../controllers/billingController.js';
import { createPublicAppointment, getAppointments, updateAppointmentStatus, convertToTenant } from '../controllers/appointmentController.js';
import { getMaintenanceRequests, createMaintenanceRequest, addMaintenanceUpdate, updateMaintenanceStatus } from '../controllers/maintenanceController.js';
import { getNotifications, createNotification, markNotificationRead } from '../controllers/notificationController.js';
import { getDashboardStats, getDebtsReport, exportReportCSV, getAuditLogs } from '../controllers/dashboardController.js';
import { authenticateToken, requireOwner } from '../middleware/auth.js';
const router = Router();
// ==========================================
// 1. CÔNG KHAI (PUBLIC - KHÔNG CẦN TÀI KHOẢN)
// ==========================================
router.get('/public/rooms', getPublicRooms);
router.get('/public/rooms/:id', getPublicRoomById);
router.post('/public/appointments', createPublicAppointment);
router.get('/public/properties', getProperties);
router.get('/public/amenities', getAmenities);
// ==========================================
// 2. XÁC THỰC & ĐỔI MẬT KHẨU
// ==========================================
router.post('/auth/login', login);
router.post('/auth/change-password', authenticateToken, changePassword);
router.get('/auth/me', authenticateToken, getMe);
// ==========================================
// 3. KHU VỰC NGƯỜI THUÊ (TENANT PORTAL)
// ==========================================
router.get('/tenant/profile', authenticateToken, getMyTenantProfile);
router.put('/tenant/profile', authenticateToken, updateMyTenantProfile);
router.get('/tenant/contracts', authenticateToken, getMyContracts);
router.get('/tenant/invoices', authenticateToken, getMyInvoices);
router.post('/invoices/:id/submissions', authenticateToken, submitPaymentProof);
// Dùng chung (Cả Owner và Tenant có bộ lọc cách ly)
router.get('/maintenance', authenticateToken, getMaintenanceRequests);
router.post('/maintenance', authenticateToken, createMaintenanceRequest);
router.post('/maintenance/:id/updates', authenticateToken, addMaintenanceUpdate);
router.get('/notifications', authenticateToken, getNotifications);
router.patch('/notifications/:id/read', authenticateToken, markNotificationRead);
// ==========================================
// 4. KHU VỰC CHỦ NHÀ (OWNER ONLY - RBAC)
// ==========================================
// Quản lý tài khoản người thuê
router.get('/users/tenants', authenticateToken, requireOwner, getTenantUsers);
router.post('/users/tenants/provision', authenticateToken, requireOwner, provisionTenantAccount);
router.patch('/users/:id/status', authenticateToken, requireOwner, toggleUserStatus);
router.post('/users/:id/reset-password', authenticateToken, requireOwner, resetUserPassword);
// Quản lý khu trọ, phòng & tiện ích
router.get('/properties', authenticateToken, requireOwner, getProperties);
router.post('/properties', authenticateToken, requireOwner, createProperty);
router.get('/rooms', authenticateToken, requireOwner, getRooms);
router.get('/rooms/:id', authenticateToken, requireOwner, getRoomById);
router.post('/rooms', authenticateToken, requireOwner, createRoom);
router.put('/rooms/:id', authenticateToken, requireOwner, updateRoom);
router.delete('/rooms/:id', authenticateToken, requireOwner, deleteRoom);
router.get('/amenities', authenticateToken, requireOwner, getAmenities);
// Quản lý hồ sơ người thuê
router.get('/tenants', authenticateToken, requireOwner, getTenants);
router.get('/tenants/:id', authenticateToken, requireOwner, getTenantById);
router.post('/tenants', authenticateToken, requireOwner, createTenant);
router.put('/tenants/:id', authenticateToken, requireOwner, updateTenant);
// Quản lý hợp đồng
router.get('/contracts', authenticateToken, requireOwner, getContracts);
router.get('/contracts/:id', authenticateToken, requireOwner, getContractById);
router.post('/contracts', authenticateToken, requireOwner, createContract);
router.post('/contracts/:id/liquidate', authenticateToken, requireOwner, liquidateContract);
router.post('/contracts/:id/extend', authenticateToken, requireOwner, extendContract);
// Dịch vụ & Chỉ số điện nước
router.get('/services', authenticateToken, requireOwner, getServices);
router.put('/services/:id', authenticateToken, requireOwner, updateService);
router.get('/meter-readings', authenticateToken, requireOwner, getMeterReadings);
router.post('/meter-readings', authenticateToken, requireOwner, recordMeterReading);
// Hóa đơn & Thu tiền
router.get('/invoices', authenticateToken, requireOwner, getInvoices);
router.get('/invoices/:id', authenticateToken, getInvoiceById); // Tenant có thể xem chi tiết nếu đúng hóa đơn của mình
router.post('/invoices', authenticateToken, requireOwner, createInvoice);
router.put('/invoices/:id/adjust', authenticateToken, requireOwner, adjustInvoice);
router.post('/invoices/:id/payments', authenticateToken, requireOwner, recordPayment);
router.post('/submissions/:id/review', authenticateToken, requireOwner, reviewPaymentProof);
// Lịch xem phòng
router.get('/appointments', authenticateToken, requireOwner, getAppointments);
router.patch('/appointments/:id/status', authenticateToken, requireOwner, updateAppointmentStatus);
router.post('/appointments/:id/convert-to-tenant', authenticateToken, requireOwner, convertToTenant);
// Sửa chữa (Chủ nhà xử lý)
router.patch('/maintenance/:id/status', authenticateToken, requireOwner, updateMaintenanceStatus);
// Thông báo
router.post('/notifications', authenticateToken, requireOwner, createNotification);
// Báo cáo, Thống kê & Audit log
router.get('/dashboard/stats', authenticateToken, requireOwner, getDashboardStats);
router.get('/reports/debts', authenticateToken, requireOwner, getDebtsReport);
router.get('/reports/export-csv', authenticateToken, requireOwner, exportReportCSV);
router.get('/audit-logs', authenticateToken, requireOwner, getAuditLogs);
export default router;
