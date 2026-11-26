import { siteCopyright, supportPhone, vietcombankAccount } from '../siteDetails';
import React, { useState, useEffect } from 'react';
import { ContactView } from './ContactView';
import { PublicPortal } from './PublicPortal';
import api from '../services/api';
import { User, TenantProfile, Invoice, Contract, MaintenanceRequest, Notification } from '../types';
import {
  Home, Receipt, Wrench, Bell, User as UserIcon, LogOut, CheckCircle2,
  AlertTriangle, Clock, Calendar, ArrowRight, Upload, KeyRound, Copy,
  CreditCard, ChevronRight, Send, AlertCircle, RefreshCw, X, Eye, Search, Phone
} from 'lucide-react';

interface TenantPortalProps {
  currentUser: User;
  onLogout: () => void;
}

const tenantNavigation = [
  { id: 'bills', label: 'Hóa đơn', icon: Receipt },
  { id: 'room', label: 'Phòng của tôi', icon: Home },
  { id: 'browse', label: 'Xem phòng', icon: Search },
  { id: 'maintenance', label: 'Phản hồi', icon: Wrench },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'profile', label: 'Tài khoản', icon: UserIcon },
  { id: 'contact', label: 'Liên hệ', icon: Phone },
] as const;

type TenantTab = typeof tenantNavigation[number]['id'];

