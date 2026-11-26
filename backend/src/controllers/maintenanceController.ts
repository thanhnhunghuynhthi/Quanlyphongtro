import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getMaintenanceRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, category, urgency, roomId } = req.query;

    const whereClause: any = {};

    // ==========================================
    // QUY TẮC BẢO MẬT: NGƯỜI THUÊ CHỈ XEM YÊU CẦU CỦA PHÒNG MÌNH
    // ==========================================
    if (req.user?.role === 'TENANT') {
      const tenantRoomId = req.user.roomId;
      if (!tenantRoomId) {
        return res.json([]);
      }
      whereClause.roomId = tenantRoomId;
    } else {
      // Chủ nhà có thể lọc theo phòng
      if (roomId) whereClause.roomId = parseInt(roomId as string);
    }

    if (status) whereClause.status = status as string;
    if (category) whereClause.category = category as string;
    if (urgency) whereClause.urgency = urgency as string;

    const requests = await prisma.maintenanceRequest.findMany({
      where: whereClause,
      include: {
        room: {
          include: { property: true }
        },
        createdByUser: {
          select: { fullName: true, phone: true }
        },
        updates: {
          include: {
            updatedByUser: { select: { fullName: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(requests);
  } catch (error) {
    console.error('Lỗi lấy danh sách sửa chữa:', error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const createMaintenanceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, urgency, description, imageUrl, roomId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và nội dung phản hồi.' });
    }

    const targetRoomId = req.user?.role === 'TENANT' || !roomId ? req.user?.roomId : parseInt(roomId);
    if (!targetRoomId) {
      return res.status(400).json({ message: 'Tài khoản cần có phòng để gửi phản hồi.' });
    }

    const code = `SC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest = await prisma.maintenanceRequest.create({
      data: {
        requestCode: code,
        roomId: targetRoomId,
        tenantId: req.user?.tenantProfileId,
        createdByUserId: req.user?.id,
        title,
        category: category || 'ELECTRICAL',
        urgency: urgency || 'NORMAL',
        description,
        imageUrl,
        status: 'PENDING'
      }
    });

    // Tạo update khởi đầu
    await prisma.maintenanceUpdate.create({
      data: {
        requestId: newRequest.id,
        updatedByUserId: req.user?.id,
        status: 'PENDING',
        message: 'Đã tiếp nhận phản hồi.'
      }
    });

    return res.status(201).json({
      message: 'Đã gửi phản hồi cho chủ nhà.',
      request: newRequest
    });
  } catch (error: any) {
    console.error('Lỗi tạo yêu cầu sửa chữa:', error);
    return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const addMaintenanceUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(String(req.params.id));
    const { message, status } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung cập nhật tiến trình.' });
    }

    const request = await prisma.maintenanceRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu sửa chữa.' });
    }

    // Tenant authorization check
    if (req.user?.role === 'TENANT' && request.roomId !== req.user.roomId) {
      return res.status(403).json({ message: 'Bạn không có quyền can thiệp vào yêu cầu của phòng khác.' });
    }

    const newStatus = status || request.status;

    const update = await prisma.maintenanceUpdate.create({
      data: {
        requestId,
        updatedByUserId: req.user?.id,
        status: newStatus,
        message
      }
    });

    // Nếu đổi status thì update trên request
    if (status && status !== request.status) {
      await prisma.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status,
          resolvedAt: status === 'RESOLVED' ? new Date() : request.resolvedAt
        }
      });
    }

    return res.json({ message: 'Thêm cập nhật tiến trình thành công!', update });
  } catch (error: any) {
    console.error('Lỗi thêm update sửa chữa:', error);
    return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const updateMaintenanceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status, estimatedCost, resolutionNote } = req.body;

    const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu sửa chữa.' });
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: status || request.status,
        estimatedCost: estimatedCost !== undefined ? parseFloat(estimatedCost) : request.estimatedCost,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined
      }
    });

    if (resolutionNote) {
      await prisma.maintenanceUpdate.create({
        data: {
          requestId: id,
          updatedByUserId: req.user?.id,
          status: status || request.status,
          message: resolutionNote
        }
      });
    }

    return res.json({ message: 'Cập nhật trạng thái sửa chữa thành công!', request: updated });
  } catch (error: any) {
    console.error('Lỗi đổi trạng thái sửa chữa:', error);
    return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};
