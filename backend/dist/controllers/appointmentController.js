import { prisma } from '../prisma.js';
// ==========================================
// 1. CÔNG KHAI: NGƯỜI XEM PHÒNG ĐẶT LỊCH
// ==========================================
export const createPublicAppointment = async (req, res) => {
    try {
        const { fullName, phone, email, roomId, preferredDate, message } = req.body;
        if (!fullName || !phone || !roomId || !preferredDate) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ: Họ tên, Số điện thoại, Phòng muốn xem và Ngày giờ hẹn.' });
        }
        const rId = parseInt(roomId);
        const room = await prisma.room.findUnique({
            where: { id: rId },
            include: { property: true }
        });
        if (!room || room.isArchived) {
            return res.status(404).json({ message: 'Phòng được chọn không tồn tại hoặc đã ngưng cho thuê.' });
        }
        const code = `LH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const appointment = await prisma.viewingAppointment.create({
            data: {
                appointmentCode: code,
                roomId: rId,
                fullName,
                phone,
                email,
                preferredDate: new Date(preferredDate),
                message,
                status: 'PENDING'
            }
        });
        return res.status(201).json({
            message: 'Gửi yêu cầu đặt lịch xem phòng thành công! Chủ nhà sẽ liên hệ với bạn trong thời gian sớm nhất.',
            appointmentCode: code,
            appointment
        });
    }
    catch (error) {
        console.error('Lỗi đặt lịch xem phòng:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
// ==========================================
// 2. CHỦ NHÀ QUẢN LÝ LỊCH HẸN
// ==========================================
export const getAppointments = async (req, res) => {
    try {
        const { status, roomId } = req.query;
        const whereClause = {};
        if (status)
            whereClause.status = status;
        if (roomId)
            whereClause.roomId = parseInt(roomId);
        const appointments = await prisma.viewingAppointment.findMany({
            where: whereClause,
            include: {
                room: {
                    include: {
                        property: true,
                        floor: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(appointments);
    }
    catch (error) {
        console.error('Lỗi danh sách lịch hẹn:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const updateAppointmentStatus = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { status, ownerNote, suggestedDate } = req.body;
        const appointment = await prisma.viewingAppointment.findUnique({ where: { id } });
        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        }
        const updated = await prisma.viewingAppointment.update({
            where: { id },
            data: {
                status: status || appointment.status,
                ownerNote: ownerNote !== undefined ? ownerNote : appointment.ownerNote,
                suggestedDate: suggestedDate ? new Date(suggestedDate) : appointment.suggestedDate
            }
        });
        return res.json({ message: 'Cập nhật lịch hẹn thành công!', appointment: updated });
    }
    catch (error) {
        console.error('Lỗi cập nhật lịch hẹn:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const convertToTenant = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const appointment = await prisma.viewingAppointment.findUnique({
            where: { id },
            include: { room: true }
        });
        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        }
        // Kiểm tra xem đã có hồ sơ tenant với số điện thoại này chưa
        let tenant = await prisma.tenantProfile.findUnique({
            where: { phone: appointment.phone }
        });
        if (!tenant) {
            tenant = await prisma.tenantProfile.create({
                data: {
                    fullName: appointment.fullName,
                    phone: appointment.phone,
                    email: appointment.email,
                    identityNumber: `CCCD-${appointment.phone}`, // Tạm thời
                    currentRoomId: appointment.roomId
                }
            });
        }
        // Đánh dấu lịch hẹn là đã hoàn tất
        await prisma.viewingAppointment.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                ownerNote: 'Đã chốt thuê và chuyển sang hồ sơ người thuê.'
            }
        });
        return res.json({
            message: 'Chuyển thông tin khách xem phòng sang hồ sơ người thuê thành công!',
            tenant,
            roomId: appointment.roomId
        });
    }
    catch (error) {
        console.error('Lỗi chuyển đổi khách xem phòng:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
