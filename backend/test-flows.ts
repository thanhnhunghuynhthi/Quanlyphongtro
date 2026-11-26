const BASE_URL = 'http://localhost:5000/api';

async function request(path: string, options: any = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const status = res.status;
  let data: any = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status, data, ok: res.ok };
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU CHẠY KIỂM THỬ TỰ ĐỘNG 8 LUỒNG NGHIỆP VỤ BẮT BUỘC');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  try {
    // Đăng nhập Chủ nhà (OWNER)
    const ownerLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { username: 'chutro', password: '123456' }
    });
    const ownerToken = ownerLoginRes.data.token;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    assert(ownerLoginRes.data.user.role === 'OWNER', 'Chủ nhà đăng nhập thành công với vai trò OWNER');

    // Đăng nhập Người thuê (TENANT)
    const tenantLoginRes = await request('/auth/login', {
      method: 'POST',
      body: { username: 'khach1', password: '123456' }
    });
    const tenantToken = tenantLoginRes.data.token;
    const tenantHeaders = { Authorization: `Bearer ${tenantToken}` };
    assert(tenantLoginRes.data.user.role === 'TENANT', 'Người thuê đăng nhập thành công với vai trò TENANT');

    // -------------------------------------------------------------------------
    // LUỒNG 1: Khách xem phòng → đặt lịch → chủ nhà xác nhận
    // -------------------------------------------------------------------------
    console.log('\n--- LUỒNG 1: Khách xem phòng → đặt lịch → chủ nhà xác nhận ---');
    const apptRes = await request('/public/appointments', {
      method: 'POST',
      body: {
        roomId: 3, // P.103
        fullName: 'Phạm Hồng Sơn',
        phone: '0933445566',
        email: 'hongson@gmail.com',
        preferredDate: '2026-11-15T15:00:00Z',
        message: 'Muốn xem phòng 103'
      }
    });
    const apptId = apptRes.data.appointment.id;
    assert(apptRes.status === 201 && apptRes.data.appointment.status === 'PENDING', 'Khách gửi yêu cầu đặt lịch hẹn thành công (Status: PENDING)');

    const confirmRes = await request(`/appointments/${apptId}/status`, {
      method: 'PATCH',
      headers: ownerHeaders,
      body: {
        status: 'CONFIRMED',
        ownerNote: 'Đã gọi điện xác nhận'
      }
    });
    assert(confirmRes.data.appointment.status === 'CONFIRMED', 'Chủ nhà tiếp nhận và xác nhận lịch hẹn thành công');

    // -------------------------------------------------------------------------
    // LUỒNG 2: Chủ nhà tạo hồ sơ → lập hợp đồng → cấp tài khoản
    // -------------------------------------------------------------------------
    console.log('\n--- LUỒNG 2: Chủ nhà tạo hồ sơ → lập hợp đồng → cấp tài khoản ---');
    const newTenantRes = await request('/tenants', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        fullName: 'Đoàn Văn Hậu',
        phone: `0988${Math.floor(100000 + Math.random() * 900000)}`,
        identityNumber: `001200${Math.floor(100000 + Math.random() * 900000)}`,
        hometown: 'Thái Bình',
        hasTemporaryResidence: true
      }
    });
    const newTenantId = newTenantRes.data.tenant.id;
    assert(newTenantRes.status === 201, 'Chủ nhà tạo hồ sơ khách thuê mới thành công');

    // Lập hợp đồng cho phòng 5 (P.202 SkyHome - đang AVAILABLE)
    const newContractRes = await request('/contracts', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        contractCode: `HD-TEST-${Date.now()}`,
        roomId: 5,
        tenantId: newTenantId,
        startDate: '2026-12-01',
        endDate: '2027-12-01',
        rentalPrice: 3500000,
        depositAmount: 3500000,
        terms: 'Quy định phòng trọ chuẩn'
      }
    });
    const newContractId = newContractRes.data.contract.id;
    assert(newContractRes.status === 201, 'Lập hợp đồng thuê mới thành công');

    // Kiểm tra trạng thái phòng tự động chuyển sang OCCUPIED
    const roomCheckRes = await request('/rooms/5', { headers: ownerHeaders });
    assert(roomCheckRes.data.status === 'OCCUPIED', 'Trạng thái phòng tự động chuyển sang OCCUPIED sau khi lập HĐ');

    // Cấp tài khoản cho người thuê
    const provRes = await request('/users/tenants/provision', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        username: `khachtest_${Date.now()}`,
        fullName: 'Đoàn Văn Hậu',
        phone: `0977${Math.floor(100000 + Math.random() * 900000)}`,
        identityNumber: `001201${Math.floor(100000 + Math.random() * 900000)}`,
        roomId: 5,
        hometown: 'Thái Bình',
        temporaryPassword: '123456'
      }
    });
    assert(provRes.status === 201 && provRes.data.user.mustChangePassword === true, 'Cấp tài khoản người thuê thành công (bắt buộc đổi mật khẩu lần đầu)');

    // -------------------------------------------------------------------------
    // LUỒNG 3: Nhập điện nước → lập hóa đơn → ghi nhận thanh toán → cập nhật công nợ
    // -------------------------------------------------------------------------
    console.log('\n--- LUỒNG 3: Nhập điện nước → lập hóa đơn → ghi nhận thanh toán → cập nhật công nợ ---');
    const meterRes = await request('/meter-readings', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        roomId: 5,
        period: '2026-12',
        oldElectricity: 100,
        newElectricity: 150,
        oldWater: 10,
        newWater: 15
      }
    });
    assert(meterRes.data.reading.usedElectricity === 50 && meterRes.data.reading.usedWater === 5, 'Ghi chỉ số điện nước thành công: 50 kWh, 5 m3');

    const invRes = await request('/invoices', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        contractId: newContractId,
        period: '2026-12',
        dueDate: '2026-12-15'
      }
    });
    const testInvoiceId = invRes.data.invoice.id;
    assert(invRes.data.invoice.status === 'ISSUED' && invRes.data.invoice.remainingAmount > 0, 'Phát hành hóa đơn thành công (Status: ISSUED, snapshot đơn giá)');

    // Thu tiền đợt 1 (trả 2.000.000đ)
    const payRes = await request(`/invoices/${testInvoiceId}/payments`, {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        amount: 2000000,
        paymentMethod: 'TRANSFER',
        transactionReference: 'TEST-PAY-01'
      }
    });
    assert(payRes.data.invoice.status === 'PARTIALLY_PAID' && payRes.data.invoice.paidAmount === 2000000, 'Ghi nhận thanh toán đợt 1 thành công (Status chuyển sang PARTIALLY_PAID)');

    // -------------------------------------------------------------------------
    // LUỒNG 4: Người thuê đăng nhập → xem hóa đơn → gửi minh chứng
    // -------------------------------------------------------------------------
    console.log('\n--- LUỒNG 4: Người thuê đăng nhập → xem hóa đơn → gửi minh chứng ---');
    const myInvsRes = await request('/tenant/invoices', { headers: tenantHeaders });
    assert(myInvsRes.data.length > 0, 'Người thuê xem danh sách hóa đơn của phòng mình thành công');

    const targetInvId = myInvsRes.data[0].id;
    const proofRes = await request(`/invoices/${targetInvId}/submissions`, {
      method: 'POST',
      headers: tenantHeaders,
      body: {
        amount: 500000,
        bankName: 'Vietcombank',
        transactionCode: 'VCB-PROOF-99',
        proofImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
        note: 'Minh chứng chuyển khoản đợt 2'
      }
    });
    const submissionId = proofRes.data.submission.id;
    assert(proofRes.data.submission.status === 'PENDING', 'Người thuê gửi minh chứng thanh toán thành công (Status: PENDING)');

    // Chủ nhà duyệt minh chứng
    const reviewRes = await request(`/submissions/${submissionId}/review`, {
      method: 'POST',
      headers: ownerHeaders,
      body: { action: 'APPROVE' }
    });
    assert(reviewRes.status === 200, 'Chủ nhà phê duyệt minh chứng và tự động ghi nhận thanh toán thành công');

    // -------------------------------------------------------------------------
    // LUỒNG 5: Người thuê gửi yêu cầu sửa chữa → chủ nhà xử lý
    // -------------------------------------------------------------------------
    console.log('\n--- LUỒNG 5: Người thuê gửi yêu cầu sửa chữa → chủ nhà xử lý ---');
    const maintRes = await request('/maintenance', {
      method: 'POST',
      headers: tenantHeaders,
      body: {
        title: 'Bồn cầu bị rò nước nhẹ',
        category: 'PLUMBING',
        urgency: 'NORMAL',
        description: 'Van cấp nước bồn cầu phòng 101 tự động chảy nhỏ giọt'
      }
    });
    const maintId = maintRes.data.request.id;
    assert(maintRes.status === 201 && maintRes.data.request.status === 'PENDING', 'Người thuê gửi yêu cầu sửa chữa thành công');

    // Chủ nhà phản hồi tiến trình
    const updateRes = await request(`/maintenance/${maintId}/updates`, {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        status: 'IN_PROGRESS',
        message: 'Bác đã gọi thợ sửa ống nước, sáng mai 9h thợ qua nhé.'
      }
    });
    assert(updateRes.data.update.status === 'IN_PROGRESS', 'Chủ nhà phản hồi và cập nhật tiến trình sửa chữa thành công');

    // -------------------------------------------------------------------------
    // LUỒNG 6: Thanh lý hợp đồng → đối soát công nợ, cọc → cập nhật phòng
    // -------------------------------------------------------------------------
    console.log('\n--- LUỒNG 6: Thanh lý hợp đồng → đối soát công nợ, cọc → cập nhật phòng ---');
    const liqRes = await request(`/contracts/${newContractId}/liquidate`, {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        depositDeducted: 200000,
        deductionReason: 'Khấu trừ 200.000đ tiền dọn dẹp vệ sinh phòng khi bàn giao'
      }
    });
    assert(liqRes.data.contract.status === 'TERMINATED' && liqRes.data.contract.depositRefunded === 3300000, 'Thanh lý hợp đồng thành công (Hoàn cọc 3.300.000đ, Trừ 200.000đ)');

    // Kiểm tra phòng đã trở lại AVAILABLE
    const roomAfterLiq = await request('/rooms/5', { headers: ownerHeaders });
    assert(roomAfterLiq.data.status === 'AVAILABLE', 'Phòng tự động chuyển lại về trạng thái AVAILABLE sau khi thanh lý');

    // -------------------------------------------------------------------------
    // LUỒNG 7: Kiểm tra phân quyền và ngăn truy cập chéo dữ liệu (RBAC & Isolation)
    // -------------------------------------------------------------------------
    console.log('\n--- LUỒNG 7: Kiểm tra phân quyền & cách ly dữ liệu (RBAC & Tenant Isolation) ---');
    const rbacRes = await request('/rooms', {
      method: 'POST',
      headers: tenantHeaders,
      body: {
        roomNumber: 'P.HACK',
        propertyId: 1,
        floorId: 1,
        basePrice: 1000
      }
    });
    assert(rbacRes.status === 403, 'RBAC Server chặn thành công người thuê truy cập API quản trị của Chủ nhà (HTTP 403 Forbidden)');

    // Người thuê cố tình gửi minh chứng cho hóa đơn phòng khác (HD-202611-P201 - Invoice ID 3)
    const crossRes = await request('/invoices/3/submissions', {
      method: 'POST',
      headers: tenantHeaders,
      body: { amount: 100000 }
    });
    assert(crossRes.status === 403, 'Tenant Isolation Server chặn thành công truy cập chéo hóa đơn của phòng khác (HTTP 403 Forbidden)');

    // -------------------------------------------------------------------------
    // LUỒNG 8: Kiểm tra hợp đồng chồng lấn, hóa đơn trùng và chỉ số không hợp lệ
    // -------------------------------------------------------------------------
    console.log('\n--- LUỒNG 8: Kiểm tra ràng buộc hợp đồng chồng lấn, hóa đơn trùng & chỉ số âm ---');
    
    // Test 8.1: Hợp đồng chồng lấn thời gian trên phòng 1
    const overlapRes = await request('/contracts', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        contractCode: `HD-OVERLAP-${Date.now()}`,
        roomId: 1,
        tenantId: newTenantId,
        startDate: '2026-10-01',
        endDate: '2027-03-01',
        rentalPrice: 3500000,
        depositAmount: 3500000
      }
    });
    assert(overlapRes.status === 400 && String(overlapRes.data.message).includes('chồng lấn'), 'Hệ thống ngăn chặn thành công hợp đồng có thời gian chồng lấn trên cùng một phòng');

    // Test 8.2: Hóa đơn trùng lặp kỳ thu
    const dupInvRes = await request('/invoices', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        contractId: 1,
        period: '2026-10',
        dueDate: '2026-11-05'
      }
    });
    assert(dupInvRes.status === 400 && String(dupInvRes.data.message).includes('đã tồn tại'), 'Hệ thống ngăn chặn thành công lập trùng hóa đơn cho cùng hợp đồng và kỳ thu');

    // Test 8.3: Chỉ số điện nước mới < cũ
    const invalidMeterRes = await request('/meter-readings', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        roomId: 1,
        period: '2026-12',
        oldElectricity: 500,
        newElectricity: 450, // Nhỏ hơn cũ!
        oldWater: 20,
        newWater: 25
      }
    });
    assert(invalidMeterRes.status === 400 && String(invalidMeterRes.data.message).includes('không được nhỏ hơn'), 'Hệ thống ngăn chặn thành công chỉ số điện mới nhỏ hơn chỉ số cũ');

  } catch (err: any) {
    console.error('Lỗi ngoại lệ trong quá trình chạy kiểm thử:', err.message);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  if (failed === 0) {
    console.log('🎉 TẤT CẢ 8 LUỒNG NGHIỆP VỤ BẮT BUỘC ĐÃ HOẠT ĐỘNG HOÀN HẢO!');
  }
  console.log('===============================================================');
}

runAllTests();
