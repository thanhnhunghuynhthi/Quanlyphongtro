import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

// ==========================================
// 1. CHỨC NĂNG DÀNH CHO CHỦ NHÀ
// ==========================================

export const getTenants = async (req: AuthRequest, res: Response) => {
  try {
    const { search, roomId } = req.query;

    const whereClause: any = {};

    if (roomId) {
      whereClause.currentRoomId = parseInt(roomId as string);
    }

    if (search) {
      const q = (search as string).trim();
      whereClause.OR = [
        { fullName: { contains: q } },
        { phone: { contains: q } },
        { identityNumber: { contains: q } },
        { hometown: { contains: q } }
      ];
    }

    const tenants = await prisma.tenantProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isActive: true,
            mustChangePassword: true,
            createdAt: true
          }
        },
        currentRoom: {
          include: {
            property: true
          }
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(tenants);
  } catch (error) {
    console.error('Lỗi lấy danh sách người thuê:', error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const getTenantById = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const tenant = await prisma.tenantProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isActive: true,
            mustChangePassword: true,
            avatar: true
          }
        },
        currentRoom: {
          include: {
            property: true,
            floor: true
          }
        },
        contracts: {
          include: {
            room: true,
            occupants: true,
            invoices: {
              orderBy: { period: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ người thuê.' });
    }

    return res.json(tenant);
  } catch (error) {
    console.error('Lỗi chi tiết người thuê:', error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const createTenant = async (req: AuthRequest, res: Response) => {
  try {
    const {
      fullName,
      phone,
      email,
      identityNumber,
      identityIssueDate,
      identityIssuePlace,
      dateOfBirth,
      gender,
      hometown,
      hasTemporaryResidence,
      currentRoomId
    } = req.body;

    if (!fullName || !phone || !identityNumber) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên, số điện thoại và CCCD.' });
    }

    const existingPhone = await prisma.tenantProfile.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: 'Số điện thoại này đã tồn tại trong danh sách khách thuê.' });
    }

    const tenant = await prisma.tenantProfile.create({
      data: {
        fullName,
        phone,
        email,
        identityNumber,
        identityIssueDate: identityIssueDate ? new Date(identityIssueDate) : null,
        identityIssuePlace,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || 'KHAC',
        hometown,
        hasTemporaryResidence: Boolean(hasTemporaryResidence),
        currentRoomId: currentRoomId ? parseInt(currentRoomId) : null
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_TENANT',
        entity: 'TenantProfile',
        entityId: String(tenant.id),
        details: `Tạo hồ sơ khách thuê mới: ${fullName} (${phone})`
      }
    });

    return res.status(201).json({ message: 'Thêm hồ sơ người thuê thành công!', tenant });
  } catch (error: any) {
    console.error('Lỗi tạo người thuê:', error);
    return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const updateTenant = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const {
      fullName,
      phone,
      email,
      identityNumber,
      identityIssueDate,
      identityIssuePlace,
      dateOfBirth,
      gender,
      hometown,
      hasTemporaryResidence,
      currentRoomId
    } = req.body;

    const existing = await prisma.tenantProfile.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ người thuê.' });
    }

    const updated = await prisma.tenantProfile.update({
      where: { id },
      data: {
        fullName: fullName || existing.fullName,
        phone: phone || existing.phone,
        email: email !== undefined ? email : existing.email,
        identityNumber: identityNumber || existing.identityNumber,
        identityIssueDate: identityIssueDate ? new Date(identityIssueDate) : existing.identityIssueDate,
        identityIssuePlace: identityIssuePlace !== undefined ? identityIssuePlace : existing.identityIssuePlace,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existing.dateOfBirth,
        gender: gender || existing.gender,
        hometown: hometown !== undefined ? hometown : existing.hometown,
        hasTemporaryResidence: hasTemporaryResidence !== undefined ? Boolean(hasTemporaryResidence) : existing.hasTemporaryResidence,
        currentRoomId: currentRoomId !== undefined ? (currentRoomId ? parseInt(currentRoomId) : null) : existing.currentRoomId
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_TENANT',
        entity: 'TenantProfile',
        entityId: String(id),
        details: `Cập nhật thông tin người thuê: ${updated.fullName}`
      }
    });

    return res.json({ message: 'Cập nhật hồ sơ thành công!', tenant: updated });
  } catch (error: any) {
    console.error('Lỗi cập nhật người thuê:', error);
    return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

// ==========================================
// 2. CHỨC NĂNG DÀNH CHO CHÍNH NGƯỜI THUÊ (TENANT ISOLATION)
// ==========================================

export const getMyTenantProfile = async (req: AuthRequest, res: Response) => {
  try {
    const tenantProfileId = req.user?.tenantProfileId;
    if (!tenantProfileId) {
      return res.status(404).json({ message: 'Tài khoản chưa được liên kết với hồ sơ người thuê.' });
    }

    const tenant = await prisma.tenantProfile.findUnique({
      where: { id: tenantProfileId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        },
        currentRoom: {
          include: {
            property: true,
            floor: true,
            images: true,
            roomAmenities: { include: { amenity: true } }
          }
        },
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            occupants: true,
            contractServices: { include: { service: true } }
          }
        }
      }
    });

    return res.json(tenant);
  } catch (error) {
    console.error('Lỗi thông tin cá nhân người thuê:', error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const updateMyTenantProfile = async (req: AuthRequest, res: Response) => {
  try {
    const tenantProfileId = req.user?.tenantProfileId;
    if (!tenantProfileId) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ người thuê.' });
    }

    const { phone, email, dateOfBirth, hometown, identityIssuePlace } = req.body;

    const updated = await prisma.tenantProfile.update({
      where: { id: tenantProfileId },
      data: {
        phone: phone || undefined,
        email: email !== undefined ? email : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        hometown: hometown !== undefined ? hometown : undefined,
        identityIssuePlace: identityIssuePlace !== undefined ? identityIssuePlace : undefined
      }
    });

    return res.json({ message: 'Cập nhật thông tin cá nhân thành công!', profile: updated });
  } catch (error: any) {
    console.error('Lỗi người thuê cập nhật hồ sơ:', error);
    return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};
