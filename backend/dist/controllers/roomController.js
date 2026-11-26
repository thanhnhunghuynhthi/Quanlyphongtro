import { prisma } from '../prisma.js';
// ==========================================
// 1. ENDPOINTS DÀNH CHO KHÁCH CÔNG KHAI (PUBLIC)
// ==========================================
export const getPublicRooms = async (req, res) => {
    try {
        const { propertyId, minPrice, maxPrice, status, search, minArea } = req.query;
        const whereClause = {
            isPublic: true,
            isArchived: false
        };
        if (propertyId) {
            whereClause.propertyId = parseInt(propertyId);
        }
        if (status) {
            whereClause.status = status;
        }
        else {
            // Mặc định công khai thường tìm phòng AVAILABLE trước
        }
        if (minPrice || maxPrice) {
            whereClause.basePrice = {};
            if (minPrice)
                whereClause.basePrice.gte = parseFloat(minPrice);
            if (maxPrice)
                whereClause.basePrice.lte = parseFloat(maxPrice);
        }
        if (minArea) {
            whereClause.area = { gte: parseFloat(minArea) };
        }
        if (search) {
            const q = search.trim();
            whereClause.OR = [
                { roomNumber: { contains: q } },
                { description: { contains: q } },
                { property: { name: { contains: q } } },
                { property: { address: { contains: q } } }
            ];
        }
        const rooms = await prisma.room.findMany({
            where: whereClause,
            include: {
                property: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        address: true,
                        city: true,
                        district: true,
                        managerPhone: true
                    }
                },
                floor: {
                    select: { id: true, floorNumber: true, name: true }
                },
                images: {
                    orderBy: { orderIndex: 'asc' }
                },
                roomAmenities: {
                    include: {
                        amenity: true
                    }
                }
            },
            orderBy: [
                { status: 'asc' }, // AVAILABLE lên trước
                { basePrice: 'asc' }
            ]
        });
        return res.json(rooms);
    }
    catch (error) {
        console.error('Lỗi lấy danh sách phòng công khai:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra khi tải danh sách phòng.' });
    }
};
export const getPublicRoomById = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const room = await prisma.room.findFirst({
            where: {
                id,
                isPublic: true,
                isArchived: false
            },
            include: {
                property: true,
                floor: true,
                images: {
                    orderBy: { orderIndex: 'asc' }
                },
                roomAmenities: {
                    include: {
                        amenity: true
                    }
                }
            }
        });
        if (!room) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin phòng hoặc phòng không công khai.' });
        }
        return res.json(room);
    }
    catch (error) {
        console.error('Lỗi chi tiết phòng công khai:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
// ==========================================
// 2. ENDPOINTS DÀNH CHO CHỦ NHÀ (OWNER)
// ==========================================
export const getRooms = async (req, res) => {
    try {
        const { propertyId, floorId, status, search } = req.query;
        const whereClause = {
            isArchived: false
        };
        if (propertyId)
            whereClause.propertyId = parseInt(propertyId);
        if (floorId)
            whereClause.floorId = parseInt(floorId);
        if (status)
            whereClause.status = status;
        if (search) {
            const q = search.trim();
            whereClause.OR = [
                { roomNumber: { contains: q } },
                { description: { contains: q } }
            ];
        }
        const rooms = await prisma.room.findMany({
            where: whereClause,
            include: {
                property: true,
                floor: true,
                images: true,
                roomAmenities: {
                    include: { amenity: true }
                },
                tenants: true,
                contracts: {
                    where: { status: 'ACTIVE' },
                    include: { tenant: true }
                }
            },
            orderBy: [
                { propertyId: 'asc' },
                { roomNumber: 'asc' }
            ]
        });
        return res.json(rooms);
    }
    catch (error) {
        console.error('Lỗi lấy danh sách phòng:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const getRoomById = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                property: true,
                floor: true,
                images: { orderBy: { orderIndex: 'asc' } },
                roomAmenities: { include: { amenity: true } },
                tenants: true,
                contracts: {
                    include: {
                        tenant: true,
                        occupants: true,
                        contractServices: { include: { service: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                meterReadings: {
                    orderBy: { period: 'desc' },
                    take: 6
                },
                invoices: {
                    orderBy: { period: 'desc' },
                    take: 6
                },
                maintenanceRequests: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng trọ.' });
        }
        return res.json(room);
    }
    catch (error) {
        console.error('Lỗi lấy thông tin phòng:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const createRoom = async (req, res) => {
    try {
        const { roomNumber, propertyId, floorId, area, basePrice, depositAmount, maxRenters, status, isPublic, description, amenityIds, imageUrls } = req.body;
        if (!roomNumber || !propertyId || !floorId || !basePrice) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã phòng, khu trọ, tầng và giá thuê.' });
        }
        // Kiểm tra trùng phòng trong cùng khu trọ
        const existing = await prisma.room.findUnique({
            where: {
                propertyId_roomNumber: {
                    propertyId: parseInt(propertyId),
                    roomNumber
                }
            }
        });
        if (existing) {
            return res.status(400).json({ message: `Mã phòng ${roomNumber} đã tồn tại trong khu trọ này.` });
        }
        const room = await prisma.room.create({
            data: {
                roomNumber,
                propertyId: parseInt(propertyId),
                floorId: parseInt(floorId),
                area: area ? parseFloat(area) : 20,
                basePrice: parseFloat(basePrice),
                depositAmount: depositAmount ? parseFloat(depositAmount) : parseFloat(basePrice),
                maxRenters: maxRenters ? parseInt(maxRenters) : 2,
                status: status || 'AVAILABLE',
                isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
                description
            }
        });
        // Thêm tiện ích
        if (amenityIds && Array.isArray(amenityIds)) {
            for (const aId of amenityIds) {
                await prisma.roomAmenity.create({
                    data: {
                        roomId: room.id,
                        amenityId: parseInt(aId)
                    }
                });
            }
        }
        // Thêm hình ảnh
        if (imageUrls && Array.isArray(imageUrls)) {
            for (let i = 0; i < imageUrls.length; i++) {
                await prisma.roomImage.create({
                    data: {
                        roomId: room.id,
                        url: imageUrls[i],
                        isCover: i === 0,
                        orderIndex: i
                    }
                });
            }
        }
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'CREATE_ROOM',
                entity: 'Room',
                entityId: String(room.id),
                details: `Tạo mới phòng ${room.roomNumber} tại khu trọ ID ${room.propertyId}`
            }
        });
        return res.status(201).json({ message: 'Tạo mới phòng thành công!', room });
    }
    catch (error) {
        console.error('Lỗi tạo phòng:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const updateRoom = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const { roomNumber, area, basePrice, depositAmount, maxRenters, status, isPublic, description, amenityIds, imageUrls } = req.body;
        const existingRoom = await prisma.room.findUnique({ where: { id } });
        if (!existingRoom) {
            return res.status(404).json({ message: 'Không tìm thấy phòng trọ.' });
        }
        const updated = await prisma.room.update({
            where: { id },
            data: {
                roomNumber: roomNumber || existingRoom.roomNumber,
                area: area !== undefined ? parseFloat(area) : existingRoom.area,
                basePrice: basePrice !== undefined ? parseFloat(basePrice) : existingRoom.basePrice,
                depositAmount: depositAmount !== undefined ? parseFloat(depositAmount) : existingRoom.depositAmount,
                maxRenters: maxRenters !== undefined ? parseInt(maxRenters) : existingRoom.maxRenters,
                status: status || existingRoom.status,
                isPublic: isPublic !== undefined ? Boolean(isPublic) : existingRoom.isPublic,
                description: description !== undefined ? description : existingRoom.description
            }
        });
        // Cập nhật tiện ích nếu được truyền
        if (amenityIds && Array.isArray(amenityIds)) {
            await prisma.roomAmenity.deleteMany({ where: { roomId: id } });
            for (const aId of amenityIds) {
                await prisma.roomAmenity.create({
                    data: {
                        roomId: id,
                        amenityId: parseInt(aId)
                    }
                });
            }
        }
        // Cập nhật hình ảnh nếu được truyền
        if (imageUrls && Array.isArray(imageUrls)) {
            await prisma.roomImage.deleteMany({ where: { roomId: id } });
            for (let i = 0; i < imageUrls.length; i++) {
                await prisma.roomImage.create({
                    data: {
                        roomId: id,
                        url: imageUrls[i],
                        isCover: i === 0,
                        orderIndex: i
                    }
                });
            }
        }
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'UPDATE_ROOM',
                entity: 'Room',
                entityId: String(id),
                details: `Cập nhật thông tin phòng ${updated.roomNumber}`
            }
        });
        return res.json({ message: 'Cập nhật phòng thành công!', room: updated });
    }
    catch (error) {
        console.error('Lỗi cập nhật phòng:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const deleteRoom = async (req, res) => {
    try {
        const id = parseInt(String(req.params.id));
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                contracts: true,
                invoices: true
            }
        });
        if (!room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng trọ.' });
        }
        // Kiểm tra hợp đồng đang hiệu lực
        const hasActiveContract = room.contracts.some(c => c.status === 'ACTIVE');
        if (hasActiveContract) {
            return res.status(400).json({ message: 'Phòng đang có hợp đồng hoạt động, không thể xóa hoặc lưu trữ!' });
        }
        // Nếu đã phát sinh hợp đồng hoặc hóa đơn tài chính trong quá khứ -> TUYỆT ĐỐI KHÔNG XÓA CỨNG
        if (room.contracts.length > 0 || room.invoices.length > 0) {
            await prisma.room.update({
                where: { id },
                data: {
                    isArchived: true,
                    isPublic: false
                }
            });
            await prisma.auditLog.create({
                data: {
                    userId: req.user?.id,
                    action: 'ARCHIVE_ROOM',
                    entity: 'Room',
                    entityId: String(id),
                    details: `Lưu trữ phòng ${room.roomNumber} do đã có lịch sử tài chính`
                }
            });
            return res.json({ message: 'Phòng đã có lịch sử hợp đồng/hóa đơn nên đã được chuyển sang chế độ LƯU TRỮ an toàn.' });
        }
        // Chưa từng phát sinh dữ liệu tài chính -> Có thể xóa
        await prisma.roomAmenity.deleteMany({ where: { roomId: id } });
        await prisma.roomImage.deleteMany({ where: { roomId: id } });
        await prisma.room.delete({ where: { id } });
        await prisma.auditLog.create({
            data: {
                userId: req.user?.id,
                action: 'DELETE_ROOM',
                entity: 'Room',
                entityId: String(id),
                details: `Xóa hẳn phòng ${room.roomNumber} chưa có dữ liệu tài chính`
            }
        });
        return res.json({ message: 'Xóa phòng thành công!' });
    }
    catch (error) {
        console.error('Lỗi xóa phòng:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
// ==========================================
// 3. DANH MỤC KHU TRỌ, TẦNG & TIỆN ÍCH
// ==========================================
export const getProperties = async (req, res) => {
    try {
        const properties = await prisma.property.findMany({
            include: {
                floors: {
                    orderBy: { floorNumber: 'asc' }
                },
                rooms: {
                    where: { isArchived: false }
                }
            }
        });
        return res.json(properties);
    }
    catch (error) {
        console.error('Lỗi lấy danh sách khu trọ:', error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const createProperty = async (req, res) => {
    try {
        const { code, name, address, city, district, description, totalFloors } = req.body;
        if (!code || !name || !address) {
            return res.status(400).json({ message: 'Vui lòng điền mã khu, tên khu và địa chỉ.' });
        }
        const prop = await prisma.property.create({
            data: {
                code,
                name,
                address,
                city: city || 'Hà Nội',
                district,
                description,
                managerName: req.user?.fullName,
                managerPhone: req.user?.username
            }
        });
        const floorsCount = totalFloors ? parseInt(totalFloors) : 3;
        for (let f = 1; f <= floorsCount; f++) {
            await prisma.floor.create({
                data: {
                    propertyId: prop.id,
                    floorNumber: f,
                    name: `Tầng ${f}`
                }
            });
        }
        return res.status(201).json({ message: 'Thêm khu trọ mới thành công!', property: prop });
    }
    catch (error) {
        console.error('Lỗi tạo khu trọ:', error);
        return res.status(500).json({ message: error.message || 'Đã có lỗi xảy ra trên máy chủ.' });
    }
};
export const getAmenities = async (req, res) => {
    try {
        const amenities = await prisma.amenity.findMany();
        return res.json(amenities);
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi tải danh mục tiện ích.' });
    }
};
