import { Response } from 'express';
import { prisma } from '../prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Thống kê phòng
    const totalRooms = await prisma.room.count({ where: { isArchived: false } });
    const availableRooms = await prisma.room.count({ where: { status: 'AVAILABLE', isArchived: false } });
    const occupiedRooms = await prisma.room.count({ where: { status: 'OCCUPIED', isArchived: false } });
    const maintenanceRooms = await prisma.room.count({ where: { status: 'MAINTENANCE', isArchived: false } });

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // 2. Thống kê tài chính tháng hiện tại
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Tổng tiền hóa đơn phát hành trong tháng
    const monthInvoices = await prisma.invoice.findMany({
      where: {
        period: currentPeriod,
        status: { not: 'CANCELLED' }
      }
    });

    const monthBilled = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Tổng tiền thực thu trong tháng (dựa trên bảng Payment theo ngày thanh toán)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthPayments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const monthCollected = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    // Tổng công nợ còn phải thu toàn bộ hệ thống
    const allUnpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        remainingAmount: { gt: 0 }
      }
    });

    const totalOutstandingDebt = allUnpaidInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

    // 3. Hợp đồng sắp hết hạn trong vòng 30 ngày
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: thirtyDaysLater
        }
      },
      include: {
        room: true,
        tenant: true
      },
      orderBy: { endDate: 'asc' }
    });

    // 4. Lịch hẹn xem phòng sắp tới (PENDING hoặc CONFIRMED)
    const upcomingAppointments = await prisma.viewingAppointment.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        preferredDate: { gte: now }
      },
      include: {
        room: { include: { property: true } }
      },
      orderBy: { preferredDate: 'asc' },
      take: 5
    });

    // 5. Yêu cầu sửa chữa chưa xử lý xong
    const pendingMaintenance = await prisma.maintenanceRequest.findMany({
      where: {
        status: { in: ['PENDING', 'RECEIVED', 'IN_PROGRESS'] }
      },
      include: {
        room: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 6. Biểu đồ doanh thu 6 tháng gần nhất
    const monthlyChartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const pInvoices = await prisma.invoice.findMany({
        where: { period: p, status: { not: 'CANCELLED' } }
      });

      const pStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const pEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const pPayments = await prisma.payment.findMany({
        where: { paymentDate: { gte: pStart, lte: pEnd } }
      });

      const collected = pPayments.reduce((s, pay) => s + pay.amount, 0);
      const billedRoom = pInvoices.reduce((s, inv) => s + inv.roomAmount, 0);
      const billedServices = pInvoices.reduce((s, inv) => s + inv.servicesAmount, 0);

      monthlyChartData.push({
        period: p,
        label: `Thg ${d.getMonth() + 1}/${d.getFullYear()}`,
        thucThu: collected,
        tienPhong: billedRoom,
        dienNuocDichVu: billedServices,
        tongHoaDon: billedRoom + billedServices
      });
    }

    return res.json({
      roomStats: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms,
        occupancyRate
      },
      financialStats: {
        currentPeriod,
        monthCollected,
        monthBilled,
        totalOutstandingDebt,
        unpaidInvoicesCount: allUnpaidInvoices.length
      },
      expiringContracts,
      upcomingAppointments,
      pendingMaintenance,
      monthlyChartData
    });
  } catch (error) {
    console.error('Lỗi tổng quan dashboard:', error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const getDebtsReport = async (req: AuthRequest, res: Response) => {
  try {
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        remainingAmount: { gt: 0 }
      },
      include: {
        room: { include: { property: true } },
        contract: { include: { tenant: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const debts = unpaidInvoices.map(inv => ({
      invoiceId: inv.id,
      invoiceCode: inv.invoiceCode,
      period: inv.period,
      property: inv.room.property.name,
      roomNumber: inv.room.roomNumber,
      tenantName: inv.contract.tenant.fullName,
      tenantPhone: inv.contract.tenant.phone,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      remainingAmount: inv.remainingAmount,
      dueDate: inv.dueDate,
      isOverdue: inv.dueDate < now
    }));

    return res.json(debts);
  } catch (error) {
    console.error('Lỗi lấy báo cáo công nợ:', error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};

export const exportReportCSV = async (req: AuthRequest, res: Response) => {
  try {
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: { not: 'CANCELLED' }
      },
      include: {
        room: { include: { property: true } },
        contract: { include: { tenant: true } },
        payments: true
      },
      orderBy: { period: 'desc' }
    });

    // UTF-8 BOM để Excel hiển thị tiếng Việt không bị lỗi font
    let csvContent = '\uFEFF';
    csvContent += 'Mã hóa đơn,Khu trọ,Phòng,Người thuê,Số điện thoại,Kỳ thu,Hạn nộp,Tiền phòng (VNĐ),Điện nước & Dịch vụ (VNĐ),Tổng hóa đơn (VNĐ),Đã thanh toán (VNĐ),Còn nợ (VNĐ),Trạng thái\n';

    for (const inv of unpaidInvoices) {
      const statusVN = inv.status === 'PAID' ? 'Đã thanh toán' : (inv.status === 'PARTIALLY_PAID' ? 'Trả 1 phần' : 'Chưa thanh toán');
      csvContent += `"${inv.invoiceCode}","${inv.room.property.name}","${inv.room.roomNumber}","${inv.contract.tenant.fullName}","${inv.contract.tenant.phone}","${inv.period}","${new Date(inv.dueDate).toLocaleDateString('vi-VN')}",${inv.roomAmount},${inv.servicesAmount},${inv.totalAmount},${inv.paidAmount},${inv.remainingAmount},"${statusVN}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=Bao_Cao_Doanh_Thu_Cong_No_SmartTro.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Lỗi xuất file CSV:', error);
    return res.status(500).json({ message: 'Lỗi xuất file báo cáo.' });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { fullName: true, username: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json(logs);
  } catch (error) {
    console.error('Lỗi lấy nhật ký kiểm toán:', error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
  }
};
