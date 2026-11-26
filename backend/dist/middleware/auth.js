import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
const JWT_SECRET = process.env.JWT_SECRET || 'smarttro_super_secret_jwt_key_2026';
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Kiểm tra người dùng còn tồn tại và đang hoạt động không
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { tenantProfile: true }
        });
        if (!user || !user.isActive) {
            return res.status(403).json({ message: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
        }
        req.user = {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            tenantProfileId: user.tenantProfile?.id,
            roomId: user.tenantProfile?.currentRoomId || undefined,
            mustChangePassword: user.mustChangePassword
        };
        next();
    }
    catch (err) {
        return res.status(403).json({ message: 'Phiên làm việc hết hạn hoặc không hợp lệ.' });
    }
};
export const requireOwner = (req, res, next) => {
    if (!req.user || req.user.role !== 'OWNER') {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng của Chủ nhà trọ.' });
    }
    next();
};
export const requireTenant = (req, res, next) => {
    if (!req.user || req.user.role !== 'TENANT') {
        return res.status(403).json({ message: 'Chức năng chỉ dành cho Người thuê trọ.' });
    }
    next();
};
