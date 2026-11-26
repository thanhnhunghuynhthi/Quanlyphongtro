import { prisma } from '../prisma.js';
// ==========================================
// 1. DỊCH VỤ & CẤU HÌNH ĐƠN GIÁ
// ==========================================
export const getServices = async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            orderBy: { id: 'asc' }
        });
        return res.json(services);
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi tải danh mục dịch vụ.' });
    }
};
export const updateService = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { defaultPrice, name, unit } = req.body;
        const updated = await prisma.service.update({
            where: { id },
            data: {
                defaultPrice: defaultPrice !== undefined ? parseFloat(defaultPrice) : undefined,
                name: name || undefined,
                unit: unit || undefined
            }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'UPDATE_SERVICE_PRICE',
                entity: 'Service',
                entityId: String(id),
                details: `Cập nhật đơn giá dịch vụ ${updated.name}: ${updated.defaultPrice} VNĐ/${updated.unit}`
            }
        });
        return res.json({ message: 'Cập nhật đơn giá dịch vụ thành công!', service: updated });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi cập nhật dịch vụ.' });
    }
};
// ==========================================
// 2. CHỈ SỐ ĐIỆN NƯỚC (METER READING)
// ==========================================
export const getMeterReadings = async (req, res) => {
    try {
        const { period, roomId } = req.query;
        const whereClause = {};
        if (period)
            whereClause.period = period;
        if (roomId)
            whereClause.roomId = parseInt(roomId);
        const readings = await prisma.meterReading.findMany({
            where: whereClause,
            include: {
                room: {
                    include: { property: true }
                }
            },
            orderBy: { period: 'desc' }
        });
        return res.json(readings);
    }
    catch (error) {
        console.error('Lỗi lấy chỉ số điện nước:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const recordMeterReading = async (req, res) => {
    try {
        const { roomId, period, oldElectricity, newElectricity, oldWater, newWater } = req.body;
        if (!roomId || !period) {
            return res.status(400).json({ message: 'Vui lòng chọn phòng và kỳ ghi chỉ số (YYYY-MM).' });
        }
        const oldE = parseInt(oldElectricity || '0');
        const newE = parseInt(newElectricity || '0');
        const oldW = parseInt(oldWater || '0');
        const newW = parseInt(newWater || '0');
        // ==========================================
        // QUY TẮC BẮT BUỘC: CHỈ SỐ CUỐI KỲ >= ĐẦU KỲ
        // ==========================================
        if (newE < oldE) {
            return res.status(400).json({
                message: `Chỉ số điện mới (${newE}) không được nhỏ hơn chỉ số điện cũ (${oldE}).`
            });
        }
        if (newW < oldW) {
            return res.status(400).json({
                message: `Chỉ số nước mới (${newW}) không được nhỏ hơn chỉ số nước cũ (${oldW}).`
            });
        }
        const usedE = newE - oldE;
        const usedW = newW - oldW;
        const rId = parseInt(roomId);
        const reading = await prisma.meterReading.upsert({
            where: {
                roomId_period: {
                    roomId: rId,
                    period
                }
            },
            update: {
                oldElectricity: oldE,
                newElectricity: newE,
                usedElectricity: usedE,
                oldWater: oldW,
                newWater: newW,
                usedWater: usedW,
                readingDate: new Date(),
                recordedBy: req.user?.fullName
            },
            create: {
                roomId: rId,
                period,
                oldElectricity: oldE,
                newElectricity: newE,
                usedElectricity: usedE,
                oldWater: oldW,
                newWater: newW,
                usedWater: usedW,
                readingDate: new Date(),
                recordedBy: req.user?.fullName
            }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'UPDATE_METER',
                entity: 'MeterReading',
                entityId: String(reading.id),
                details: `Ghi chỉ số kỳ ${period} phòng ID ${rId}: Điện ${usedE} kWh, Nước ${usedW} m3`
            }
        });
        return res.json({
            message: 'Lưu chỉ số điện nước thành công!',
            reading
        });
    }
    catch (error) {
        console.error('Lỗi lưu chỉ số điện nước:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
// ==========================================
// 3. HÓA ĐƠN & BẢN CHỤP ĐƠN GIÁ (SNAPSHOT)
// ==========================================
export const getInvoices = async (req, res) => {
    try {
        const { period, status, roomId, propertyId, search } = req.query;
        const whereClause = {};
        if (period)
            whereClause.period = period;
        if (status)
            whereClause.status = status;
        if (roomId)
            whereClause.roomId = parseInt(roomId);
        if (propertyId) {
            whereClause.room = { propertyId: parseInt(propertyId) };
        }
        if (search) {
            const q = search.trim();
            whereClause.OR = [
                { invoiceCode: { contains: q } },
                { room: { roomNumber: { contains: q } } },
                { contract: { tenant: { fullName: { contains: q } } } }
            ];
        }
        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                room: {
                    include: { property: true }
                },
                contract: {
                    include: { tenant: true }
                },
                meterReading: true,
                payments: true,
                submissions: true
            },
            orderBy: { createdAt: 'desc' }
        });
        // Tự động kiểm tra quá hạn
        const now = new Date();
        const processed = invoices.map(inv => {
            const isOver = inv.dueDate < now && inv.remainingAmount > 0 && inv.status !== 'CANCELLED';
            return { ...inv, isOverdue: isOver };
        });
        return res.json(processed);
    }
    catch (error) {
        console.error('Lỗi lấy danh sách hóa đơn:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const getInvoiceById = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                room: {
                    include: {
                        property: true,
                        floor: true
                    }
                },
                contract: {
                    include: {
                        tenant: true,
                        occupants: true
                    }
                },
                meterReading: true,
                items: true,
                payments: {
                    orderBy: { paymentDate: 'desc' }
                },
                submissions: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
        }
        // Tenant check authorization
        if (req.user?.role === 'TENANT' && invoice.contract.tenantId !== req.user.tenantProfileId) {
            return res.status(403).json({ message: 'Bạn không có quyền xem hóa đơn của phòng khác.' });
        }
        const isOverdue = invoice.dueDate < new Date() && invoice.remainingAmount > 0 && invoice.status !== 'CANCELLED';
        return res.json({ ...invoice, isOverdue });
    }
    catch (error) {
        console.error('Lỗi chi tiết hóa đơn:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const createInvoice = async (req, res) => {
    try {
        const { contractId, period, dueDate, surcharge, discount, adjustmentReason, notes } = req.body;
        if (!contractId || !period || !dueDate) {
            return res.status(400).json({ message: 'Vui lòng chọn hợp đồng, kỳ thu (YYYY-MM) và hạn thanh toán.' });
        }
        const cId = parseInt(contractId);
        // ==========================================
        // QUY TẮC BẮT BUỘC: CHỐNG LẬP TRÙNG HÓA ĐƠN CHO CÙNG HỢP ĐỒNG VÀ KỲ THU
        // ==========================================
        const existing = await prisma.invoice.findUnique({
            where: {
                contractId_period: {
                    contractId: cId,
                    period
                }
            }
        });
        if (existing) {
            return res.status(400).json({
                message: `Hóa đơn [${existing.invoiceCode}] cho hợp đồng này trong kỳ ${period} đã tồn tại trong hệ thống. Không thể lập trùng lặp!`
            });
        }
        const contract = await prisma.contract.findUnique({
            where: { id: cId },
            include: {
                room: true,
                tenant: true,
                contractServices: {
                    include: { service: true }
                }
            }
        });
        if (!contract) {
            return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
        }
        // ==========================================
        // GIẢ ĐỊNH & CÔNG THỨC TÍNH TIỀN LẺ NGÀY (PRO-RATING)
        // Quy chuẩn: 1 tháng = 30 ngày.
        // Nếu ngày bắt đầu vào giữa tháng của kỳ thu -> Tính tỷ lệ số ngày thực tế:
        // Tiền phòng = (Giá thuê tháng / 30) * Số ngày thực tế ở trong tháng.
        // ==========================================
        let roomFee = contract.rentalPrice;
        let roomItemNote = `Tiền thuê phòng tháng ${period}`;
        const [yearStr, monthStr] = period.split('-');
        const periodYear = parseInt(yearStr);
        const periodMonth = parseInt(monthStr);
        const contractStartDate = new Date(contract.startDate);
        if (contractStartDate.getFullYear() === periodYear &&
            contractStartDate.getMonth() + 1 === periodMonth &&
            contractStartDate.getDate() > 1) {
            const startDay = contractStartDate.getDate();
            const daysInMonth = new Date(periodYear, periodMonth, 0).getDate();
            const actualDays = daysInMonth - startDay + 1;
            const dailyRate = contract.rentalPrice / 30; // Quy chuẩn chuẩn hóa 30 ngày
            roomFee = Math.round(dailyRate * actualDays);
            roomItemNote = `Tiền thuê phòng lẻ ngày (${actualDays} ngày từ ${startDay}/${periodMonth} - chuẩn 30 ngày/tháng)`;
        }
        // Tìm chỉ số điện nước nếu có
        const meter = await prisma.meterReading.findUnique({
            where: {
                roomId_period: {
                    roomId: contract.roomId,
                    period
                }
            }
        });
        const itemsToCreate = [];
        // 1. Mục tiền phòng (SNAPSHOT)
        itemsToCreate.push({
            itemName: roomItemNote,
            itemType: 'ROOM',
            unitPrice: roomFee,
            quantity: 1,
            unit: 'Tháng',
            amount: roomFee,
            notes: roomItemNote
        });
        let servicesTotal = 0;
        // 2. Các mục dịch vụ & điện nước (SNAPSHOT ĐƠN GIÁ TẠI THỜI ĐIỂM NÀY)
        for (const cs of contract.contractServices) {
            if (cs.service.code === 'ELEC') {
                const usedE = meter ? meter.usedElectricity : 0;
                const amountE = usedE * cs.customPrice;
                servicesTotal += amountE;
                itemsToCreate.push({
                    itemName: `Tiền điện (${usedE} kWh * ${cs.customPrice.toLocaleString('vi-VN')}đ)`,
                    itemType: 'ELECTRICITY',
                    unitPrice: cs.customPrice,
                    quantity: usedE,
                    unit: 'kWh',
                    amount: amountE,
                    notes: meter ? `Chỉ số cũ: ${meter.oldElectricity}, mới: ${meter.newElectricity}` : 'Chưa nhập chỉ số đồng hồ'
                });
            }
            else if (cs.service.code === 'WATER') {
                const usedW = meter ? meter.usedWater : 0;
                const amountW = usedW * cs.customPrice;
                servicesTotal += amountW;
                itemsToCreate.push({
                    itemName: `Tiền nước (${usedW} m3 * ${cs.customPrice.toLocaleString('vi-VN')}đ)`,
                    itemType: 'WATER',
                    unitPrice: cs.customPrice,
                    quantity: usedW,
                    unit: 'm3',
                    amount: amountW,
                    notes: meter ? `Chỉ số cũ: ${meter.oldWater}, mới: ${meter.newWater}` : 'Chưa nhập chỉ số đồng hồ'
                });
            }
            else {
                const amountS = cs.customPrice * cs.quantity;
                servicesTotal += amountS;
                itemsToCreate.push({
                    itemName: cs.service.name,
                    itemType: 'SERVICE',
                    unitPrice: cs.customPrice,
                    quantity: cs.quantity,
                    unit: cs.service.unit,
                    amount: amountS
                });
            }
        }
        const sur = surcharge ? parseFloat(surcharge) : 0;
        const disc = discount ? parseFloat(discount) : 0;
        if (sur > 0) {
            itemsToCreate.push({
                itemName: `Phụ thu: ${adjustmentReason || 'Chi phí phát sinh'}`,
                itemType: 'SURCHARGE',
                unitPrice: sur,
                quantity: 1,
                unit: 'Lần',
                amount: sur
            });
        }
        if (disc > 0) {
            itemsToCreate.push({
                itemName: `Giảm trừ: ${adjustmentReason || 'Chiết khấu / Hỗ trợ'}`,
                itemType: 'DISCOUNT',
                unitPrice: disc,
                quantity: 1,
                unit: 'Lần',
                amount: -disc
            });
        }
        const totalAmount = roomFee + servicesTotal + sur - disc;
        // Sinh mã hóa đơn
        const [pY, pM] = period.split('-');
        const invoiceCode = `HD-${pY}${pM}-${contract.room.roomNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
        const invoice = await prisma.invoice.create({
            data: {
                invoiceCode,
                roomId: contract.roomId,
                contractId: contract.id,
                meterReadingId: meter?.id,
                period,
                issueDate: new Date(),
                dueDate: new Date(dueDate),
                roomAmount: roomFee,
                servicesAmount: servicesTotal,
                surcharge: sur,
                discount: disc,
                adjustmentReason,
                totalAmount,
                paidAmount: 0,
                remainingAmount: totalAmount,
                status: 'ISSUED',
                notes
            }
        });
        // Thêm các mục hóa đơn
        for (const item of itemsToCreate) {
            await prisma.invoiceItem.create({
                data: {
                    invoiceId: invoice.id,
                    ...item
                }
            });
        }
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'CREATE_INVOICE',
                entity: 'Invoice',
                entityId: String(invoice.id),
                details: `Phát hành hóa đơn [${invoiceCode}] cho phòng ${contract.room.roomNumber}, kỳ ${period}, tổng tiền ${totalAmount.toLocaleString('vi-VN')} VNĐ`
            }
        });
        return res.status(201).json({
            message: 'Phát hành hóa đơn thành công!',
            invoice
        });
    }
    catch (error) {
        console.error('Lỗi phát hành hóa đơn:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const adjustInvoice = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { surcharge, discount, adjustmentReason, notes } = req.body;
        if (!adjustmentReason) {
            return res.status(400).json({ message: 'Mọi điều chỉnh hóa đơn đã phát hành bắt buộc phải nêu rõ lý do điều chỉnh.' });
        }
        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
        }
        if (invoice.status === 'PAID') {
            return res.status(400).json({ message: 'Hóa đơn đã thanh toán hoàn tất, không thể điều chỉnh.' });
        }
        const sur = surcharge !== undefined ? parseFloat(surcharge) : invoice.surcharge;
        const disc = discount !== undefined ? parseFloat(discount) : invoice.discount;
        const newTotal = invoice.roomAmount + invoice.servicesAmount + sur - disc;
        const newRemaining = Math.max(0, newTotal - invoice.paidAmount);
        let newStatus = invoice.status;
        if (newRemaining <= 0) {
            newStatus = 'PAID';
        }
        else if (invoice.paidAmount > 0) {
            newStatus = 'PARTIALLY_PAID';
        }
        else {
            newStatus = 'ISSUED';
        }
        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                surcharge: sur,
                discount: disc,
                adjustmentReason,
                totalAmount: newTotal,
                remainingAmount: newRemaining,
                status: newStatus,
                notes: notes !== undefined ? notes : invoice.notes
            }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'ADJUST_INVOICE',
                entity: 'Invoice',
                entityId: String(id),
                details: `Điều chỉnh HĐ [${invoice.invoiceCode}]: Phụ thu ${sur}đ, Giảm trừ ${disc}đ. Lý do: ${adjustmentReason}`
            }
        });
        return res.json({ message: 'Điều chỉnh hóa đơn thành công!', invoice: updated });
    }
    catch (error) {
        console.error('Lỗi điều chỉnh hóa đơn:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const recordPayment = async (req, res) => {
    try {
        const invoiceId = parseInt(String(req.params.id));
        const { amount, paymentMethod, notes, transactionReference } = req.body;
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'Vui lòng nhập số tiền thanh toán hợp lệ lớn hơn 0.' });
        }
        const payAmt = parseFloat(amount);
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                room: true,
                contract: { include: { tenant: true } }
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn.' });
        }
        if (invoice.remainingAmount <= 0) {
            return res.status(400).json({ message: 'Hóa đơn này đã được thanh toán hoàn tất.' });
        }
        const code = `PT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
        // Tạo bản ghi thanh toán
        const payment = await prisma.payment.create({
            data: {
                paymentCode: code,
                invoiceId,
                amount: payAmt,
                paymentMethod: paymentMethod || 'TRANSFER',
                receivedBy: req.user?.fullName || 'Chủ nhà trọ',
                transactionReference,
                notes
            }
        });
        const newPaidAmount = invoice.paidAmount + payAmt;
        const newRemaining = Math.max(0, invoice.totalAmount - newPaidAmount);
        let newStatus = 'PARTIALLY_PAID';
        if (newRemaining <= 0) {
            newStatus = 'PAID';
        }
        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemaining,
                status: newStatus
            }
        });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'RECORD_PAYMENT',
                entity: 'Payment',
                entityId: String(payment.id),
                details: `Thu tiền [${code}] cho HĐ [${invoice.invoiceCode}]: ${payAmt.toLocaleString('vi-VN')} VNĐ (${paymentMethod})`
            }
        });
        return res.json({
            message: `Ghi nhận thanh toán thành công! Trạng thái hóa đơn: ${newStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'THANH TOÁN MỘT PHẦN'}.`,
            payment,
            invoice: updatedInvoice
        });
    }
    catch (error) {
        console.error('Lỗi ghi nhận thanh toán:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
// ==========================================
// 4. MINH CHỨNG THANH TOÁN (PAYMENT SUBMISSION)
// ==========================================
export const submitPaymentProof = async (req, res) => {
    try {
        const invoiceId = parseInt(String(req.params.id));
        const tenantProfileId = req.user?.tenantProfileId;
        if (!tenantProfileId) {
            return res.status(403).json({ message: 'Chức năng chỉ dành cho người thuê.' });
        }
        const { amount, bankName, transactionCode, proofImageUrl, note } = req.body;
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: 'Vui lòng nhập số tiền đã chuyển khoản.' });
        }
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { contract: true }
        });
        if (!invoice || invoice.contract.tenantId !== tenantProfileId) {
            return res.status(403).json({ message: 'Hóa đơn không hợp lệ hoặc không thuộc quyền sở hữu của bạn.' });
        }
        const submission = await prisma.paymentSubmission.create({
            data: {
                invoiceId,
                tenantId: tenantProfileId,
                amount: parseFloat(amount),
                bankName,
                transactionCode,
                proofImageUrl: proofImageUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
                note,
                status: 'PENDING'
            }
        });
        return res.status(201).json({
            message: 'Gửi minh chứng thanh toán thành công! Chủ nhà sẽ kiểm tra và xác nhận sớm nhất.',
            submission
        });
    }
    catch (error) {
        console.error('Lỗi gửi minh chứng:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const reviewPaymentProof = async (req, res) => {
    try {
        const submissionId = parseInt(String(req.params.id));
        const { action, rejectionReason } = req.body; // 'APPROVE' or 'REJECT'
        const submission = await prisma.paymentSubmission.findUnique({
            where: { id: submissionId },
            include: { invoice: true }
        });
        if (!submission) {
            return res.status(404).json({ message: 'Không tìm thấy minh chứng thanh toán.' });
        }
        if (submission.status !== 'PENDING') {
            return res.status(400).json({ message: 'Minh chứng này đã được duyệt trước đó.' });
        }
        if (action === 'APPROVE') {
            // 1. Cập nhật submission status
            await prisma.paymentSubmission.update({
                where: { id: submissionId },
                data: {
                    status: 'APPROVED',
                    reviewedAt: new Date()
                }
            });
            // 2. Tự động tạo bản ghi Payment
            const code = `PT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
            await prisma.payment.create({
                data: {
                    paymentCode: code,
                    invoiceId: submission.invoiceId,
                    amount: submission.amount,
                    paymentMethod: 'TRANSFER',
                    receivedBy: req.user?.fullName,
                    transactionReference: submission.transactionCode || 'Xác nhận từ ảnh minh chứng',
                    notes: `Duyệt minh chứng chuyển khoản của khách. ${submission.note || ''}`
                }
            });
            // 3. Cập nhật trạng thái hóa đơn
            const newPaid = submission.invoice.paidAmount + submission.amount;
            const newRem = Math.max(0, submission.invoice.totalAmount - newPaid);
            const newStatus = newRem <= 0 ? 'PAID' : 'PARTIALLY_PAID';
            await prisma.invoice.update({
                where: { id: submission.invoiceId },
                data: {
                    paidAmount: newPaid,
                    remainingAmount: newRem,
                    status: newStatus
                }
            });
            return res.json({ message: 'Đã phê duyệt minh chứng và ghi nhận thanh toán thành công!' });
        }
        else {
            await prisma.paymentSubmission.update({
                where: { id: submissionId },
                data: {
                    status: 'REJECTED',
                    rejectionReason: rejectionReason || 'Số tiền hoặc thông tin chuyển khoản không khớp',
                    reviewedAt: new Date()
                }
            });
            return res.json({ message: 'Đã từ chối minh chứng thanh toán.' });
        }
    }
    catch (error) {
        console.error('Lỗi duyệt minh chứng:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
// ==========================================
// 5. DÀNH CHO CHÍNH NGƯỜI THUÊ (TENANT ISOLATION)
// ==========================================
export const getMyInvoices = async (req, res) => {
    try {
        const tenantProfileId = req.user?.tenantProfileId;
        if (!tenantProfileId) {
            return res.status(404).json({ message: 'Tài khoản chưa được liên kết với hồ sơ người thuê.' });
        }
        const invoices = await prisma.invoice.findMany({
            where: {
                contract: {
                    tenantId: tenantProfileId
                }
            },
            include: {
                room: {
                    include: { property: true }
                },
                items: true,
                payments: true,
                submissions: true
            },
            orderBy: { period: 'desc' }
        });
        const now = new Date();
        const processed = invoices.map(inv => ({
            ...inv,
            isOverdue: inv.dueDate < now && inv.remainingAmount > 0 && inv.status !== 'CANCELLED'
        }));
        return res.json(processed);
    }
    catch (error) {
        console.error('Lỗi lấy hóa đơn người thuê:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
