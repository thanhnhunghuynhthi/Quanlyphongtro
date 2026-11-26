import { supportPhone } from '../siteDetails';
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Contract, Room, TenantProfile, Service } from '../types';
import {
  FileText, Plus, Calendar, User, DollarSign, CheckCircle2,
  AlertTriangle, Eye, Printer, XCircle, Search, RefreshCw, X, Shield, ArrowRight
} from 'lucide-react';

interface ContractsViewProps {
  initialTenantId?: number;
  initialRoomId?: number;
}

export const ContractsView: React.FC<ContractsViewProps> = ({ initialTenantId, initialRoomId }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Lập Hợp Đồng
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    contractCode: '',
    roomId: initialRoomId ? String(initialRoomId) : '',
    tenantId: initialTenantId ? String(initialTenantId) : '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    rentalPrice: '',
    depositAmount: '',
    terms: 'Bên B có trách nhiệm thanh toán tiền phòng từ ngày 01 đến ngày 05 hàng tháng. Giữ gìn an ninh trật tự và thiết bị trong phòng. Báo trước 30 ngày khi kết thúc hợp đồng.',
    occupants: [{ fullName: '', phone: '', identityNumber: '', relationship: 'Bạn' }]
  });
  const [creating, setCreating] = useState(false);

  // Modal Thanh Lý Hợp Đồng
  const [liquidatingContract, setLiquidatingContract] = useState<Contract | null>(null);
  const [liquidateForm, setLiquidateForm] = useState({
    depositDeducted: '0',
    deductionReason: 'Hoàn trả đủ tiền đặt cọc'
  });
  const [liquidating, setLiquidating] = useState(false);

  // Modal Xem & In Hợp Đồng
  const [printingContract, setPrintingContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [filterStatus, search]);

  useEffect(() => {
    if (initialTenantId || initialRoomId) {
      setShowCreateModal(true);
      if (initialRoomId) setForm(f => ({ ...f, roomId: String(initialRoomId) }));
      if (initialTenantId) setForm(f => ({ ...f, tenantId: String(initialTenantId) }));
    }
  }, [initialTenantId, initialRoomId]);

  const fetchInitialData = async () => {
    try {
      const [roomsRes, tenantsRes, servRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/tenants'),
        api.get('/services')
      ]);
      setRooms(roomsRes.data);
      setTenants(tenantsRes.data);
      setServices(servRes.data);
    } catch (err) {
      console.error('Lỗi tải danh mục tạo HĐ:', err);
    }
  };

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const res = await api.get('/contracts', { params });
      setContracts(res.data);
    } catch (err) {
      console.error('Lỗi danh sách hợp đồng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (roomIdStr: string) => {
    const selected = rooms.find(r => String(r.id) === roomIdStr);
    if (selected) {
      setForm({
        ...form,
        roomId: roomIdStr,
        rentalPrice: String(selected.basePrice),
        depositAmount: String(selected.depositAmount || selected.basePrice),
        contractCode: `HD-${new Date().getFullYear()}-P${selected.roomNumber.replace(/[^0-9]/g, '')}`
      });
    } else {
      setForm({ ...form, roomId: roomIdStr });
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        contractCode: form.contractCode,
        roomId: parseInt(form.roomId),
        tenantId: parseInt(form.tenantId),
        startDate: form.startDate,
        endDate: form.endDate,
        rentalPrice: parseFloat(form.rentalPrice),
        depositAmount: parseFloat(form.depositAmount),
        terms: form.terms,
        occupants: form.occupants.filter(o => o.fullName.trim() !== '')
      };

      const res = await api.post('/contracts', payload);
      alert(res.data.message);
      setShowCreateModal(false);
      fetchContracts();
      fetchInitialData(); // Refresh room status
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi lập hợp đồng.');
    } finally {
      setCreating(false);
    }
  };

  const handleLiquidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liquidatingContract) return;

    setLiquidating(true);
    try {
      const res = await api.post(`/contracts/${liquidatingContract.id}/liquidate`, {
        depositDeducted: parseFloat(liquidateForm.depositDeducted || '0'),
        deductionReason: liquidateForm.deductionReason
      });

      alert(res.data.message);
      if (res.data.warning) {
        alert(res.data.warning);
      }

      setLiquidatingContract(null);
      fetchContracts();
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi thanh lý hợp đồng.');
    } finally {
      setLiquidating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">PHÁP LÝ & KÝ KẾT</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Hợp Đồng Thuê Trọ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Lập hợp đồng (chống trùng lấn thời gian), quản lý người ở cùng, in mẫu HĐ và quy trình thanh lý đối soát cọc
          </p>
        </div>

        <button
          onClick={() => {
            setForm({
              contractCode: `HD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
              roomId: '',
              tenantId: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              rentalPrice: '3500000',
              depositAmount: '3500000',
              terms: 'Bên B có trách nhiệm thanh toán tiền phòng từ ngày 01 đến ngày 05 hàng tháng. Giữ gìn an ninh trật tự và thiết bị trong phòng. Báo trước 30 ngày khi kết thúc hợp đồng.',
              occupants: [{ fullName: '', phone: '', identityNumber: '', relationship: 'Bạn' }]
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md self-start sm:self-auto"
        >
          <Plus size={16} /> Lập Hợp Đồng Mới
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hiệu lực (ACTIVE)</option>
            <option value="TERMINATED">Đã thanh lý (TERMINATED)</option>
            <option value="EXPIRED">Đã hết hạn (EXPIRED)</option>
          </select>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã HĐ, tên khách, số phòng..."
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 w-64"
            />
          </div>
        </div>

        <p className="text-slate-500 text-[11px] font-semibold">
          Tổng số: <strong className="text-slate-800">{contracts.length}</strong> hợp đồng
        </p>
      </div>

      {/* Contract Cards Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <RefreshCw size={28} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Đang tải danh sách hợp đồng...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs border max-w-md mx-auto space-y-2">
          <FileText size={32} className="text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Không có hợp đồng nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contracts.map((c) => {
            const isActive = c.status === 'ACTIVE';

            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-slate-900 text-base">{c.contractCode}</span>
                      <span className="text-[11px] text-teal-700 font-bold block">
                        Phòng {c.room?.roomNumber} ({c.room?.property?.name})
                      </span>
                    </div>

                    <div>
                      {isActive ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Đang hiệu lực
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          Đã thanh lý
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tenant information */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Người đại diện:</span>
                      <strong className="text-slate-800">{c.tenant?.fullName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Số điện thoại:</span>
                      <strong className="text-slate-800 font-mono">{c.tenant?.phone}</strong>
                    </div>
                  </div>

                  {/* Pricing and dates */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-teal-50/50 rounded-xl border border-teal-100">
                      <span className="text-[10px] text-slate-400 block">Giá thuê</span>
                      <strong className="text-teal-700 font-extrabold">{c.rentalPrice.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border">
                      <span className="text-[10px] text-slate-400 block">Tiền cọc</span>
                      <strong className="text-slate-800 font-bold">{c.depositAmount.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 pt-1">
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <Calendar size={13} className="text-teal-600" />
                      <span>{new Date(c.startDate).toLocaleDateString('vi-VN')} - {new Date(c.endDate).toLocaleDateString('vi-VN')}</span>
                    </p>

                    {/* Occupants badge */}
                    {c.occupants && c.occupants.length > 0 && (
                      <p className="text-[11px] text-slate-600">
                        Người ở cùng: <strong>{c.occupants.map(o => o.fullName).join(', ')}</strong>
                      </p>
                    )}

                    {/* Liquidation deduction info */}
                    {c.status === 'TERMINATED' && c.depositDeducted !== undefined && (
                      <div className="p-2 bg-amber-50 rounded-lg text-[10px] text-amber-900 border border-amber-200">
                        Hoàn cọc: <strong>{c.depositRefunded?.toLocaleString('vi-VN')} đ</strong> • Khấu trừ: <strong>{c.depositDeducted?.toLocaleString('vi-VN')} đ</strong> ({c.deductionReason})
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintingContract(c)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1"
                    title="In hợp đồng mẫu"
                  >
                    <Printer size={15} /> In Hợp Đồng
                  </button>

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setLiquidatingContract(c);
                        setLiquidateForm({
                          depositDeducted: '0',
                          deductionReason: 'Hoàn trả đủ tiền đặt cọc'
                        });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition flex items-center gap-1"
                    >
                      <XCircle size={15} /> Thanh Lý HĐ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL LẬP HỢP ĐỒNG THUÊ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Khởi Tạo Hợp Đồng Thuê Trọ Mới</h3>
                <p className="text-xs text-slate-500">Hệ thống tự động kiểm tra chống trùng lấn thời gian trên phòng</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Chọn phòng cho thuê <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.roomId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-slate-50"
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.roomNumber} ({r.property?.name}) - {r.basePrice.toLocaleString('vi-VN')} đ
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Người đại diện ký HĐ <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.tenantId}
                    onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-slate-50"
                  >
                    <option value="">-- Chọn người thuê --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mã hợp đồng</label>
                  <input
                    type="text"
                    required
                    value={form.contractCode}
                    onChange={(e) => setForm({ ...form, contractCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Giá thuê ký (đ/tháng)</label>
                  <input
                    type="number"
                    required
                    value={form.rentalPrice}
                    onChange={(e) => setForm({ ...form, rentalPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold text-teal-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tiền cọc nhận (VNĐ)</label>
                  <input
                    type="number"
                    required
                    value={form.depositAmount}
                    onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ngày bắt đầu thuê <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ngày kết thúc thuê <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Người ở cùng */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Người ở cùng trong phòng (nếu có)</label>
                  <button
                    type="button"
                    onClick={() => setForm({
                      ...form,
                      occupants: [...form.occupants, { fullName: '', phone: '', identityNumber: '', relationship: 'Bạn' }]
                    })}
                    className="text-[11px] font-bold text-teal-600 hover:underline"
                  >
                    + Thêm người ở cùng
                  </button>
                </div>

                {form.occupants.map((occ, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Họ tên người ở cùng..."
                      value={occ.fullName}
                      onChange={(e) => {
                        const next = [...form.occupants];
                        next[idx].fullName = e.target.value;
                        setForm({ ...form, occupants: next });
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Số điện thoại..."
                      value={occ.phone || ''}
                      onChange={(e) => {
                        const next = [...form.occupants];
                        next[idx].phone = e.target.value;
                        setForm({ ...form, occupants: next });
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Quan hệ (Bạn, Em gái...)"
                      value={occ.relationship || ''}
                      onChange={(e) => {
                        const next = [...form.occupants];
                        next[idx].relationship = e.target.value;
                        setForm({ ...form, occupants: next });
                      }}
                      className="px-3 py-1.5 rounded-lg border text-xs"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Điều khoản hợp đồng</label>
                <textarea
                  rows={3}
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow"
                >
                  {creating ? 'Đang tạo...' : 'KÝ HỢP ĐỒNG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THANH LÝ HỢP ĐỒNG */}
      {liquidatingContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Thanh Lý Hợp Đồng Thuê</h3>
                <p className="text-xs text-red-600 font-bold">{liquidatingContract.contractCode} (P.{liquidatingContract.room?.roomNumber})</p>
              </div>
              <button onClick={() => setLiquidatingContract(null)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách thuê:</span>
                <strong className="text-slate-800">{liquidatingContract.tenant?.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tiền cọc ban đầu:</span>
                <strong className="text-slate-900 font-bold">{liquidatingContract.depositAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>

            <form onSubmit={handleLiquidateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tiền cọc bị khấu trừ (VNĐ)
                </label>
                <input
                  type="number"
                  value={liquidateForm.depositDeducted}
                  onChange={(e) => setLiquidateForm({ ...liquidateForm, depositDeducted: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-bold text-red-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Tiền cọc thực tế hoàn trả cho khách: <strong>{(liquidatingContract.depositAmount - parseFloat(liquidateForm.depositDeducted || '0')).toLocaleString('vi-VN')} đ</strong>
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lý do khấu trừ cọc (nếu có)
                </label>
                <textarea
                  rows={2}
                  value={liquidateForm.deductionReason}
                  onChange={(e) => setLiquidateForm({ ...liquidateForm, deductionReason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                  placeholder="VD: Trừ 200.000đ tiền vệ sinh dọn phòng và tiền điện kỳ cuối..."
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                Quy trình thanh lý sẽ tự động chuyển phòng về trạng thái <strong>Trống (AVAILABLE)</strong> để sẵn sàng cho khách mới thuê.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLiquidatingContract(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={liquidating}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
                >
                  {liquidating ? 'Đang thanh lý...' : 'XÁC NHẬN THANH LÝ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IN HỢP ĐỒNG MẪU CHUẨN VIỆT NAM */}
      {printingContract && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl space-y-6 text-slate-900 font-serif">
            {/* Header In Hợp Đồng */}
            <div className="text-center space-y-1 border-b pb-4">
              <div className="flex justify-center mb-2">
                <img src="/logo.png" alt="Nhà Trọ Số" className="h-10 w-auto object-contain" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
              <p className="text-xs font-bold text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
              <div className="w-24 h-0.5 bg-slate-300 mx-auto my-2" />
              <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900 pt-2">
                HỢP ĐỒNG THUÊ PHÒNG TRỌ
              </h1>
              <p className="text-xs text-slate-500 font-mono">Mã số: {printingContract.contractCode}</p>
            </div>

            {/* Nội dung hợp đồng */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-800">
              <p>Hôm nay, ngày {new Date(printingContract.startDate).toLocaleDateString('vi-VN')}, tại {printingContract.room?.property?.address}, chúng tôi gồm có:</p>

              <div className="space-y-1 pl-4 border-l-2 border-slate-300">
                <p><strong>BÊN CHO THUÊ (BÊN A):</strong> NGUYỄN VĂN BA (CHỦ NHÀ TRỌ)</p>
                <p>Số điện thoại: {supportPhone}</p>
                <p>Địa chỉ: {printingContract.room?.property?.address}</p>
              </div>

              <div className="space-y-1 pl-4 border-l-2 border-slate-300">
                <p><strong>BÊN THUÊ (BÊN B):</strong> {printingContract.tenant?.fullName.toUpperCase()}</p>
                <p>Số CCCD/CMND: {printingContract.tenant?.identityNumber}</p>
                <p>Số điện thoại: {printingContract.tenant?.phone}</p>
                <p>Quê quán: {printingContract.tenant?.hometown || 'Chưa cập nhật'}</p>
              </div>

              <p>Hai bên thống nhất ký kết hợp đồng thuê phòng với các điều khoản như sau:</p>

              <div className="space-y-2">
                <p><strong>Điều 1: Đối tượng hợp đồng:</strong> Bên A đồng ý cho Bên B thuê phòng số <strong>{printingContract.room?.roomNumber}</strong> thuộc {printingContract.room?.property?.name}, diện tích {printingContract.room?.area} m².</p>
                <p><strong>Điều 2: Thời hạn thuê:</strong> Từ ngày {new Date(printingContract.startDate).toLocaleDateString('vi-VN')} đến ngày {new Date(printingContract.endDate).toLocaleDateString('vi-VN')}.</p>
                <p><strong>Điều 3: Giá thuê và tiền đặt cọc:</strong></p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>Giá thuê phòng: <strong>{printingContract.rentalPrice.toLocaleString('vi-VN')} VNĐ/tháng</strong> (Chưa bao gồm điện, nước và dịch vụ).</li>
                  <li>Tiền đặt cọc: <strong>{printingContract.depositAmount.toLocaleString('vi-VN')} VNĐ</strong> (Được hoàn trả khi kết thúc hợp đồng nếu không vi phạm hoặc gây hư hỏng).</li>
                </ul>
                <p><strong>Điều 4: Điều khoản cam kết:</strong> {printingContract.terms}</p>
              </div>

              {/* Chữ ký 2 bên */}
              <div className="grid grid-cols-2 text-center pt-8">
                <div className="space-y-16">
                  <strong className="block">ĐẠI DIỆN BÊN A</strong>
                  <span className="italic text-slate-500">(Ký và ghi rõ họ tên)</span>
                </div>
                <div className="space-y-16">
                  <strong className="block">ĐẠI DIỆN BÊN B</strong>
                  <span className="italic text-slate-500">(Ký và ghi rõ họ tên)</span>
                </div>
              </div>
            </div>

            {/* Footer nút in */}
            <div className="pt-4 border-t flex justify-end gap-2 font-sans">
              <button
                type="button"
                onClick={() => setPrintingContract(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Printer size={15} /> In Hợp Đồng Này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
