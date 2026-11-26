import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TenantProfile, Room } from '../types';
import {
  Users, Plus, Phone, Mail, MapPin, KeyRound, Lock, Unlock,
  RotateCcw, Search, CheckCircle2, AlertTriangle, Eye, Edit2, X, RefreshCw
} from 'lucide-react';

export const TenantsView: React.FC = () => {
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Cấp tài khoản mới
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    username: '',
    fullName: '',
    phone: '',
    email: '',
    identityNumber: '',
    roomId: '',
    hometown: '',
    temporaryPassword: '123456'
  });
  const [provisioning, setProvisioning] = useState(false);

  // Detail Modal
  const [selectedTenant, setSelectedTenant] = useState<TenantProfile | null>(null);
  const [editingTenant, setEditingTenant] = useState<TenantProfile | null>(null);
  const [savingTenant, setSavingTenant] = useState(false);
  const [tenantError, setTenantError] = useState('');

  const saveTenant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingTenant || savingTenant) return;
    const { id, fullName, phone, email, hometown, hasTemporaryResidence } = editingTenant;
    setTenantError('');
    if (!fullName.trim() || !phone.trim()) {
      setTenantError('Vui lòng nhập họ tên và số điện thoại.');
      return;
    }
    setSavingTenant(true);
    try {
      await api.put(`/tenants/${id}`, {
        fullName: fullName.trim(), phone: phone.trim(), email: email?.trim() || null,
        hometown: hometown?.trim() || null, hasTemporaryResidence,
      });
      setEditingTenant(null);
      await fetchTenants();
    } catch {
      setTenantError('Không lưu được hồ sơ. Vui lòng thử lại.');
    } finally {
      setSavingTenant(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchRooms();
  }, [search]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenants', { params: { search } });
      setTenants(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách người thuê:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('Lỗi lấy phòng:', err);
    }
  };

  const handleProvisionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);

    try {
      const res = await api.post('/users/tenants/provision', provisionForm);
      alert(res.data.message);
      setShowProvisionModal(false);
      setProvisionForm({
        username: '',
        fullName: '',
        phone: '',
        email: '',
        identityNumber: '',
        roomId: '',
        hometown: '',
        temporaryPassword: '123456'
      });
      fetchTenants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cấp tài khoản.');
    } finally {
      setProvisioning(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentActive: boolean) => {
    const action = currentActive ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

    try {
      await api.patch(`/users/${userId}/status`, { isActive: !currentActive });
      fetchTenants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật trạng thái.');
    }
  };

  const handleResetPassword = async (userId: number, username: string) => {
    if (!window.confirm(`Đặt lại mật khẩu cho [${username}] về 123456 và bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo?`)) return;

    try {
      const res = await api.post(`/users/${userId}/reset-password`);
      alert(res.data.message);
      fetchTenants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi reset mật khẩu.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">HỒ SƠ KHÁCH THUÊ</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Người Thuê & Cấp Tài Khoản
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi thông tin định danh CCCD, tạm trú và phân quyền truy cập cổng người thuê
          </p>
        </div>

        <button
          onClick={() => setShowProvisionModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md self-start sm:self-auto"
        >
          <Plus size={16} /> Cấp Tài Khoản Mới
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, SĐT, CCCD, quê quán..."
            className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 w-full sm:w-80"
          />
        </div>

        <p className="text-slate-500 text-[11px] font-semibold">
          Tổng số: <strong className="text-slate-800">{tenants.length}</strong> người thuê
        </p>
      </div>

      {/* Grid danh sách người thuê */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <RefreshCw size={28} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Đang tải danh sách khách thuê...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs border max-w-md mx-auto space-y-2">
          <Users size={32} className="text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Không tìm thấy hồ sơ người thuê nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-800 font-black text-sm flex items-center justify-center border border-teal-100">
                      {t.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{t.fullName}</h3>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        CCCD: {t.identityNumber}
                      </span>
                    </div>
                  </div>

                  <div>
                    {t.currentRoom ? (
                      <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 text-[10px] font-extrabold">
                        Phòng {t.currentRoom.roomNumber}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        Chưa nhận phòng
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-teal-600 shrink-0" />
                    <strong className="font-mono text-slate-800">{t.phone}</strong>
                  </p>
                  {t.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={13} className="text-teal-600 shrink-0" />
                      <span className="truncate">{t.email}</span>
                    </p>
                  )}
                  {t.hometown && (
                    <p className="flex items-center gap-2">
                      <MapPin size={13} className="text-teal-600 shrink-0" />
                      <span>{t.hometown}</span>
                    </p>
                  )}
                </div>

                {/* Account badge */}
                {t.user ? (
                  <div className="p-2.5 bg-slate-50 rounded-xl border flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tài khoản:</span>
                      <strong className="font-mono text-slate-800">{t.user.username}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {t.user.isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5">
                          <CheckCircle2 size={10} /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold flex items-center gap-0.5">
                          <Lock size={10} /> Đã khóa
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Chưa được cấp tài khoản đăng nhập
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                {t.user && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(t.user!.id, t.user!.isActive)}
                      className={`p-2 rounded-xl transition ${
                        t.user.isActive
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={t.user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      {t.user.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetPassword(t.user!.id, t.user!.username)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                      title="Đặt lại mật khẩu về 123456"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedTenant(t)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition ml-auto"
                >
                  Xem Hồ Sơ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CẤP TÀI KHOẢN MỚI */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Cấp Tài Khoản Người Thuê Mới</h3>
              <button onClick={() => setShowProvisionModal(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProvisionAccount} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={provisionForm.username}
                    onChange={(e) => setProvisionForm({ ...provisionForm, username: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-mono font-bold"
                    placeholder="khach5..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={provisionForm.fullName}
                    onChange={(e) => setProvisionForm({ ...provisionForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={provisionForm.phone}
                    onChange={(e) => setProvisionForm({ ...provisionForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-mono font-medium"
                    placeholder="09xx xxx xxx"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Số CCCD / CMND <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={provisionForm.identityNumber}
                    onChange={(e) => setProvisionForm({ ...provisionForm, identityNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-mono font-medium"
                    placeholder="00119800xxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Gán vào phòng</label>
                  <select
                    value={provisionForm.roomId}
                    onChange={(e) => setProvisionForm({ ...provisionForm, roomId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    <option value="">-- Chưa gán phòng --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.roomNumber} ({r.property?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quê quán</label>
                  <input
                    type="text"
                    value={provisionForm.hometown}
                    onChange={(e) => setProvisionForm({ ...provisionForm, hometown: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                    placeholder="Hải Phòng, Đà Nẵng..."
                  />
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs text-teal-900 space-y-1">
                <span className="font-bold block">Chính sách bảo mật:</span>
                <p className="text-[11px] text-teal-800">
                  Mật khẩu mặc định khởi tạo là <strong className="font-mono">123456</strong>. Hệ thống sẽ bắt buộc người thuê đổi mật khẩu cá nhân ở lần đăng nhập đầu tiên.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={provisioning}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow"
                >
                  {provisioning ? 'Đang cấp...' : 'CẤP TÀI KHOẢN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT HỒ SƠ KHÁCH */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Hồ Sơ Khách Thuê: {selectedTenant.fullName}</h3>
              <button onClick={() => setSelectedTenant(null)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <strong className="text-slate-800 font-mono">{selectedTenant.phone}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CCCD/CMND:</span>
                  <strong className="text-slate-800 font-mono">{selectedTenant.identityNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quê quán:</span>
                  <strong className="text-slate-800">{selectedTenant.hometown || 'Chưa rõ'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đăng ký tạm trú công an:</span>
                  <strong className={selectedTenant.hasTemporaryResidence ? 'text-emerald-600' : 'text-amber-600'}>
                    {selectedTenant.hasTemporaryResidence ? 'Đã khai báo' : 'Chưa khai báo'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => {
                setTenantError('');
                setEditingTenant(selectedTenant);
                setSelectedTenant(null);
              }} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white">
                <Edit2 size={14} /> Chỉnh sửa hồ sơ
              </button>
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <form onSubmit={saveTenant} role="dialog" aria-modal="true" aria-labelledby="edit-tenant-title" className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <h3 id="edit-tenant-title" className="font-extrabold text-slate-900">Chỉnh sửa hồ sơ khách thuê</h3>
            {([
              { key: 'fullName', label: 'Họ tên', type: 'text', required: true },
              { key: 'phone', label: 'Số điện thoại', type: 'tel', required: true },
              { key: 'email', label: 'Email', type: 'email', required: false },
              { key: 'hometown', label: 'Quê quán', type: 'text', required: false },
            ] as const).map(({ key, label, type, required }) => (
              <label key={key} className="block space-y-1 text-sm font-semibold text-slate-700">
                <span>{label}</span>
                <input type={type} required={required} value={editingTenant[key] ?? ''}
                  onChange={event => setEditingTenant({ ...editingTenant, [key]: event.target.value })}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={editingTenant.hasTemporaryResidence}
                onChange={event => setEditingTenant({ ...editingTenant, hasTemporaryResidence: event.target.checked })} />
              Đã khai báo tạm trú
            </label>
            {tenantError && <p role="alert" className="text-sm text-red-700">{tenantError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" disabled={savingTenant} onClick={() => setEditingTenant(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold">Hủy</button>
              <button type="submit" disabled={savingTenant} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                {savingTenant ? 'Đang lưu…' : 'Lưu hồ sơ'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
