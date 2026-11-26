import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (req.user?.role === 'TENANT') {
      // Người thuê nhận danh sách thông báo gửi cho họ
      const list = await prisma.notificationRecipient.findMany({
        where: { userId },
        include: {
          notification: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(list.map(item => ({
        ...item.notification,
        isRead: item.isRead,
        readAt: item.readAt,
        recipientId: item.id
      })));
    }

    // Chủ nhà xem toàn bộ thông báo đã phát
    const notifications = await prisma.notification.findMany({
      include: {
        recipients: {
          include: {
            user: { select: { fullName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(notifications);
  } catch (error) {
    console.error('Lỗi lấy thông báo:', error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, type, targetType, targetPropertyId, targetRoomId, targetUserIds } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề và nội dung thông báo.' });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        type: type || 'GENERAL',
        targetType: targetType || 'ALL',
        targetPropertyId: targetPropertyId ? parseInt(targetPropertyId) : null,
        targetRoomId: targetRoomId ? parseInt(targetRoomId) : null
      }
    });

    // Xác định danh sách người nhận (Users)
    let recipientUsers: { id: number }[] = [];

    if (targetType === 'ALL' || !targetType) {
      recipientUsers = await prisma.user.findMany({
        where: { role: 'TENANT', isActive: true },
        select: { id: true }
      });
    } else if (targetType === 'PROPERTY' && targetPropertyId) {
      recipientUsers = await prisma.user.findMany({
        where: {
          role: 'TENANT',
          isActive: true,
          tenantProfile: {
            currentRoom: {
              propertyId: parseInt(targetPropertyId)
            }
          }
        },
        select: { id: true }
      });
    } else if (targetType === 'ROOM' && targetRoomId) {
      recipientUsers = await prisma.user.findMany({
        where: {
          role: 'TENANT',
          isActive: true,
          tenantProfile: {
            currentRoomId: parseInt(targetRoomId)
          }
        },
        select: { id: true }
      });
    } else if (targetUserIds && Array.isArray(targetUserIds)) {
      recipientUsers = targetUserIds.map((uId: any) => ({ id: parseInt(uId) }));
    }

    for (const u of recipientUsers) {
      await prisma.notificationRecipient.create({
        data: {
          notificationId: notification.id,
          userId: u.id,
          isRead: false
        }
      });
    }

    return res.status(201).json({
      message: `Đã gửi thông báo thành công tới ${recipientUsers.length} người thuê!`,
      notification
    });
  } catch (error: any) {
    console.error('Lỗi tạo thông báo:', error);
    return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(String(req.params.id));
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Chưa xác thực người dùng.' });
    }

    await prisma.notificationRecipient.updateMany({
      where: {
        notificationId,
        userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return res.json({ message: 'Đã đánh dấu đã đọc thông báo.' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi cập nhật trạng thái thông báo.' });
  }
};
