import { prisma } from '../prisma.js';
// ==========================================
// 1. DÀNH CHO CHỦ NHÀ
// ==========================================
export const getContracts = async (req, res) => {
    try {
        const { status, roomId, search } = req.query;
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (roomId) {
            whereClause.roomId = parseInt(roomId);
        }
        if (search) {
            const q = search.trim();
            whereClause.OR = [
                { contractCode: { contains: q } },
                { tenant: { fullName: { contains: q } } },
                { tenant: { phone: { contains: q } } },
                { room: { roomNumber: { contains: q } } }
            ];
        }
        const contracts = await prisma.contract.findMany({
            where: whereClause,
            include: {
                room: {
                    include: { property: true }
                },
                tenant: true,
                occupants: true,
                contractServices: {
                    include: { service: true }
                },
                invoices: {
                    orderBy: { period: 'desc' },
                    take: 3
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(contracts);
    }
    catch (error) {
        console.error('Lỗi lấy danh sách hợp đồng:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const getContractById = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                room: {
                    include: {
                        property: true,
                        floor: true
                    }
                },
                tenant: {
                    include: { user: true }
                },
                occupants: true,
                contractServices: {
                    include: { service: true }
                },
                invoices: {
                    include: {
                        payments: true,
                        items: true
                    },
                    orderBy: { period: 'desc' }
                }
            }
        });
        if (!contract) {
            return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
        }
        return res.json(contract);
    }
    catch (error) {
        console.error('Lỗi chi tiết hợp đồng:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const createContract = async (req, res) => {
    try {
        const { contractCode, roomId, tenantId, startDate, endDate, rentalPrice, depositAmount, terms, note, occupants, services } = req.body;
        if (!roomId || !tenantId || !startDate || !endDate || !rentalPrice) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ: Phòng, Người thuê, Ngày bắt đầu, Ngày kết thúc và Giá thuê.' });
        }
        const rId = parseInt(roomId);
        const tId = parseInt(tenantId);
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) {
            return res.status(400).json({ message: 'Ngày kết thúc hợp đồng phải sau ngày bắt đầu.' });
        }
        // ==========================================
        // QUY TẮC BẮT BUỘC: CHỐNG CHỒNG LẤN HỢP ĐỒNG TRÊN CÙNG MỘT PHÒNG
        // ==========================================
        const overlappingContract = await prisma.contract.findFirst({
            where: {
                roomId: rId,
                status: 'ACTIVE',
                AND: [
                    { startDate: { lte: end } },
                    { endDate: { gte: start } }
                ]
            },
            include: {
                room: true,
                tenant: true
            }
        });
        if (overlappingContract) {
            return res.status(400).json({
                message: `Phòng ${overlappingContract.room.roomNumber} đã có hợp đồng [${overlappingContract.contractCode}] của khách ${overlappingContract.tenant.fullName} hiệu lực từ ${new Date(overlappingContract.startDate).toLocaleDateString('vi-VN')} đến ${new Date(overlappingContract.endDate).toLocaleDateString('vi-VN')}. Không thể tạo hợp đồng có thời gian chồng lấn!`
            });
        }
        // Tự sinh mã hợp đồng nếu chưa có
        const code = contractCode || `HD-${new Date().getFullYear()}-P${rId}-${Math.floor(100 + Math.random() * 900)}`;
        const contract = await prisma.contract.create({
            data: {
                contractCode: code,
                roomId: rId,
                tenantId: tId,
                startDate: start,
                endDate: end,
                rentalPrice: parseFloat(rentalPrice),
                depositAmount: depositAmount ? parseFloat(depositAmount) : parseFloat(rentalPrice),
                status: 'ACTIVE',
                terms: terms || 'Bên B có trách nhiệm đóng tiền phòng từ ngày 01 đến ngày 05 hàng tháng. Giữ gìn an ninh trật tự và thiết bị trong phòng.',
                note
            }
        });
        // Thêm người ở cùng
        if (occupants && Array.isArray(occupants)) {
            for (const occ of occupants) {
                if (occ.fullName) {
                    await prisma.contractOccupant.create({
                        data: {
                            contractId: contract.id,
                            fullName: occ.fullName,
                            phone: occ.phone,
                            identityNumber: occ.identityNumber,
                            relationship: occ.relationship,
                            hasTemporaryResidence: Boolean(occ.hasTemporaryResidence)
                        }
                    });
                }
            }
        }
        // Thêm dịch vụ đăng ký theo hợp đồng (snapshot giá)
        if (services && Array.isArray(services)) {
            for (const s of services) {
                await prisma.contractService.create({
                    data: {
                        contractId: contract.id,
                        serviceId: parseInt(s.serviceId),
                        customPrice: parseFloat(s.customPrice),
                        quantity: s.quantity ? parseFloat(s.quantity) : 1
                    }
                });
            }
        }
        else {
            // Mặc định nạp các dịch vụ hiện có trong hệ thống
            const defaultServices = await prisma.service.findMany();
            for (const ds of defaultServices) {
                await prisma.contractService.create({
                    data: {
                        contractId: contract.id,
                        serviceId: ds.id,
                        customPrice: ds.defaultPrice,
                        quantity: 1
                    }
                });
            }
        }
        // TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI PHÒNG THÀNH "OCCUPIED"
        await prisma.room.update({
            where: { id: rId },
            data: { status: 'OCCUPIED' }
        });
        // CẬP NHẬT PHÒNG HIỆN TẠI CHO HỒ SƠ NGƯỜI THUÊ
        await prisma.tenantProfile.update({
            where: { id: tId },
            data: { currentRoomId: rId }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'CREATE_CONTRACT',
                entity: 'Contract',
                entityId: String(contract.id),
                details: `Lập hợp đồng mới [${code}] cho phòng ID ${rId}, tiền thuê ${rentalPrice} VNĐ`
            }
        });
        return res.status(201).json({
            message: 'Lập hợp đồng thuê thành công! Phòng đã chuyển sang trạng thái Đang thuê.',
            contract
        });
    }
    catch (error) {
        console.error('Lỗi lập hợp đồng:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const liquidateContract = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { depositDeducted, deductionReason, actualEndDate } = req.body;
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                room: true,
                tenant: true,
                invoices: {
                    where: {
                        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
                        remainingAmount: { gt: 0 }
                    }
                }
            }
        });
        if (!contract) {
            return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
        }
        if (contract.status === 'TERMINATED') {
            return res.status(400).json({ message: 'Hợp đồng này đã được thanh lý trước đó.' });
        }
        const deducted = depositDeducted ? parseFloat(depositDeducted) : 0;
        const refunded = Math.max(0, contract.depositAmount - deducted);
        // Cập nhật hợp đồng
        const updatedContract = await prisma.contract.update({
            where: { id },
            data: {
                status: 'TERMINATED',
                actualEndDate: actualEndDate ? new Date(actualEndDate) : new Date(),
                depositDeducted: deducted,
                depositRefunded: refunded,
                deductionReason: deductionReason || (deducted > 0 ? 'Khấu trừ chi phí khi trả phòng' : 'Hoàn trả đủ tiền cọc')
            }
        });
        // CẬP NHẬT TRẠNG THÁI PHÒNG: Chuyển lại thành "AVAILABLE" (Trống)
        await prisma.room.update({
            where: { id: contract.roomId },
            data: { status: 'AVAILABLE' }
        });
        // Cập nhật hồ sơ người thuê
        await prisma.tenantProfile.update({
            where: { id: contract.tenantId },
            data: { currentRoomId: null }
        });
        // Kiểm tra công nợ còn tồn đọng
        const unpaidTotal = contract.invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'LIQUIDATE_CONTRACT',
                entity: 'Contract',
                entityId: String(id),
                details: `Thanh lý HĐ [${contract.contractCode}]: Cọc ${contract.depositAmount}đ, Hoàn trả ${refunded}đ, Trừ ${deducted}đ (${deductionReason || 'Không'})`
            }
        });
        return res.json({
            message: 'Thanh lý hợp đồng thành công! Phòng đã được đưa về trạng thái Sẵn sàng cho thuê.',
            contract: updatedContract,
            unpaidInvoicesCount: contract.invoices.length,
            unpaidTotalAmount: unpaidTotal,
            warning: unpaidTotal > 0 ? `Lưu ý: Hợp đồng này vẫn còn ${contract.invoices.length} hóa đơn chưa tất toán với tổng dư nợ ${unpaidTotal.toLocaleString('vi-VN')} VNĐ.` : null
        });
    }
    catch (error) {
        console.error('Lỗi thanh lý hợp đồng:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const extendContract = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { newEndDate, rentalPrice } = req.body;
        if (!newEndDate) {
            return res.status(400).json({ message: 'Vui lòng chọn ngày kết thúc mới cho hợp đồng.' });
        }
        const contract = await prisma.contract.findUnique({ where: { id } });
        if (!contract) {
            return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
        }
        const newEnd = new Date(newEndDate);
        if (newEnd <= new Date(contract.endDate)) {
            return res.status(400).json({ message: 'Ngày gia hạn mới phải sau ngày kết thúc hiện tại.' });
        }
        const updated = await prisma.contract.update({
            where: { id },
            data: {
                endDate: newEnd,
                rentalPrice: rentalPrice ? parseFloat(rentalPrice) : contract.rentalPrice
            }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'EXTEND_CONTRACT',
                entity: 'Contract',
                entityId: String(id),
                details: `Gia hạn hợp đồng [${contract.contractCode}] đến ngày ${newEnd.toLocaleDateString('vi-VN')}`
            }
        });
        return res.json({ message: 'Gia hạn hợp đồng thành công!', contract: updated });
    }
    catch (error) {
        console.error('Lỗi gia hạn hợp đồng:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
// ==========================================
// 2. DÀNH CHO CHÍNH NGƯỜI THUÊ (TENANT ISOLATION)
// ==========================================
export const getMyContracts = async (req, res) => {
    try {
        const tenantProfileId = req.user?.tenantProfileId;
        if (!tenantProfileId) {
            return res.status(404).json({ message: 'Tài khoản chưa được liên kết với hồ sơ người thuê.' });
        }
        const contracts = await prisma.contract.findMany({
            where: { tenantId: tenantProfileId },
            include: {
                room: {
                    include: {
                        property: true,
                        floor: true
                    }
                },
                occupants: true,
                contractServices: {
                    include: { service: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(contracts);
    }
    catch (error) {
        console.error('Lỗi lấy hợp đồng người thuê:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
