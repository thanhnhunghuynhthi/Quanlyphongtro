import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
const JWT_SECRET = process.env.JWT_SECRET || 'smarttro_super_secret_jwt_key_2026';
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
        }
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                tenantProfile: {
                    include: {
                        currentRoom: {
                            include: {
                                property: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa bởi Chủ nhà. Vui lòng liên hệ chủ nhà trọ.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
        }
        const token = jwt.sign({
            id: user.id,
            username: user.username,
            role: user.role
        }, JWT_SECRET, { expiresIn: '7d' });
        // Ghi audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                entity: 'User',
                entityId: String(user.id),
                details: `Người dùng ${user.fullName} (${user.role}) đăng nhập thành công`
            }
        });
        return res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                phone: user.phone,
                email: user.email,
                avatar: user.avatar,
                mustChangePassword: user.mustChangePassword,
                tenantProfile: user.tenantProfile
            }
        });
    }
    catch (error) {
        console.error('Lỗi đăng nhập:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { oldPassword, newPassword } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Chưa xác thực người dùng.' });
        }
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
        }
        const newHashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: newHashed,
                mustChangePassword: false
            }
        });
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CHANGE_PASSWORD',
                entity: 'User',
                entityId: String(userId),
                details: `Người dùng ${user.fullName} đã thay đổi mật khẩu thành công`
            }
        });
        return res.json({ message: 'Đổi mật khẩu thành công!' });
    }
    catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Chưa xác thực người dùng.' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenantProfile: {
                    include: {
                        currentRoom: {
                            include: {
                                property: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });
        }
        return res.json({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            phone: user.phone,
            email: user.email,
            avatar: user.avatar,
            mustChangePassword: user.mustChangePassword,
            tenantProfile: user.tenantProfile
        });
    }
    catch (error) {
        console.error('Lỗi lấy thông tin cá nhân:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
// ==========================================
// QUẢN LÝ TÀI KHOẢN NGƯỜI THUÊ (CHO CHỦ NHÀ)
// ==========================================
export const getTenantUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: 'TENANT' },
            include: {
                tenantProfile: {
                    include: {
                        currentRoom: {
                            include: {
                                property: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(users);
    }
    catch (error) {
        console.error('Lỗi danh sách tài khoản người thuê:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const provisionTenantAccount = async (req, res) => {
    try {
        const { username, fullName, phone, email, identityNumber, roomId, hometown, temporaryPassword } = req.body;
        if (!username || !fullName || !phone || !identityNumber) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ: Tên đăng nhập, Họ tên, Số điện thoại và CCCD.' });
        }
        // Kiểm tra trùng username hoặc phone hoặc identityNumber
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập này đã tồn tại trong hệ thống.' });
        }
        const existingPhone = await prisma.tenantProfile.findUnique({ where: { phone } });
        if (existingPhone) {
            return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký hồ sơ khách thuê.' });
        }
        const initialPassword = temporaryPassword || '123456';
        const passwordHash = await bcrypt.hash(initialPassword, 10);
        const newUser = await prisma.user.create({
            data: {
                username,
                password: passwordHash,
                fullName,
                role: 'TENANT',
                phone,
                email,
                isActive: true,
                mustChangePassword: true // Bắt buộc đổi mật khẩu lần đầu
            }
        });
        const tenantProfile = await prisma.tenantProfile.create({
            data: {
                userId: newUser.id,
                fullName,
                phone,
                email,
                identityNumber,
                hometown,
                currentRoomId: roomId ? parseInt(roomId) : null
            }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'PROVISION_ACCOUNT',
                entity: 'User',
                entityId: String(newUser.id),
                details: `Chủ nhà đã cấp tài khoản mới [${username}] cho người thuê ${fullName}`
            }
        });
        return res.status(201).json({
            message: 'Cấp tài khoản người thuê thành công! Mật khẩu mặc định là: 123456',
            user: newUser,
            tenantProfile
        });
    }
    catch (error) {
        console.error('Lỗi cấp tài khoản:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const toggleUserStatus = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { isActive } = req.body;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        if (user.role === 'OWNER') {
            return res.status(400).json({ message: 'Không thể khóa tài khoản Chủ nhà trọ.' });
        }
        const updated = await prisma.user.update({
            where: { id },
            data: { isActive: Boolean(isActive) }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'TOGGLE_USER_STATUS',
                entity: 'User',
                entityId: String(id),
                details: `Chủ nhà đã ${isActive ? 'mở khóa' : 'khóa'} tài khoản [${user.username}] của ${user.fullName}`
            }
        });
        return res.json({
            message: `Đã ${isActive ? 'mở khóa' : 'khóa'} tài khoản thành công!`,
            user: updated
        });
    }
    catch (error) {
        console.error('Lỗi cập nhật trạng thái người dùng:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const resetUserPassword = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        const defaultPassHash = await bcrypt.hash('123456', 10);
        await prisma.user.update({
            where: { id },
            data: {
                password: defaultPassHash,
                mustChangePassword: true
            }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'RESET_PASSWORD',
                entity: 'User',
                entityId: String(id),
                details: `Chủ nhà đã đặt lại mật khẩu về mặc định cho tài khoản [${user.username}]`
            }
        });
        return res.json({ message: 'Đã đặt lại mật khẩu về mặc định (123456). Người thuê sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.' });
    }
    catch (error) {
        console.error('Lỗi reset mật khẩu:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
