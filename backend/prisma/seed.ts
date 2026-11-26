import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu SmartTro (Quản Lý Phòng Trọ)...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. CHỦ NHÀ TRỌ (OWNER)
  const owner = await prisma.user.upsert({
    where: { username: 'chutro' },
    update: {},
    create: {
      username: 'chutro',
      password: passwordHash,
      fullName: 'Nguyễn Văn Ba (Chủ Nhà Trọ)',
      role: 'OWNER',
      phone: '0393104054',
      email: 'chutro.ba@smarttro.vn',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      isActive: true,
      mustChangePassword: false
    }
  });
  console.log('✅ Đã tạo tài khoản Chủ nhà (OWNER): chutro / 123456');

  // 2. KHU TRỌ (PROPERTY)
  const propSky = await prisma.property.upsert({
    where: { code: 'KT-SKY' },
    update: {},
    create: {
      code: 'KT-SKY',
      name: 'Khu trọ Cao cấp SkyHome Cầu Giấy',
      address: 'Số 26 Ngõ 165 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội',
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      description: 'Tòa nhà căn hộ mini 3 tầng hiện đại, thang bộ rộng, camera an ninh 24/7, cửa cổng khóa vân tay thông minh, giờ giấc tự do không chung chủ.',
      managerName: 'Nguyễn Văn Ba',
      managerPhone: '0393104054'
    }
  });

  const propGreen = await prisma.property.upsert({
    where: { code: 'KT-GREEN' },
    update: {},
    create: {
      code: 'KT-GREEN',
      name: 'Khu trọ Xanh GreenHouse Bình Thạnh',
      address: 'Số 48/12 Ung Văn Khiêm, Phường 25, Bình Thạnh, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      district: 'Bình Thạnh',
      description: 'Khu nhà trọ sinh thái gần các trường ĐH HUTECH, Ngoại Thương, Giao Thông Vận Tải. Môi trường yên tĩnh, cây xanh thoáng mát, wifi cáp quang riêng từng phòng.',
      managerName: 'Nguyễn Văn Ba',
      managerPhone: '0393104054'
    }
  });
  console.log('✅ Đã tạo 2 Khu trọ: SkyHome (Hà Nội) & GreenHouse (TP.HCM)');

  // 3. TẦNG (FLOOR)
  const skyFloors = [];
  for (let f = 1; f <= 3; f++) {
    const floor = await prisma.floor.upsert({
      where: { propertyId_floorNumber: { propertyId: propSky.id, floorNumber: f } },
      update: {},
      create: {
        propertyId: propSky.id,
        floorNumber: f,
        name: `Tầng ${f}`
      }
    });
    skyFloors.push(floor);
  }

  const greenFloors = [];
  for (let f = 1; f <= 3; f++) {
    const floor = await prisma.floor.upsert({
      where: { propertyId_floorNumber: { propertyId: propGreen.id, floorNumber: f } },
      update: {},
      create: {
        propertyId: propGreen.id,
        floorNumber: f,
        name: `Tầng ${f}`
      }
    });
    greenFloors.push(floor);
  }

  // 4. DANH MỤC TIỆN ÍCH (AMENITY)
  const amenityData = [
    { name: 'Điều hòa Inveter', icon: 'air-vent', description: 'Điều hòa hai chiều tiết kiệm điện' },
    { name: 'Bình nóng lạnh', icon: 'flame', description: 'Nước nóng năng lượng & điện Ariston 20L' },
    { name: 'Tủ lạnh hai cánh', icon: 'refrigerator', description: 'Tủ lạnh 180L mới' },
    { name: 'Gác lửng kiên cố', icon: 'home', description: 'Gác lửng cao 2m đúc bê tông lót gạch men' },
    { name: 'Giường & Nệm cao su', icon: 'bed', description: 'Giường gỗ sồi 1m6 kèm nệm lò xo cao cấp' },
    { name: 'Tủ quần áo âm tường', icon: 'archive', description: 'Tủ 3 cánh rộng rãi' },
    { name: 'Ban công thoáng mát', icon: 'sun', description: 'Ban công view thoáng có chỗ phơi đồ riêng' },
    { name: 'Kệ bếp nấu ăn & Chậu rửa', icon: 'utensils', description: 'Bàn đá Granit kèm bồn rửa bát Inox 304' },
    { name: 'Wifi cáp quang riêng', icon: 'wifi', description: 'Bộ phát Wifi tốc độ cao' },
    { name: 'Khóa cửa vân tay', icon: 'lock', description: 'Hệ thống kiểm soát ra vào vân tay & thẻ từ' },
    { name: 'Máy giặt chung', icon: 'disc', description: 'Khu vực máy giặt sấy trên sân thượng' }
  ];

  const amenityMap: Record<string, any> = {};
  for (const a of amenityData) {
    const item = await prisma.amenity.upsert({
      where: { name: a.name },
      update: {},
      create: a
    });
    amenityMap[a.name] = item;
  }
  console.log(`✅ Đã tạo ${amenityData.length} danh mục tiện ích`);

  // 5. DANH MỤC DỊCH VỤ (SERVICE)
  const serviceData = [
    { code: 'ELEC', name: 'Điện sinh hoạt', unit: 'kWh', defaultPrice: 3500, chargeType: 'METERED' },
    { code: 'WATER', name: 'Nước sinh hoạt', unit: 'm3', defaultPrice: 25000, chargeType: 'METERED' },
    { code: 'INTERNET', name: 'Mạng Internet Wifi', unit: 'Phòng/Tháng', defaultPrice: 100000, chargeType: 'FIXED_PER_ROOM' },
    { code: 'PARKING', name: 'Phí gửi xe máy', unit: 'Xe/Tháng', defaultPrice: 100000, chargeType: 'FIXED_PER_ROOM' },
    { code: 'CLEANING', name: 'Vệ sinh & Rác sinh hoạt', unit: 'Phòng/Tháng', defaultPrice: 50000, chargeType: 'FIXED_PER_ROOM' }
  ];

  const serviceMap: Record<string, any> = {};
  for (const s of serviceData) {
    const item = await prisma.service.upsert({
      where: { code: s.code },
      update: {},
      create: s
    });
    serviceMap[s.code] = item;
  }
  console.log(`✅ Đã tạo ${serviceData.length} danh mục dịch vụ`);

  // 6. PHÒNG TRỌ (ROOM) - 10 phòng cho mỗi khu = 20 phòng
  const roomImagesPool = [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
  ];

  const skyRoomsConfig = [
    { num: 'P.101', floorIdx: 0, area: 24, price: 3500000, deposit: 3500000, max: 2, status: 'OCCUPIED', desc: 'Phòng tầng 1 có gác lửng đúc, bếp riêng, máy lạnh inverter.' },
    { num: 'P.102', floorIdx: 0, area: 22, price: 3200000, deposit: 3200000, max: 2, status: 'AVAILABLE', desc: 'Phòng tầng 1 gần cửa ra vào, có kệ bếp, máy lạnh, phòng tắm đứng.' },
    { num: 'P.103', floorIdx: 0, area: 20, price: 3000000, deposit: 3000000, max: 2, status: 'AVAILABLE', desc: 'Phòng yên tĩnh, cửa sổ lấy sáng, có gác xép để đồ tiện lợi.' },
    { num: 'P.201', floorIdx: 1, area: 26, price: 3800000, deposit: 3800000, max: 3, status: 'OCCUPIED', desc: 'Phòng góc tầng 2 có ban công view đường rộng, full nội thất cao cấp.' },
    { num: 'P.202', floorIdx: 1, area: 24, price: 3500000, deposit: 3500000, max: 2, status: 'AVAILABLE', desc: 'Phòng tầng 2 ban công riêng, giường tủ đầy đủ, máy giặt máy lạnh.' },
    { num: 'P.203', floorIdx: 1, area: 22, price: 3300000, deposit: 3300000, max: 2, status: 'AVAILABLE', desc: 'Phòng thoáng mát, gác lửng cao không đụng đầu, sàn gạch men bóng.' },
    { num: 'P.204', floorIdx: 1, area: 20, price: 3000000, deposit: 3000000, max: 2, status: 'MAINTENANCE', desc: 'Đang bảo dưỡng định kỳ hệ thống máy lạnh và sơn mới tường.' },
    { num: 'P.301', floorIdx: 2, area: 28, price: 4000000, deposit: 4000000, max: 3, status: 'AVAILABLE', desc: 'Phòng Studio tầng 3 có sân phơi riêng, máy giặt riêng, view thành phố tuyệt đẹp.' },
    { num: 'P.302', floorIdx: 2, area: 24, price: 3400000, deposit: 3400000, max: 2, status: 'AVAILABLE', desc: 'Phòng tầng 3 có giếng trời đón gió tự nhiên mát mẻ quanh năm.' },
    { num: 'P.303', floorIdx: 2, area: 22, price: 3200000, deposit: 3200000, max: 2, status: 'AVAILABLE', desc: 'Phòng mới nâng cấp gác lửng, tủ bếp mới toanh, bình nóng lạnh mới.' }
  ];

  const greenRoomsConfig = [
    { num: 'P.101', floorIdx: 0, area: 25, price: 3800000, deposit: 3800000, max: 2, status: 'AVAILABLE', desc: 'Phòng trệt cạnh hoa viên, mát mẻ, có chỗ để xe máy ngay ngoài cửa.' },
    { num: 'P.102', floorIdx: 0, area: 26, price: 4000000, deposit: 4000000, max: 3, status: 'OCCUPIED', desc: 'Phòng rộng rãi thích hợp nhóm bạn sinh viên ở 2-3 người, đầy đủ tiện ích.' },
    { num: 'P.103', floorIdx: 0, area: 20, price: 3200000, deposit: 3200000, max: 2, status: 'AVAILABLE', desc: 'Phòng tiêu chuẩn tiết kiệm, điện nước theo giá nhà nước.' },
    { num: 'P.201', floorIdx: 1, area: 25, price: 3900000, deposit: 3900000, max: 2, status: 'AVAILABLE', desc: 'Phòng tầng 2 ban công cây xanh thoáng đãng, máy lạnh siêu êm.' },
    { num: 'P.202', floorIdx: 1, area: 24, price: 3600000, deposit: 3600000, max: 2, status: 'OCCUPIED', desc: 'Phòng tầng 2 đầy đủ nội thất: giường, nệm, tủ áo, bàn học, máy lạnh.' },
    { num: 'P.203', floorIdx: 1, area: 22, price: 3400000, deposit: 3400000, max: 2, status: 'AVAILABLE', desc: 'Phòng gác lửng xinh xắn phong cách Hàn Quốc, ánh sáng tự nhiên ngập tràn.' },
    { num: 'P.204', floorIdx: 1, area: 20, price: 3100000, deposit: 3100000, max: 2, status: 'MAINTENANCE', desc: 'Đang thay thế vòi sen và gạch ốp nhà vệ sinh.' },
    { num: 'P.301', floorIdx: 2, area: 30, price: 4500000, deposit: 4500000, max: 4, status: 'AVAILABLE', desc: 'Phòng lớn áp mái sân vườn cực chill, bếp lớn, sofa phòng khách nhỏ.' },
    { num: 'P.302', floorIdx: 2, area: 25, price: 3700000, deposit: 3700000, max: 2, status: 'AVAILABLE', desc: 'Phòng tầng 3 yên tĩnh cho người đi làm hoặc học tập trực tuyến.' },
    { num: 'P.303', floorIdx: 2, area: 22, price: 3300000, deposit: 3300000, max: 2, status: 'AVAILABLE', desc: 'Phòng có kệ bếp gỗ, máy hút mùi, cửa sổ lớn đón gió mát.' }
  ];

  const createdRoomsMap: Record<string, any> = {};

  // Insert SkyHome rooms
  for (const cfg of skyRoomsConfig) {
    const room = await prisma.room.upsert({
      where: { propertyId_roomNumber: { propertyId: propSky.id, roomNumber: cfg.num } },
      update: {},
      create: {
        roomNumber: cfg.num,
        propertyId: propSky.id,
        floorId: skyFloors[cfg.floorIdx].id,
        area: cfg.area,
        basePrice: cfg.price,
        depositAmount: cfg.deposit,
        maxRenters: cfg.max,
        status: cfg.status,
        isPublic: true,
        description: cfg.desc
      }
    });
    createdRoomsMap[`SKY_${cfg.num}`] = room;

    // Attach amenities
    const pickedAmenities = [
      amenityMap['Điều hòa Inveter'],
      amenityMap['Bình nóng lạnh'],
      amenityMap['Wifi cáp quang riêng'],
      amenityMap['Khóa cửa vân tay']
    ];
    if (cfg.area >= 24) pickedAmenities.push(amenityMap['Ban công thoáng mát'], amenityMap['Kệ bếp nấu ăn & Chậu rửa']);
    if (cfg.desc.includes('gác')) pickedAmenities.push(amenityMap['Gác lửng kiên cố']);

    for (const a of pickedAmenities) {
      if (a) {
        await prisma.roomAmenity.upsert({
          where: { roomId_amenityId: { roomId: room.id, amenityId: a.id } },
          update: {},
          create: { roomId: room.id, amenityId: a.id }
        });
      }
    }

    // Attach images
    for (let i = 0; i < 3; i++) {
      await prisma.roomImage.create({
        data: {
          roomId: room.id,
          url: roomImagesPool[(room.id + i) % roomImagesPool.length],
          caption: `${cfg.num} - Góc chụp ${i + 1}`,
          isCover: i === 0,
          orderIndex: i
        }
      });
    }
  }

  // Insert GreenHouse rooms
  for (const cfg of greenRoomsConfig) {
    const room = await prisma.room.upsert({
      where: { propertyId_roomNumber: { propertyId: propGreen.id, roomNumber: cfg.num } },
      update: {},
      create: {
        roomNumber: cfg.num,
        propertyId: propGreen.id,
        floorId: greenFloors[cfg.floorIdx].id,
        area: cfg.area,
        basePrice: cfg.price,
        depositAmount: cfg.deposit,
        maxRenters: cfg.max,
        status: cfg.status,
        isPublic: true,
        description: cfg.desc
      }
    });
    createdRoomsMap[`GREEN_${cfg.num}`] = room;

    const pickedAmenities = [
      amenityMap['Điều hòa Inveter'],
      amenityMap['Bình nóng lạnh'],
      amenityMap['Wifi cáp quang riêng'],
      amenityMap['Máy giặt chung']
    ];
    if (cfg.area >= 25) pickedAmenities.push(amenityMap['Tủ lạnh hai cánh'], amenityMap['Ban công thoáng mát']);

    for (const a of pickedAmenities) {
      if (a) {
        await prisma.roomAmenity.upsert({
          where: { roomId_amenityId: { roomId: room.id, amenityId: a.id } },
          update: {},
          create: { roomId: room.id, amenityId: a.id }
        });
      }
    }

    for (let i = 0; i < 3; i++) {
      await prisma.roomImage.create({
        data: {
          roomId: room.id,
          url: roomImagesPool[(room.id + i + 1) % roomImagesPool.length],
          caption: `${cfg.num} - Ảnh chi tiết ${i + 1}`,
          isCover: i === 0,
          orderIndex: i
        }
      });
    }
  }
  console.log('✅ Đã tạo 20 phòng trọ mẫu kèm hình ảnh và tiện ích chi tiết');

  // 7. TÀI KHOẢN NGƯỜI THUÊ & HỒ SƠ (TENANT PROFILE)
  const tenantUsersData = [
    {
      username: 'khach1',
      fullName: 'Trần Thị Mai Phương',
      phone: '0912345678',
      email: 'maiphuong@gmail.com',
      cccd: '001198004567',
      birth: new Date('1998-05-12'),
      gender: 'NU',
      hometown: 'Thái Bình',
      roomKey: 'SKY_P.101',
      mustChangePassword: false
    },
    {
      username: 'khach2',
      fullName: 'Lê Hoàng Nam',
      phone: '0987654321',
      email: 'hoangnam.it@gmail.com',
      cccd: '001199008912',
      birth: new Date('1999-10-20'),
      gender: 'NAM',
      hometown: 'Hải Phòng',
      roomKey: 'SKY_P.201',
      mustChangePassword: false
    },
    {
      username: 'khach3',
      fullName: 'Phạm Quốc Bảo',
      phone: '0905123987',
      email: 'quocbao.design@gmail.com',
      cccd: '079200004523',
      birth: new Date('2000-03-15'),
      gender: 'NAM',
      hometown: 'Đồng Nai',
      roomKey: 'GREEN_P.102',
      mustChangePassword: false
    },
    {
      username: 'khach4',
      fullName: 'Nguyễn Thu Hà',
      phone: '0938112233',
      email: 'thuha.hr@gmail.com',
      cccd: '079201007891',
      birth: new Date('2001-08-25'),
      gender: 'NU',
      hometown: 'Vũng Tàu',
      roomKey: 'GREEN_P.202',
      mustChangePassword: true // Test lần đầu đăng nhập bắt buộc đổi pass
    }
  ];

  const tenantProfileMap: Record<string, any> = {};

  for (const t of tenantUsersData) {
    const user = await prisma.user.upsert({
      where: { username: t.username },
      update: {},
      create: {
        username: t.username,
        password: passwordHash,
        fullName: t.fullName,
        role: 'TENANT',
        phone: t.phone,
        email: t.email,
        isActive: true,
        mustChangePassword: t.mustChangePassword
      }
    });

    const room = createdRoomsMap[t.roomKey];

    const profile = await prisma.tenantProfile.upsert({
      where: { phone: t.phone },
      update: {},
      create: {
        userId: user.id,
        fullName: t.fullName,
        phone: t.phone,
        email: t.email,
        identityNumber: t.cccd,
        identityIssueDate: new Date('2021-06-15'),
        identityIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
        dateOfBirth: t.birth,
        gender: t.gender,
        hometown: t.hometown,
        hasTemporaryResidence: true,
        currentRoomId: room.id
      }
    });

    tenantProfileMap[t.username] = { user, profile, room };
  }
  console.log('✅ Đã tạo 4 tài khoản Người thuê trọ (TENANT): khach1, khach2, khach3, khach4 / pass: 123456');

  // 8. HỢP ĐỒNG THUÊ (CONTRACT)
  // Contract 1: Mai Phương thuê P.101 SkyHome
  const contract1 = await prisma.contract.upsert({
    where: { contractCode: 'HD-2026-P101' },
    update: {},
    create: {
      contractCode: 'HD-2026-P101',
      roomId: tenantProfileMap['khach1'].room.id,
      tenantId: tenantProfileMap['khach1'].profile.id,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-06-01'),
      rentalPrice: 3500000,
      depositAmount: 3500000,
      status: 'ACTIVE',
      terms: 'Người thuê có trách nhiệm giữ gìn vệ sinh, không gây ồn sau 23h. Thanh toán tiền phòng từ ngày 01 đến ngày 05 hàng tháng.',
      note: 'Hợp đồng ký 12 tháng, cọc 1 tháng tiền phòng.'
    }
  });

  // Người ở cùng P.101
  await prisma.contractOccupant.create({
    data: {
      contractId: contract1.id,
      fullName: 'Trần Thị Mai Lan',
      phone: '0912999888',
      identityNumber: '001199003322',
      relationship: 'Em gái',
      hasTemporaryResidence: true
    }
  });

  // Dịch vụ của HĐ 1
  for (const s of [serviceMap['ELEC'], serviceMap['WATER'], serviceMap['INTERNET'], serviceMap['CLEANING']]) {
    await prisma.contractService.upsert({
      where: { contractId_serviceId: { contractId: contract1.id, serviceId: s.id } },
      update: {},
      create: {
        contractId: contract1.id,
        serviceId: s.id,
        customPrice: s.defaultPrice,
        quantity: 1
      }
    });
  }

  // Contract 2: Nam thuê P.201 SkyHome (có 1 xe máy)
  const contract2 = await prisma.contract.upsert({
    where: { contractCode: 'HD-2026-P201' },
    update: {},
    create: {
      contractCode: 'HD-2026-P201',
      roomId: tenantProfileMap['khach2'].room.id,
      tenantId: tenantProfileMap['khach2'].profile.id,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2027-08-01'),
      rentalPrice: 3800000,
      depositAmount: 3800000,
      status: 'ACTIVE',
      terms: 'Đóng tiền phòng đúng hạn. Không mang chất dễ cháy nổ vào phòng trọ.'
    }
  });

  for (const s of [serviceMap['ELEC'], serviceMap['WATER'], serviceMap['INTERNET'], serviceMap['PARKING'], serviceMap['CLEANING']]) {
    await prisma.contractService.upsert({
      where: { contractId_serviceId: { contractId: contract2.id, serviceId: s.id } },
      update: {},
      create: {
        contractId: contract2.id,
        serviceId: s.id,
        customPrice: s.defaultPrice,
        quantity: s.code === 'PARKING' ? 2 : 1 // 2 xe máy
      }
    });
  }

  // Contract 3: Bảo thuê P.102 GreenHouse
  const contract3 = await prisma.contract.upsert({
    where: { contractCode: 'HD-2026-P102' },
    update: {},
    create: {
      contractCode: 'HD-2026-P102',
      roomId: tenantProfileMap['khach3'].room.id,
      tenantId: tenantProfileMap['khach3'].profile.id,
      startDate: new Date('2026-05-15'),
      endDate: new Date('2027-05-15'),
      rentalPrice: 4000000,
      depositAmount: 4000000,
      status: 'ACTIVE'
    }
  });

  // Contract 4: Hà thuê P.202 GreenHouse
  const contract4 = await prisma.contract.upsert({
    where: { contractCode: 'HD-2026-P202' },
    update: {},
    create: {
      contractCode: 'HD-2026-P202',
      roomId: tenantProfileMap['khach4'].room.id,
      tenantId: tenantProfileMap['khach4'].profile.id,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-09-01'),
      rentalPrice: 3600000,
      depositAmount: 3600000,
      status: 'ACTIVE'
    }
  });

  // Contract 5: ĐÃ THANH LÝ (TERMINATED) - Test đối soát công nợ, cọc & lý do khấu trừ
  const terminatedRoom = createdRoomsMap['SKY_P.301'];
  const contract5 = await prisma.contract.upsert({
    where: { contractCode: 'HD-2025-P301' },
    update: {},
    create: {
      contractCode: 'HD-2025-P301',
      roomId: terminatedRoom.id,
      tenantId: tenantProfileMap['khach1'].profile.id,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-10-01'),
      actualEndDate: new Date('2026-10-31'),
      rentalPrice: 4000000,
      depositAmount: 4000000,
      depositRefunded: 3700000,
      depositDeducted: 300000,
      deductionReason: 'Khấu trừ 300.000đ phí vệ sinh dọn dẹp bàn giao phòng và sơn dặm vết trầy tường do đóng đinh.',
      status: 'TERMINATED',
      note: 'Khách chuyển công tác vào TP.HCM, thanh lý hợp đồng đúng quy trình thỏa thuận 2 bên.'
    }
  });

  console.log('✅ Đã tạo 5 Hợp đồng mẫu (4 Đang hiệu lực, 1 Đã thanh lý hoàn cọc)');

  // 9. CHỈ SỐ ĐIỆN NƯỚC (METER READING)
  // P.101 SkyHome: Tháng 10/2026 và Tháng 11/2026
  const meter10_P101 = await prisma.meterReading.upsert({
    where: { roomId_period: { roomId: tenantProfileMap['khach1'].room.id, period: '2026-10' } },
    update: {},
    create: {
      roomId: tenantProfileMap['khach1'].room.id,
      period: '2026-10',
      oldElectricity: 1200,
      newElectricity: 1330,
      usedElectricity: 130, // 130 kWh
      oldWater: 45,
      newWater: 53,
      usedWater: 8, // 8 m3
      readingDate: new Date('2026-10-31'),
      recordedBy: 'Nguyễn Văn Ba'
    }
  });

  const meter11_P101 = await prisma.meterReading.upsert({
    where: { roomId_period: { roomId: tenantProfileMap['khach1'].room.id, period: '2026-11' } },
    update: {},
    create: {
      roomId: tenantProfileMap['khach1'].room.id,
      period: '2026-11',
      oldElectricity: 1330,
      newElectricity: 1475,
      usedElectricity: 145, // 145 kWh
      oldWater: 53,
      newWater: 62,
      usedWater: 9, // 9 m3
      readingDate: new Date('2026-11-05'),
      recordedBy: 'Nguyễn Văn Ba'
    }
  });

  // P.201 SkyHome: Tháng 11/2026
  const meter11_P201 = await prisma.meterReading.upsert({
    where: { roomId_period: { roomId: tenantProfileMap['khach2'].room.id, period: '2026-11' } },
    update: {},
    create: {
      roomId: tenantProfileMap['khach2'].room.id,
      period: '2026-11',
      oldElectricity: 820,
      newElectricity: 980,
      usedElectricity: 160,
      oldWater: 30,
      newWater: 40,
      usedWater: 10,
      readingDate: new Date('2026-11-05'),
      recordedBy: 'Nguyễn Văn Ba'
    }
  });

  // P.102 GreenHouse: Tháng 10/2026
  const meter10_P102 = await prisma.meterReading.upsert({
    where: { roomId_period: { roomId: tenantProfileMap['khach3'].room.id, period: '2026-10' } },
    update: {},
    create: {
      roomId: tenantProfileMap['khach3'].room.id,
      period: '2026-10',
      oldElectricity: 2100,
      newElectricity: 2280,
      usedElectricity: 180,
      oldWater: 90,
      newWater: 102,
      usedWater: 12,
      readingDate: new Date('2026-10-31'),
      recordedBy: 'Nguyễn Văn Ba'
    }
  });
  console.log('✅ Đã tạo chỉ số điện nước định kỳ');

  // 10. HÓA ĐƠN & CHI TIẾT (INVOICE & INVOICE ITEMS)
  // Hóa đơn 1: Kỳ 10/2026 P.101 - ĐÃ THANH TOÁN ĐỦ (PAID)
  const inv1 = await prisma.invoice.upsert({
    where: { contractId_period: { contractId: contract1.id, period: '2026-10' } },
    update: {},
    create: {
      invoiceCode: 'HD-202610-P101',
      roomId: tenantProfileMap['khach1'].room.id,
      contractId: contract1.id,
      meterReadingId: meter10_P101.id,
      period: '2026-10',
      issueDate: new Date('2026-10-31'),
      dueDate: new Date('2026-11-05'),
      roomAmount: 3500000,
      servicesAmount: 705000,
      surcharge: 0,
      discount: 0,
      totalAmount: 4205000,
      paidAmount: 4205000,
      remainingAmount: 0,
      status: 'PAID',
      isOverdue: false,
      notes: 'Đã thanh toán đủ ngày 02/11 qua ngân hàng.'
    }
  });

  // Items của HĐ 1
  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv1.id, itemName: 'Tiền thuê phòng tháng 10/2026', itemType: 'ROOM', unitPrice: 3500000, quantity: 1, unit: 'Tháng', amount: 3500000 },
      { invoiceId: inv1.id, itemName: 'Tiền điện (130 kWh * 3.500đ)', itemType: 'ELECTRICITY', unitPrice: 3500, quantity: 130, unit: 'kWh', amount: 455000 },
      { invoiceId: inv1.id, itemName: 'Tiền nước (8 m3 * 25.000đ)', itemType: 'WATER', unitPrice: 25000, quantity: 8, unit: 'm3', amount: 200000 },
      { invoiceId: inv1.id, itemName: 'Internet Wifi cáp quang', itemType: 'SERVICE', unitPrice: 100000, quantity: 1, unit: 'Tháng', amount: 100000 },
      { invoiceId: inv1.id, itemName: 'Phí vệ sinh & rác', itemType: 'SERVICE', unitPrice: 50000, quantity: 1, unit: 'Tháng', amount: 50000 },
      { invoiceId: inv1.id, itemName: 'Khuyến mãi mùa thi', itemType: 'DISCOUNT', unitPrice: 100000, quantity: 1, unit: 'Lần', amount: -100000 }
    ]
  });

  // Payment cho HĐ 1
  await prisma.payment.create({
    data: {
      paymentCode: 'PT-202611-001',
      invoiceId: inv1.id,
      amount: 4205000,
      paymentMethod: 'TRANSFER',
      paymentDate: new Date('2026-11-02T09:30:00Z'),
      receivedBy: 'Nguyễn Văn Ba',
      transactionReference: 'VCB-FT889123001',
      notes: 'Mai Phương chuyển khoản VCB'
    }
  });

  // Hóa đơn 2: Kỳ 11/2026 P.101 - CHƯA THANH TOÁN (ISSUED)
  const inv2 = await prisma.invoice.upsert({
    where: { contractId_period: { contractId: contract1.id, period: '2026-11' } },
    update: {},
    create: {
      invoiceCode: 'HD-202611-P101',
      roomId: tenantProfileMap['khach1'].room.id,
      contractId: contract1.id,
      meterReadingId: meter11_P101.id,
      period: '2026-11',
      issueDate: new Date('2026-11-06'),
      dueDate: new Date('2026-11-15'),
      roomAmount: 3500000,
      servicesAmount: 882500,
      surcharge: 0,
      discount: 0,
      totalAmount: 4382500,
      paidAmount: 0,
      remainingAmount: 4382500,
      status: 'ISSUED',
      isOverdue: false,
      notes: 'Hóa đơn tiền phòng kỳ tháng 11/2026'
    }
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv2.id, itemName: 'Tiền thuê phòng tháng 11/2026', itemType: 'ROOM', unitPrice: 3500000, quantity: 1, unit: 'Tháng', amount: 3500000 },
      { invoiceId: inv2.id, itemName: 'Tiền điện (145 kWh * 3.500đ)', itemType: 'ELECTRICITY', unitPrice: 3500, quantity: 145, unit: 'kWh', amount: 507500 },
      { invoiceId: inv2.id, itemName: 'Tiền nước (9 m3 * 25.000đ)', itemType: 'WATER', unitPrice: 25000, quantity: 9, unit: 'm3', amount: 225000 },
      { invoiceId: inv2.id, itemName: 'Internet Wifi cáp quang', itemType: 'SERVICE', unitPrice: 100000, quantity: 1, unit: 'Tháng', amount: 100000 },
      { invoiceId: inv2.id, itemName: 'Phí vệ sinh & rác', itemType: 'SERVICE', unitPrice: 50000, quantity: 1, unit: 'Tháng', amount: 50000 }
    ]
  });

  // Minh chứng thanh toán (PaymentSubmission) mẫu PENDING của khách 1 gửi cho HĐ 2
  await prisma.paymentSubmission.create({
    data: {
      invoiceId: inv2.id,
      tenantId: tenantProfileMap['khach1'].profile.id,
      amount: 4382500,
      bankName: 'Vietcombank',
      transactionCode: 'VCB-MB1109012',
      proofImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      note: 'Em vừa chuyển khoản đủ tiền phòng và điện nước tháng 11 ạ. Bác Ba kiểm tra giúp em!',
      status: 'PENDING'
    }
  });

  // Hóa đơn 3: Kỳ 11/2026 P.201 - THANH TOÁN MỘT PHẦN (PARTIALLY_PAID)
  const inv3 = await prisma.invoice.upsert({
    where: { contractId_period: { contractId: contract2.id, period: '2026-11' } },
    update: {},
    create: {
      invoiceCode: 'HD-202611-P201',
      roomId: tenantProfileMap['khach2'].room.id,
      contractId: contract2.id,
      meterReadingId: meter11_P201.id,
      period: '2026-11',
      issueDate: new Date('2026-11-06'),
      dueDate: new Date('2026-11-15'),
      roomAmount: 3800000,
      servicesAmount: 1160000,
      surcharge: 0,
      discount: 0,
      totalAmount: 4960000,
      paidAmount: 3000000,
      remainingAmount: 1960000,
      status: 'PARTIALLY_PAID',
      isOverdue: false,
      notes: 'Khách xin trả trước 3.000.000đ, số còn lại 1.960.000đ hẹn trả ngày 15/11 khi nhận lương.'
    }
  });

  await prisma.payment.create({
    data: {
      paymentCode: 'PT-202611-002',
      invoiceId: inv3.id,
      amount: 3000000,
      paymentMethod: 'TRANSFER',
      paymentDate: new Date('2026-11-08T14:15:00Z'),
      receivedBy: 'Nguyễn Văn Ba',
      transactionReference: 'MB-10908872',
      notes: 'Nam trả trước đợt 1 tiền phòng'
    }
  });

  // Hóa đơn 4: Kỳ 10/2026 P.102 GreenHouse - QUÁ HẠN (OVERDUE)
  const inv4 = await prisma.invoice.upsert({
    where: { contractId_period: { contractId: contract3.id, period: '2026-10' } },
    update: {},
    create: {
      invoiceCode: 'HD-202610-P102',
      roomId: tenantProfileMap['khach3'].room.id,
      contractId: contract3.id,
      meterReadingId: meter10_P102.id,
      period: '2026-10',
      issueDate: new Date('2026-10-25'),
      dueDate: new Date('2026-11-02'), // Đã quá hạn
      roomAmount: 4000000,
      servicesAmount: 1080000,
      surcharge: 50000, // Phụ thu phạt chậm nộp
      discount: 0,
      adjustmentReason: 'Phụ thu nhắc nhở nộp chậm quá 3 ngày',
      totalAmount: 5130000,
      paidAmount: 0,
      remainingAmount: 5130000,
      status: 'ISSUED',
      isOverdue: true,
      notes: 'Hóa đơn đã quá hạn nộp từ ngày 02/11/2026'
    }
  });

  console.log('✅ Đã tạo các Hóa đơn đa dạng: Đã thanh toán, Chưa trả, Trả 1 phần, Quá hạn');

  // 11. LỊCH XEM PHÒNG TỪ WEBSITE CÔNG KHAI (VIEWING APPOINTMENT)
  await prisma.viewingAppointment.upsert({
    where: { appointmentCode: 'LH-2026-001' },
    update: {},
    create: {
      appointmentCode: 'LH-2026-001',
      roomId: createdRoomsMap['SKY_P.103'].id,
      fullName: 'Hoàng Tuấn Đạt',
      phone: '0977889900',
      email: 'tuandat.tech@gmail.com',
      preferredDate: new Date('2026-11-12T14:30:00Z'),
      message: 'Tôi là kỹ sư phần mềm làm việc tại Duy Tân, muốn xem phòng 103 và dọn vào ở từ cuối tuần này nếu ưng ý.',
      status: 'PENDING'
    }
  });

  await prisma.viewingAppointment.upsert({
    where: { appointmentCode: 'LH-2026-002' },
    update: {},
    create: {
      appointmentCode: 'LH-2026-002',
      roomId: createdRoomsMap['GREEN_P.203'].id,
      fullName: 'Đỗ Thị Minh Châu',
      phone: '0966554433',
      email: 'minhchau.hutech@gmail.com',
      preferredDate: new Date('2026-11-13T10:00:00Z'),
      message: 'Sinh viên HUTECH muốn xem phòng 203 cùng mẹ. Nhờ chủ nhà đón tiếp giúp.',
      status: 'CONFIRMED',
      ownerNote: 'Đã gọi điện xác nhận hẹn đón khách lúc 10h sáng ngày 13/11.'
    }
  });

  await prisma.viewingAppointment.upsert({
    where: { appointmentCode: 'LH-2026-003' },
    update: {},
    create: {
      appointmentCode: 'LH-2026-003',
      roomId: createdRoomsMap['SKY_P.302'].id,
      fullName: 'Lê Văn Tuấn',
      phone: '0903332211',
      preferredDate: new Date('2026-11-09T16:00:00Z'),
      message: 'Hẹn xem phòng 302',
      status: 'COMPLETED',
      ownerNote: 'Khách đã đến xem phòng hôm 09/11, phản hồi ưng ý và đang chuẩn bị tiền cọc.'
    }
  });
  console.log('✅ Đã tạo 3 Lịch hẹn xem phòng từ trang web công khai');

  // 12. YÊU CẦU SỬA CHỮA (MAINTENANCE REQUEST & UPDATES)
  const req1 = await prisma.maintenanceRequest.upsert({
    where: { requestCode: 'SC-2026-001' },
    update: {},
    create: {
      requestCode: 'SC-2026-001',
      roomId: tenantProfileMap['khach1'].room.id,
      tenantId: tenantProfileMap['khach1'].profile.id,
      createdByUserId: tenantProfileMap['khach1'].user.id,
      title: 'Điều hòa chảy nước xuống sàn và phát tiếng kêu',
      category: 'ELECTRICAL',
      urgency: 'HIGH',
      description: 'Máy lạnh phòng 101 bật tầm 30 phút là nước nhỏ giọt xuống sàn gỗ, block ngoài kêu khá to. Bác Ba cho thợ qua kiểm tra giúp em với ạ.',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600',
      status: 'IN_PROGRESS',
      estimatedCost: 250000
    }
  });

  await prisma.maintenanceUpdate.createMany({
    data: [
      {
        requestId: req1.id,
        updatedByUserId: owner.id,
        status: 'RECEIVED',
        message: 'Bác đã nhận được phản ánh. Chiều nay bác gọi trung tâm bảo dưỡng Daikin qua xử lý nhé.'
      },
      {
        requestId: req1.id,
        updatedByUserId: owner.id,
        status: 'IN_PROGRESS',
        message: 'Thợ điện lạnh hẹn 15h00 chiều nay 11/11 sẽ có mặt tại phòng để thông ống thoát nước và vệ sinh lưới lọc.'
      }
    ]
  });

  const req2 = await prisma.maintenanceRequest.upsert({
    where: { requestCode: 'SC-2026-002' },
    update: {},
    create: {
      requestCode: 'SC-2026-002',
      roomId: tenantProfileMap['khach2'].room.id,
      tenantId: tenantProfileMap['khach2'].profile.id,
      createdByUserId: tenantProfileMap['khach2'].user.id,
      title: 'Bóng đèn ban công bị chập chờn rồi tắt hẳn',
      category: 'ELECTRICAL',
      urgency: 'LOW',
      description: 'Đèn ban công ngoài phòng 201 bị cháy hôm qua, cần thay bóng mới.',
      status: 'RESOLVED',
      estimatedCost: 65000,
      resolvedAt: new Date('2026-11-09')
    }
  });

  await prisma.maintenanceUpdate.create({
    data: {
      requestId: req2.id,
      updatedByUserId: owner.id,
      status: 'RESOLVED',
      message: 'Bác Ba đã trực tiếp thay bóng tuýp LED Rạng Đông 18W mới cho phòng.'
    }
  });

  console.log('✅ Đã tạo Yêu cầu sửa chữa & Tiến trình cập nhật thực tế');

  // 13. THÔNG BÁO (NOTIFICATION & RECIPIENTS)
  const notif1 = await prisma.notification.create({
    data: {
      title: 'Thông báo phát hành hóa đơn tiền phòng kỳ tháng 11/2026',
      content: 'Chủ nhà trọ đã chốt chỉ số điện nước và gửi hóa đơn tiền phòng tháng 11. Đề nghị các phòng kiểm tra chi tiết trên cổng thông tin người thuê và thanh toán trước ngày 15/11/2026.',
      type: 'PAYMENT_REMINDER',
      targetType: 'ALL'
    }
  });

  for (const tKey of Object.keys(tenantProfileMap)) {
    const u = tenantProfileMap[tKey].user;
    await prisma.notificationRecipient.create({
      data: {
        notificationId: notif1.id,
        userId: u.id,
        isRead: tKey === 'khach1'
      }
    });
  }

  const notif2 = await prisma.notification.create({
    data: {
      title: 'Quy định giữ gìn an ninh trật tự & phòng cháy chữa cháy',
      content: 'Nhắc nhở người thuê khóa cửa cuốn cổng chính sau 23h, tắt bếp từ và ngắt cầu dao sạc xe máy điện khi ra khỏi phòng hoặc đi ngủ.',
      type: 'RULES',
      targetType: 'ALL'
    }
  });

  for (const tKey of Object.keys(tenantProfileMap)) {
    const u = tenantProfileMap[tKey].user;
    await prisma.notificationRecipient.create({
      data: {
        notificationId: notif2.id,
        userId: u.id,
        isRead: false
      }
    });
  }

  // 14. NHẬT KÝ KIỂM TOÁN (AUDIT LOG)
  await prisma.auditLog.createMany({
    data: [
      {
        userId: owner.id,
        action: 'CREATE_CONTRACT',
        entity: 'Contract',
        entityId: 'HD-2026-P101',
        details: 'Khởi tạo hợp đồng thuê phòng P.101 cho khách Trần Thị Mai Phương'
      },
      {
        userId: owner.id,
        action: 'CREATE_INVOICE',
        entity: 'Invoice',
        entityId: 'HD-202611-P101',
        details: 'Phát hành hóa đơn tiền phòng tháng 11/2026 với số tiền 4.382.500đ'
      },
      {
        userId: owner.id,
        action: 'RECORD_PAYMENT',
        entity: 'Payment',
        entityId: 'PT-202611-001',
        details: 'Ghi nhận thanh toán chuyển khoản VCB 4.205.000đ cho hóa đơn HD-202610-P101'
      },
      {
        userId: owner.id,
        action: 'TERMINATE_CONTRACT',
        entity: 'Contract',
        entityId: 'HD-2025-P301',
        details: 'Thanh lý hợp đồng P.301, hoàn cọc 3.700.000đ, trừ 300.000đ sửa chữa'
      }
    ]
  });

  console.log('✅ Đã nạp thành công toàn bộ dữ liệu mẫu!');
  console.log('-------------------------------------------------------');
  console.log('👑 Tài khoản Chủ nhà (OWNER): chutro / 123456');
  console.log('👤 Tài khoản Người thuê (TENANT): khach1, khach2, khach3, khach4 / 123456');
  console.log('-------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi nạp seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