export const TenantPortal: React.FC<TenantPortalProps> = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TenantTab>('bills');
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Drawer state for Payment Proof Submission
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [submissionForm, setSubmissionForm] = useState({
    amount: '',
    bankName: 'Vietcombank',
    transactionCode: '',
    proofImageUrl: '',
    note: ''
  });
  const [submittingProof, setSubmittingProof] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Modal for new Maintenance Request
  const [showNewMaintenance, setShowNewMaintenance] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    category: 'ELECTRICAL',
    urgency: 'NORMAL',
    description: '',
    imageUrl: ''
  });
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);

  // Modal for Password Change (also triggered if mustChangePassword is true)
  const [showPasswordModal, setShowPasswordModal] = useState(currentUser.mustChangePassword || false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });
  const [changingPass, setChangingPass] = useState(false);

  // Selected invoice for detail view
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchTenantData();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const [profRes, invRes, conRes, mainRes, notifRes] = await Promise.all([
        api.get('/tenant/profile'),
        api.get('/tenant/invoices'),
        api.get('/tenant/contracts'),
        api.get('/maintenance'),
        api.get('/notifications')
      ]);

      setProfile(profRes.data);
      setInvoices(invRes.data);
      setContracts(conRes.data);
      setMaintenanceList(mainRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu người thuê:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ text: '', isError: false });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ text: 'Mật khẩu xác nhận không trùng khớp.', isError: true });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.', isError: true });
      return;
    }

    setChangingPass(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordMsg({ text: 'Đổi mật khẩu thành công!', isError: false });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }, 1500);
    } catch (err: any) {
      setPasswordMsg({
        text: err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.',
        isError: true
      });
    } finally {
      setChangingPass(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setSubmittingProof(true);
    try {
      await api.post(`/invoices/${payingInvoice.id}/submissions`, {
        amount: parseFloat(submissionForm.amount),
        bankName: submissionForm.bankName,
        transactionCode: submissionForm.transactionCode,
        proofImageUrl: submissionForm.proofImageUrl,
        note: submissionForm.note
      });

      setSubmitSuccess(true);
      fetchTenantData();
      setTimeout(() => {
        setPayingInvoice(null);
        setSubmitSuccess(false);
        setSubmissionForm({
          amount: '',
          bankName: 'Vietcombank',
          transactionCode: '',
          proofImageUrl: '',
          note: ''
        });
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi gửi minh chứng thanh toán.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMaintenance(true);
    try {
      await api.post('/maintenance', maintenanceForm);
      setShowNewMaintenance(false);
      setMaintenanceForm({
        title: '',
        category: 'ELECTRICAL',
        urgency: 'NORMAL',
        description: '',
        imageUrl: ''
      });
      fetchTenantData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi gửi yêu cầu sửa chữa.');
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Lỗi đánh dấu thông báo:', err);
    }
  };

  // Tính tổng nợ hiện tại
  const currentUnpaid = invoices.filter(i => i.remainingAmount > 0);
  const totalDebt = currentUnpaid.reduce((s, i) => s + i.remainingAmount, 0);
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-6">
      {/* 1. TOP HEADER CHO NGƯỜI THUÊ */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Nhà Trọ Số" className="h-10 w-auto object-contain drop-shadow" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">Nhà Trọ Số</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500 text-slate-950">
                  {profile?.currentRoom ? `Phòng ${profile.currentRoom.roomNumber}` : 'Khách Thuê'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">{profile?.fullName || currentUser.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Thông báo"
            >
              <Bell size={18} />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Đổi mật khẩu"
            >
              <KeyRound size={18} />
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <nav aria-label="Cổng khách thuê" className="mx-auto flex max-w-4xl flex-wrap gap-1 border-t border-slate-800 px-4 py-2">
          {tenantNavigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition ${activeTab === id ? 'bg-teal-500 text-slate-950' : 'text-slate-200 hover:bg-slate-800'}`}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* 2. CẢNH BÁO BẮT BUỘC ĐỔI MẬT KHẨU LẦN ĐẦU */}
      {currentUser.mustChangePassword && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold shadow flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Tài khoản mới cấp! Bạn cần đổi mật khẩu mặc định để bảo mật thông tin.</span>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-3 py-1 bg-slate-950 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 transition"
          >
            Đổi Mật Khẩu Ngay
          </button>
        </div>
      )}

      {/* 3. NỘI DUNG CHÍNH */}
      <main className={`mx-auto w-full flex-1 px-4 pt-4 ${activeTab === "browse" ? "max-w-7xl sm:px-6" : "max-w-4xl"}`}>
        {activeTab === 'browse' ? (
          <PublicPortal embedded bookingContact={profile ?? currentUser} />
        ) : activeTab === 'contact' ? (
          <ContactView onViewRooms={() => setActiveTab('browse')} onSendFeedback={() => setActiveTab('maintenance')} />
        ) : loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-teal-600 mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Đang tải dữ liệu phòng trọ của bạn...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: HÓA ĐƠN & THANH TOÁN */}
            {activeTab === 'bills' && (
              <div className="space-y-4">
                {/* Outstanding Debt Overview Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-lg border border-slate-700/60">
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                    TỔNG CÔNG NỢ CẦN THANH TOÁN
                  </span>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-3xl font-black text-white tracking-tight">
                      {totalDebt.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-400">VNĐ</span>
                    </h2>
                    {totalDebt > 0 ? (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                        {currentUnpaid.length} hóa đơn chưa tất toán
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Đã thanh toán đầy đủ
                      </span>
                    )}
                  </div>
                </div>

                {/* Danh sách hóa đơn */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Danh Sách Hóa Đơn Tiền Phòng & Dịch Vụ
                  </h3>

                  {invoices.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-xs border">
                      Chưa có hóa đơn nào được phát hành cho phòng của bạn.
                    </div>
                  ) : (
                    invoices.map((inv) => {
                      const isUnpaid = inv.remainingAmount > 0;

                      return (
                        <div
                          key={inv.id}
                          className={`bg-white rounded-2xl p-4 sm:p-5 border transition shadow-sm space-y-4 ${
                            inv.isOverdue ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">
                                  Hóa Đơn Kỳ {inv.period}
                                </span>
                                {inv.status === 'PAID' ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                                    Đã thanh toán đủ
                                  </span>
                                ) : inv.status === 'PARTIALLY_PAID' ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                                    Đã trả 1 phần
                                  </span>
                                ) : inv.isOverdue ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center gap-1">
                                    <AlertTriangle size={10} /> Quá hạn
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">
                                    Chưa thanh toán
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-slate-400 mt-0.5">Mã: {inv.invoiceCode}</p>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] text-slate-400 block">Tổng tiền</span>
                              <strong className="text-base font-extrabold text-slate-900">
                                {inv.totalAmount.toLocaleString('vi-VN')} đ
                              </strong>
                            </div>
                          </div>

                          {/* Quick details */}
                          <div className="bg-slate-50 p-3 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Tiền phòng</span>
                              <strong className="text-slate-700">{inv.roomAmount.toLocaleString('vi-VN')} đ</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Điện & Nước & DV</span>
                              <strong className="text-slate-700">{inv.servicesAmount.toLocaleString('vi-VN')} đ</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Đã thanh toán</span>
                              <strong className="text-emerald-600">{inv.paidAmount.toLocaleString('vi-VN')} đ</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Còn nợ</span>
                              <strong className={inv.remainingAmount > 0 ? 'text-red-600 font-bold' : 'text-slate-700'}>
                                {inv.remainingAmount.toLocaleString('vi-VN')} đ
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock size={12} className={inv.isOverdue ? 'text-red-500' : 'text-slate-400'} />
                              Hạn nộp: <strong className={inv.isOverdue ? 'text-red-600' : 'text-slate-700'}>{new Date(inv.dueDate).toLocaleDateString('vi-VN')}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(inv)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                              >
                                <Eye size={12} /> Chi tiết
                              </button>

                              {isUnpaid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPayingInvoice(inv);
                                    setSubmissionForm({
                                      ...submissionForm,
                                      amount: String(inv.remainingAmount)
                                    });
                                    setSubmitSuccess(false);
                                  }}
                                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1"
                                >
                                  <CreditCard size={12} /> Thanh Toán
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: THÔNG TIN PHÒNG & HỢP ĐỒNG */}
            {activeTab === 'room' && (
              <div className="space-y-4">
                {profile?.currentRoom ? (
                  <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <span className="text-xs font-bold text-teal-600 uppercase">PHÒNG ĐANG THUÊ</span>
                        <h2 className="text-2xl font-black text-slate-900">
                          Phòng {profile.currentRoom.roomNumber}
                        </h2>
                        <p className="text-xs text-slate-500">{profile.currentRoom.property?.name}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full">
                        Hợp Đồng Hiệu Lực
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border">
                        <span className="text-slate-400 block text-[10px]">Tầng</span>
                        <strong className="text-slate-800">{profile.currentRoom.floor?.name || `Tầng ${profile.currentRoom.floorId}`}</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border">
                        <span className="text-slate-400 block text-[10px]">Diện tích</span>
                        <strong className="text-slate-800">{profile.currentRoom.area} m²</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border">
                        <span className="text-slate-400 block text-[10px]">Giá thuê gốc</span>
                        <strong className="text-teal-600 font-bold">{profile.currentRoom.basePrice.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border">
                        <span className="text-slate-400 block text-[10px]">Tiền cọc phòng</span>
                        <strong className="text-slate-800 font-bold">{profile.currentRoom.depositAmount.toLocaleString('vi-VN')} đ</strong>
                      </div>
                    </div>

                    {/* Active Contract Info */}
                    {contracts.length > 0 && (
                      <div className="space-y-3 pt-3 border-t">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Chi Tiết Hợp Đồng ({contracts[0].contractCode})
                        </h4>
                        <div className="bg-slate-50 p-4 rounded-2xl border space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Thời hạn hợp đồng:</span>
                            <strong className="text-slate-800">
                              {new Date(contracts[0].startDate).toLocaleDateString('vi-VN')} - {new Date(contracts[0].endDate).toLocaleDateString('vi-VN')}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Giá thuê ký kết:</span>
                            <strong className="text-teal-600 font-bold">
                              {contracts[0].rentalPrice.toLocaleString('vi-VN')} đ/tháng
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tiền cọc đang giữ:</span>
                            <strong className="text-slate-800">
                              {contracts[0].depositAmount.toLocaleString('vi-VN')} đ
                            </strong>
                          </div>
                          {contracts[0].terms && (
                            <div className="pt-2 border-t mt-2">
                              <span className="text-slate-500 block mb-1">Điều khoản & quy định:</span>
                              <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border text-[11px] leading-relaxed">
                                {contracts[0].terms}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Co-occupants */}
                        {contracts[0].occupants && contracts[0].occupants.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <h5 className="text-[11px] font-bold text-slate-500 uppercase">Người Cùng Ở Trong Phòng:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {contracts[0].occupants.map((occ, i) => (
                                <div key={i} className="p-2.5 bg-slate-50 rounded-xl border text-xs flex justify-between items-center">
                                  <div>
                                    <strong className="text-slate-800 block">{occ.fullName}</strong>
                                    <span className="text-[10px] text-slate-400">Quan hệ: {occ.relationship || 'Bạn'}</span>
                                  </div>
                                  <span className="text-slate-500 font-mono text-[11px]">{occ.phone || ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-8 text-center text-slate-500 text-xs border">
                    Hồ sơ của bạn hiện chưa được gán vào phòng trọ nào.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BÁO HỎNG & YÊU CẦU SỬA CHỮA */}
            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Phản hồi và báo hỏng</h3>
                    <p className="text-[11px] text-slate-500">Gửi phản ánh trực tiếp tới chủ nhà để được xử lý nhanh chóng</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewMaintenance(true)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                  >
                    <Wrench size={14} /> Gửi phản hồi
                  </button>
                </div>

                {maintenanceList.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center text-slate-500 text-xs border space-y-2">
                    <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
                    <p className="font-semibold text-slate-700">Bạn chưa gửi phản hồi nào.</p>
                    <p className="text-[11px] text-slate-400">Bạn có thể góp ý về dịch vụ hoặc báo sự cố tại phòng.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {maintenanceList.map((m) => (
                      <div key={m.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-slate-900">{m.title}</h4>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {m.requestCode}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Gửi lúc: {new Date(m.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>

                          <div>
                            {m.status === 'RESOLVED' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Đã hoàn tất
                              </span>
                            ) : m.status === 'IN_PROGRESS' ? (
                              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                Đang xử lý
                              </span>
                            ) : m.status === 'RECEIVED' ? (
                              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                Đã tiếp nhận
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Mới gửi
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                          {m.description}
                        </p>

                        {/* Timeline updates */}
                        {m.updates && m.updates.length > 0 && (
                          <div className="pt-2 border-t space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tiến Trình Xử Lý Từ Chủ Nhà:</span>
                            <div className="space-y-1.5 pl-2 border-l-2 border-teal-500">
                              {m.updates.map((up) => (
                                <div key={up.id} className="text-xs space-y-0.5">
                                  <p className="text-slate-700 font-medium">{up.message}</p>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(up.createdAt).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: THÔNG BÁO TỪ CHỦ NHÀ */}
            {activeTab === 'notifications' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Thông Báo Từ Chủ Nhà Trọ
                </h3>

                {notifications.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-xs border">
                    Hiện chưa có thông báo nào từ chủ nhà.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markNotificationAsRead(n.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                        n.isRead ? 'bg-white border-slate-200' : 'bg-teal-50/50 border-teal-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell size={15} className={n.isRead ? 'text-slate-400' : 'text-teal-600'} />
                          <h4 className={`text-xs ${n.isRead ? 'font-semibold text-slate-800' : 'font-extrabold text-teal-950'}`}>
                            {n.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-6">
                        {n.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: HỒ SƠ CÁ NHÂN */}
            {activeTab === 'profile' && profile && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-black text-xl flex items-center justify-center">
                    {profile.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{profile.fullName}</h3>
                    <p className="text-xs text-slate-500">Tài khoản đăng nhập: <strong>{currentUser.username}</strong></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="text-[10px] text-slate-400 block">Số điện thoại</span>
                    <strong className="text-slate-800">{profile.phone}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="text-[10px] text-slate-400 block">Số CCCD / Định danh</span>
                    <strong className="text-slate-800">{profile.identityNumber}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="text-[10px] text-slate-400 block">Email</span>
                    <strong className="text-slate-800">{profile.email || 'Chưa cập nhật'}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="text-[10px] text-slate-400 block">Quê quán / Thường trú</span>
                    <strong className="text-slate-800">{profile.hometown || 'Chưa cập nhật'}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <KeyRound size={14} /> Đổi Mật Khẩu
                  </button>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <LogOut size={14} /> Đăng Xuất
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="mx-auto mt-8 flex w-full max-w-4xl flex-wrap justify-between gap-3 border-t border-slate-200 px-4 py-5 text-xs text-slate-600">
        <span>{siteCopyright}</span>
        <a href={`tel:${supportPhone}`} className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:underline">
          <Phone size={14} /> Hỗ trợ {supportPhone}
        </a>
      </footer>

      {/* 4. MODAL THANH TOÁN & GỬI MINH CHỨNG */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Thanh Toán & Gửi Minh Chứng</h3>
                <p className="text-xs text-teal-600 font-bold">Hóa đơn {payingInvoice.invoiceCode}</p>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {submitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900">Đã Gửi Minh Chứng Thành Công!</h4>
                <p className="text-xs text-emerald-700">
                  Chủ nhà đã nhận được yêu cầu xác nhận và sẽ đối soát tài khoản sớm nhất.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Thông tin chuyển khoản */}
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-xs space-y-2">
                  <span className="font-extrabold text-teal-900 uppercase block tracking-wider text-[10px]">
                    THÔNG TIN CHUYỂN KHOẢN CHỦ TRỌ
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Ngân hàng:</span>
                      <strong className="text-slate-800">Vietcombank (VCB)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Chủ tài khoản:</span>
                      <span className="text-slate-700">Kiểm tra trên ứng dụng ngân hàng</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Số tài khoản:</span>
                      <strong className="text-teal-700 font-mono font-bold text-sm">{vietcombankAccount}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Số tiền cần nộp:</span>
                      <strong className="text-red-600 font-bold text-sm">
                        {payingInvoice.remainingAmount.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Cú pháp chuyển khoản:</span>
                      <strong className="font-mono text-teal-800 bg-white px-2 py-0.5 rounded border">
                        {payingInvoice.invoiceCode}
                      </strong>
                    </div>
                    <span className="text-[10px] text-teal-700 italic">Mô phỏng VietQR thanh toán 24/7</span>
                  </div>
                </div>

                {/* Form gửi xác nhận */}
                <form onSubmit={handleSubmitProof} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Số tiền bạn đã chuyển khoản (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={submissionForm.amount}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, amount: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Ngân hàng chuyển</label>
                      <input
                        type="text"
                        value={submissionForm.bankName}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, bankName: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="VD: MBBank, VCB..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Mã GD ngân hàng</label>
                      <input
                        type="text"
                        value={submissionForm.transactionCode}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, transactionCode: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="VD: FT12345678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Link ảnh chụp biên lai / bill chuyển tiền
                    </label>
                    <input
                      type="url"
                      value={submissionForm.proofImageUrl}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, proofImageUrl: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="https://... ảnh biên lai (hoặc để trống dùng ảnh mẫu)"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ghi chú cho chủ nhà</label>
                    <textarea
                      rows={2}
                      value={submissionForm.note}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, note: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="VD: Em chuyển khoản từ tài khoản Vietcombank chính chủ ạ..."
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPayingInvoice(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={submittingProof}
                      className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow flex items-center gap-1.5"
                    >
                      <Send size={14} /> {submittingProof ? 'Đang gửi...' : 'GỬI MINH CHỨNG'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL TẠO YÊU CẦU SỬA CHỮA */}
      {showNewMaintenance && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Gửi phản hồi hoặc báo hỏng</h3>
              <button onClick={() => setShowNewMaintenance(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tiêu đề sự cố <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.title}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  placeholder="VD: Máy lạnh không mát, chập điện..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Danh mục</label>
                  <select
                    value={maintenanceForm.category}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    <option value="ELECTRICAL">Điện & Đèn chiếu sáng</option>
                    <option value="PLUMBING">Nước & Thiết bị WC</option>
                    <option value="APPLIANCE">Thiết bị gia dụng</option>
                    <option value="FURNITURE">Nội thất (Giường, Tủ)</option>
                    <option value="FEEDBACK">Góp ý dịch vụ</option>
                    <option value="OTHER">Vấn đề khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mức độ khẩn cấp</label>
                  <select
                    value={maintenanceForm.urgency}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, urgency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    <option value="LOW">Bình thường</option>
                    <option value="NORMAL">Cần xử lý sớm</option>
                    <option value="HIGH">Gấp / Ảnh hưởng sinh hoạt</option>
                    <option value="EMERGENCY">Khẩn cấp (Rò rỉ/Cháy chập)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mô tả chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  placeholder="Mô tả cụ thể hiện tượng xảy ra và thời gian bạn có mặt ở phòng để đón thợ..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewMaintenance(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingMaintenance}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  {submittingMaintenance ? 'Đang gửi...' : 'GỬI YÊU CẦU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL ĐỔI MẬT KHẨU */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Thay Đổi Mật Khẩu</h3>
                <p className="text-xs text-slate-500">Bảo mật tài khoản cá nhân người thuê</p>
              </div>
              {!currentUser.mustChangePassword && (
                <button onClick={() => setShowPasswordModal(false)} className="p-1 text-slate-400">
                  <X size={18} />
                </button>
              )}
            </div>

            {passwordMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                passwordMsg.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  placeholder="Mật khẩu cũ (mặc định: 123456)"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                {!currentUser.mustChangePassword && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    Đóng
                  </button>
                )}
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow"
                >
                  {changingPass ? 'Đang cập nhật...' : 'CẬP NHẬT MẬT KHẨU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL XEM CHI TIẾT HÓA ĐƠN */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Chi Tiết Hóa Đơn {selectedInvoice.invoiceCode}</h3>
                <p className="text-xs text-slate-500">Kỳ thanh toán: {selectedInvoice.period}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1.5 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="border rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {selectedInvoice.items?.map((it) => (
                  <div key={it.id} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50">
                    <div>
                      <span className="font-bold text-slate-800 block">{it.itemName}</span>
                      <span className="text-[10px] text-slate-400">
                        {it.quantity} {it.unit} x {it.unitPrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <strong className="text-slate-900 font-bold">{it.amount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Tổng cộng hóa đơn:</span>
                  <strong className="text-slate-800 font-bold">{selectedInvoice.totalAmount.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Số tiền đã thanh toán:</span>
                  <strong className="text-emerald-600 font-bold">{selectedInvoice.paidAmount.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div className="flex justify-between text-slate-500 pt-1 border-t">
                  <span className="font-bold text-slate-700">Dư nợ còn lại:</span>
                  <strong className="text-red-600 font-black text-sm">{selectedInvoice.remainingAmount.toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
