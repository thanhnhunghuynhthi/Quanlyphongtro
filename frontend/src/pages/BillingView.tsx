import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Invoice, Room, Contract, MeterReading, Service } from '../types';
import {
  Receipt, Plus, DollarSign, CheckCircle2, Clock, AlertTriangle,
  Printer, Search, RefreshCw, X, CreditCard, Send, Check, ShieldCheck, FileText
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<string>('2026-11');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Ghi Chỉ Số Điện Nước
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [meterForm, setMeterForm] = useState({
    roomId: '',
    period: '2026-11',
    oldElectricity: '0',
    newElectricity: '0',
    oldWater: '0',
    newWater: '0'
  });
  const [savingMeter, setSavingMeter] = useState(false);

  // Modal Lập Hóa Đơn Mới
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    contractId: '',
    period: '2026-11',
    dueDate: '2026-11-15',
    surcharge: '0',
    discount: '0',
    adjustmentReason: '',
    notes: 'Hóa đơn tiền phòng và dịch vụ'
  });
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Modal Thu Tiền (Nhiều lần)
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'TRANSFER',
    transactionReference: '',
    notes: 'Khách thanh toán qua ngân hàng'
  });
  const [recordingPay, setRecordingPay] = useState(false);

  // Modal In Phiếu Thu
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);

  // Selected invoice for detail
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [filterPeriod, filterStatus, search]);

  const fetchInitialData = async () => {
    try {
      const [cRes, rRes, sRes] = await Promise.all([
        api.get('/contracts', { params: { status: 'ACTIVE' } }),
        api.get('/rooms'),
        api.get('/services')
      ]);
      setContracts(cRes.data);
      setRooms(rRes.data);
      setServices(sRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu cơ bản:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterPeriod) params.period = filterPeriod;
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const res = await api.get('/invoices', { params });
      setInvoices(res.data);
    } catch (err) {
      console.error('Lỗi tải hóa đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterForm.roomId) {
      alert('Vui lòng chọn phòng cần ghi chỉ số.');
      return;
    }

    if (parseInt(meterForm.newElectricity) < parseInt(meterForm.oldElectricity)) {
      alert('Chỉ số điện mới không được nhỏ hơn chỉ số cũ!');
      return;
    }

    if (parseInt(meterForm.newWater) < parseInt(meterForm.oldWater)) {
      alert('Chỉ số nước mới không được nhỏ hơn chỉ số cũ!');
      return;
    }

    setSavingMeter(true);
    try {
      const res = await api.post('/meter-readings', meterForm);
      alert(res.data.message);
      setShowMeterModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi lưu chỉ số.');
    } finally {
      setSavingMeter(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.contractId) {
      alert('Vui lòng chọn hợp đồng thuê.');
      return;
    }

    setCreatingInvoice(true);
    try {
      const res = await api.post('/invoices', invoiceForm);
      alert(res.data.message);
      setShowCreateInvoiceModal(false);
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi phát hành hóa đơn.');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setRecordingPay(true);
    try {
      const res = await api.post(`/invoices/${payingInvoice.id}/payments`, {
        amount: parseFloat(payForm.amount),
        paymentMethod: payForm.paymentMethod,
        transactionReference: payForm.transactionReference,
        notes: payForm.notes
      });

      alert(res.data.message);
      setPayingInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi ghi nhận thanh toán.');
    } finally {
      setRecordingPay(false);
    }
  };

  const handleReviewSubmission = async (submissionId: number, action: 'APPROVE' | 'REJECT') => {
    if (!window.confirm(`Bạn có chắc muốn ${action === 'APPROVE' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} minh chứng thanh toán này?`)) return;

    try {
      const res = await api.post(`/submissions/${submissionId}/review`, { action });
      alert(res.data.message);
      fetchInvoices();
      if (selectedInvoice) {
        // Refresh detail
        const detRes = await api.get(`/invoices/${selectedInvoice.id}`);
        setSelectedInvoice(detRes.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi duyệt minh chứng.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">TÀI CHÍNH & THU TIỀN</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Điện Nước, Hóa Đơn & Thanh Toán
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ghi số đồng hồ, phát hành hóa đơn kỳ thu (snapshot giá), thu tiền nhiều đợt và duyệt minh chứng chuyển khoản
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowMeterModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Clock size={15} /> Ghi Điện Nước
          </button>

          <button
            onClick={() => setShowCreateInvoiceModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Plus size={16} /> Lập Hóa Đơn Mới
          </button>
        </div>
      </div>

      {/* Filter and stats */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span>Kỳ thu:</span>
            <input
              type="month"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ISSUED">Chưa thanh toán (ISSUED)</option>
            <option value="PARTIALLY_PAID">Thanh toán 1 phần (PARTIAL)</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
          </select>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã HĐ, số phòng, tên khách..."
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 w-64"
            />
          </div>
        </div>

        <p className="text-slate-500 text-[11px] font-semibold">
          Tổng số: <strong className="text-slate-800">{invoices.length}</strong> hóa đơn
        </p>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <RefreshCw size={28} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Đang tải hóa đơn...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs border max-w-md mx-auto space-y-2">
          <Receipt size={32} className="text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Chưa có hóa đơn nào trong kỳ thu này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {invoices.map((inv) => {
            const isUnpaid = inv.remainingAmount > 0;
            const hasPendingSubmissions = inv.submissions?.some(s => s.status === 'PENDING');

            return (
              <div
                key={inv.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-slate-900 text-base">{inv.invoiceCode}</span>
                      <span className="text-[11px] text-teal-700 font-bold block">
                        Phòng {inv.room?.roomNumber} ({inv.room?.property?.name})
                      </span>
                    </div>

                    <div>
                      {inv.status === 'PAID' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Đã thanh toán
                        </span>
                      ) : inv.status === 'PARTIALLY_PAID' ? (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          Đã trả 1 phần
                        </span>
                      ) : inv.isOverdue ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                          Quá hạn
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Chưa thanh toán
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border text-xs flex justify-between">
                    <span className="text-slate-400">Khách thuê:</span>
                    <strong className="text-slate-800">{inv.contract?.tenant?.fullName}</strong>
                  </div>

                  {/* Pricing grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl border">
                      <span className="text-[10px] text-slate-400 block">Tổng tiền</span>
                      <strong className="text-slate-900 font-bold">{inv.totalAmount.toLocaleString('vi-VN')} đ</strong>
                    </div>

                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-400 block">Đã thu</span>
                      <strong className="text-emerald-700 font-bold">{inv.paidAmount.toLocaleString('vi-VN')} đ</strong>
                    </div>

                    <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-[10px] text-slate-400 block">Còn nợ</span>
                      <strong className="text-red-600 font-black">{inv.remainingAmount.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>

                  {/* Pending proof alert badge */}
                  {hasPendingSubmissions && (
                    <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 font-bold flex items-center justify-between">
                      <span>Có minh chứng chuyển khoản chờ duyệt!</span>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="underline text-[11px] text-teal-700"
                      >
                        Xem & Duyệt
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Hạn nộp: {new Date(inv.dueDate).toLocaleDateString('vi-VN')}</span>
                    <span>Kỳ thu: {inv.period}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintingInvoice(inv)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1"
                    title="In phiếu thu"
                  >
                    <Printer size={15} /> In Phiếu
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition"
                    >
                      Chi Tiết
                    </button>

                    {isUnpaid && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayingInvoice(inv);
                          setPayForm({
                            amount: String(inv.remainingAmount),
                            paymentMethod: 'TRANSFER',
                            transactionReference: '',
                            notes: `Thu tiền phòng ${inv.room?.roomNumber} kỳ ${inv.period}`
                          });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-sm flex items-center gap-1"
                      >
                        <CreditCard size={14} /> Thu Tiền
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL GHI CHỈ SỐ ĐIỆN NƯỚC */}
      {showMeterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Ghi Chỉ Số Đồng Hồ Điện - Nước</h3>
              <button onClick={() => setShowMeterModal(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMeter} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Chọn phòng</label>
                  <select
                    required
                    value={meterForm.roomId}
                    onChange={(e) => setMeterForm({ ...meterForm, roomId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold bg-slate-50"
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.roomNumber} ({r.property?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kỳ ghi chỉ số</label>
                  <input
                    type="month"
                    required
                    value={meterForm.period}
                    onChange={(e) => setMeterForm({ ...meterForm, period: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                  />
                </div>
              </div>

              {/* Chỉ số điện */}
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
                <span className="text-xs font-bold text-amber-900 block">Đồng Hồ Điện (kWh):</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Số điện cũ</label>
                    <input
                      type="number"
                      required
                      value={meterForm.oldElectricity}
                      onChange={(e) => setMeterForm({ ...meterForm, oldElectricity: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Số điện mới</label>
                    <input
                      type="number"
                      required
                      value={meterForm.newElectricity}
                      onChange={(e) => setMeterForm({ ...meterForm, newElectricity: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs font-bold text-amber-700"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Tiêu thụ: <strong>{Math.max(0, parseInt(meterForm.newElectricity || '0') - parseInt(meterForm.oldElectricity || '0'))} kWh</strong>
                </span>
              </div>

              {/* Chỉ số nước */}
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                <span className="text-xs font-bold text-blue-900 block">Đồng Hồ Nước (m³):</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Số nước cũ</label>
                    <input
                      type="number"
                      required
                      value={meterForm.oldWater}
                      onChange={(e) => setMeterForm({ ...meterForm, oldWater: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Số nước mới</label>
                    <input
                      type="number"
                      required
                      value={meterForm.newWater}
                      onChange={(e) => setMeterForm({ ...meterForm, newWater: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border text-xs font-bold text-blue-700"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Tiêu thụ: <strong>{Math.max(0, parseInt(meterForm.newWater || '0') - parseInt(meterForm.oldWater || '0'))} m³</strong>
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMeterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingMeter}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow"
                >
                  {savingMeter ? 'Đang lưu...' : 'LƯU CHỈ SỐ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PHÁT HÀNH HÓA ĐƠN MỚI */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Phát Hành Hóa Đơn Kỳ Thu</h3>
                <p className="text-xs text-slate-500">Chống lập trùng lặp & snapshot đơn giá tại thời điểm xuất bill</p>
              </div>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chọn hợp đồng thuê <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={invoiceForm.contractId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, contractId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-bold bg-slate-50"
                >
                  <option value="">-- Chọn hợp đồng đang hiệu lực --</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      Phòng {c.room?.roomNumber} - Khách {c.tenant?.fullName} ({c.contractCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kỳ thu (Tháng/Năm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    required
                    value={invoiceForm.period}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, period: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hạn nộp tiền <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phụ thu phát sinh (VNĐ)</label>
                  <input
                    type="number"
                    value={invoiceForm.surcharge}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, surcharge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Giảm trừ / Khuyến mãi (VNĐ)</label>
                  <input
                    type="number"
                    value={invoiceForm.discount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lý do điều chỉnh / Phụ thu / Giảm trừ</label>
                <input
                  type="text"
                  value={invoiceForm.adjustmentReason}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, adjustmentReason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                  placeholder="VD: Phụ thu thêm khách ở nhờ, giảm trừ hỗ trợ mùa dịch..."
                />
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-[11px] text-teal-900 leading-relaxed">
                Hệ thống sẽ tự động tổng hợp tiền phòng, lấy chỉ số đồng hồ điện nước đã ghi và các dịch vụ đăng ký để tạo hóa đơn chi tiết.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingInvoice}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow"
                >
                  {creatingInvoice ? 'Đang xuất hóa đơn...' : 'PHÁT HÀNH HÓA ĐƠN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GHI NHẬN THU TIỀN */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Ghi Nhận Thu Tiền</h3>
                <p className="text-xs text-teal-600 font-bold">{payingInvoice.invoiceCode} (Phòng {payingInvoice.room?.roomNumber})</p>
              </div>
              <button onClick={() => setPayingInvoice(null)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Tổng hóa đơn:</span>
                <strong className="text-slate-800 font-bold">{payingInvoice.totalAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Đã thanh toán trước đó:</span>
                <strong className="text-emerald-600 font-bold">{payingInvoice.paidAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="font-bold text-slate-700">Còn nợ:</span>
                <strong className="text-red-600 font-black">{payingInvoice.remainingAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Số tiền thu đợt này (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-bold text-teal-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phương thức thanh toán</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                >
                  <option value="TRANSFER">Chuyển khoản ngân hàng (TRANSFER)</option>
                  <option value="CASH">Tiền mặt trực tiếp (CASH)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mã tham chiếu / Ghi chú</label>
                <input
                  type="text"
                  value={payForm.transactionReference}
                  onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                  placeholder="Mã giao dịch ngân hàng hoặc số phiếu thu..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={recordingPay}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow"
                >
                  {recordingPay ? 'Đang ghi...' : 'XÁC NHẬN THU TIỀN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT HÓA ĐƠN & DUYỆT MINH CHỨNG */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Chi Tiết Hóa Đơn {selectedInvoice.invoiceCode}</h3>
                <p className="text-xs text-slate-500">Phòng {selectedInvoice.room?.roomNumber} • Kỳ {selectedInvoice.period}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Chi tiết từng mục chi phí */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Các Khoản Thu Trong Hóa Đơn:</h4>
              <div className="border rounded-2xl overflow-hidden divide-y text-xs">
                {selectedInvoice.items?.map(it => (
                  <div key={it.id} className="p-3 flex justify-between items-center bg-white">
                    <div>
                      <strong className="text-slate-800 block">{it.itemName}</strong>
                      <span className="text-[10px] text-slate-400">
                        {it.quantity} {it.unit} x {it.unitPrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <strong className="text-slate-900 font-bold">{it.amount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                ))}
              </div>

              {/* Minh chứng chờ duyệt nếu có */}
              {selectedInvoice.submissions && selectedInvoice.submissions.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-xs font-bold text-teal-800 uppercase">Minh Chứng Chuyển Khoản Khách Đã Gửi:</h4>
                  {selectedInvoice.submissions.map(sub => (
                    <div key={sub.id} className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-900">
                          Chuyển: {sub.amount.toLocaleString('vi-VN')} đ ({sub.bankName || 'Ngân hàng'})
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          sub.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.status === 'APPROVED' ? 'Đã duyệt' : sub.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ duyệt'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600">Mã GD: <strong>{sub.transactionCode || 'N/A'}</strong> • "{sub.note || 'Không có ghi chú'}"</p>

                      {sub.status === 'PENDING' && (
                        <div className="pt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleReviewSubmission(sub.id, 'REJECT')}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg"
                          >
                            Từ Chối
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewSubmission(sub.id, 'APPROVE')}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow"
                          >
                            Phê Duyệt & Thu Tiền
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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

      {/* MODAL IN PHIẾU THU TIỀN PHÒNG */}
      {printingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl space-y-6 text-slate-900 font-serif">
            {/* Header Phiếu Thu */}
            <div className="text-center space-y-1 border-b pb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <img src="/logo.png" alt="Nhà Trọ Số" className="h-9 w-auto object-contain inline-block" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">HỆ THỐNG QUẢN LÝ NHÀ TRỌ SỐ</h2>
              </div>
              <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900 pt-1">
                PHIẾU THU TIỀN PHÒNG & DỊCH VỤ
              </h1>
              <p className="text-xs text-slate-500 font-mono">Số: {printingInvoice.invoiceCode} • Kỳ: {printingInvoice.period}</p>
            </div>

            {/* Thông tin phòng & khách */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p>Khách thuê: <strong>{printingInvoice.contract?.tenant?.fullName}</strong></p>
                <p>Số điện thoại: <strong>{printingInvoice.contract?.tenant?.phone}</strong></p>
                <p>Địa chỉ trọ: <strong>{printingInvoice.room?.property?.address}</strong></p>
              </div>

              <div className="space-y-1 text-right">
                <p>Phòng số: <strong>{printingInvoice.room?.roomNumber}</strong></p>
                <p>Ngày lập phiếu: <strong>{new Date(printingInvoice.issueDate).toLocaleDateString('vi-VN')}</strong></p>
                <p>Hạn nộp: <strong>{new Date(printingInvoice.dueDate).toLocaleDateString('vi-VN')}</strong></p>
              </div>
            </div>

            {/* Chi tiết bảng kê */}
            <table className="w-full text-xs text-left border">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-2 border-r">Nội dung thu</th>
                  <th className="p-2 border-r text-center">Số lượng</th>
                  <th className="p-2 border-r text-right">Đơn giá</th>
                  <th className="p-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y font-sans">
                {printingInvoice.items?.map(it => (
                  <tr key={it.id}>
                    <td className="p-2 border-r font-medium">{it.itemName}</td>
                    <td className="p-2 border-r text-center">{it.quantity} {it.unit}</td>
                    <td className="p-2 border-r text-right">{it.unitPrice.toLocaleString('vi-VN')} đ</td>
                    <td className="p-2 text-right font-bold">{it.amount.toLocaleString('vi-VN')} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Tổng cộng */}
            <div className="space-y-1 text-xs text-right font-sans">
              <p>Tổng tiền phải thanh toán: <strong className="text-sm font-black">{printingInvoice.totalAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
              <p>Số tiền đã nộp: <strong className="text-emerald-700 font-bold">{printingInvoice.paidAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
              <p>Số tiền còn nợ: <strong className="text-red-600 font-black">{printingInvoice.remainingAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
            </div>

            <div className="grid grid-cols-2 text-center text-xs pt-6">
              <div className="space-y-16">
                <strong>NGƯỜI NỘP TIỀN</strong>
                <span className="italic text-slate-400 block">(Ký và ghi rõ họ tên)</span>
              </div>
              <div className="space-y-16">
                <strong>NGƯỜI THU TIỀN</strong>
                <span className="italic text-slate-400 block">(Ký và ghi rõ họ tên)</span>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2 font-sans">
              <button
                type="button"
                onClick={() => setPrintingInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Printer size={15} /> In Phiếu Thu Này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
