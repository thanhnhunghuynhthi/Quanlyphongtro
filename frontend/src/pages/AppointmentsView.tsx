import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ViewingAppointment } from '../types';
import {
  Calendar, Clock, Phone, Mail, MapPin, CheckCircle2, XCircle,
  AlertCircle, RefreshCw, MessageSquare, ArrowRight, UserPlus, Filter
} from 'lucide-react';

interface AppointmentsViewProps {
  onConvertToContract?: (tenantId: number, roomId: number) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ onConvertToContract }) => {
  const [appointments, setAppointments] = useState<ViewingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Status update modal
  const [selectedAppointment, setSelectedAppointment] = useState<ViewingAppointment | null>(null);
  const [newStatus, setNewStatus] = useState<string>('CONFIRMED');
  const [ownerNote, setOwnerNote] = useState<string>('');
  const [suggestedDate, setSuggestedDate] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [filterStatus]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;

      const res = await api.get('/appointments', { params });
      setAppointments(res.data);
    } catch (err) {
      console.error('Lỗi lấy danh sách lịch xem phòng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setUpdating(true);
    try {
      await api.patch(`/appointments/${selectedAppointment.id}/status`, {
        status: newStatus,
        ownerNote,
        suggestedDate: suggestedDate || undefined
      });

      setSelectedAppointment(null);
      setOwnerNote('');
      setSuggestedDate('');
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật lịch hẹn.');
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToTenant = async (ap: ViewingAppointment) => {
    const confirm = window.confirm(`Bạn có chắc muốn chuyển thông tin khách [${ap.fullName}] thành Hồ sơ người thuê chính thức để lập hợp đồng?`);
    if (!confirm) return;

    try {
      const res = await api.post(`/appointments/${ap.id}/convert-to-tenant`);
      alert(res.data.message);
      fetchAppointments();

      if (onConvertToContract && res.data.tenant) {
        onConvertToContract(res.data.tenant.id, res.data.roomId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi chuyển đổi thông tin khách.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">TIẾP NHẬN YÊU CẦU</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Lịch Hẹn Xem Phòng
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi khách gửi yêu cầu từ trang web công khai, xác nhận lịch hẹn và chuyển đổi sang hợp đồng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận (Mới)</option>
            <option value="CONFIRMED">Đã xác nhận hẹn</option>
            <option value="RESCHEDULED">Đề xuất hẹn lại</option>
            <option value="COMPLETED">Đã xem phòng xong</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <button
            onClick={fetchAppointments}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Danh sách lịch hẹn */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <RefreshCw size={28} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-xs text-slate-500">Đang tải danh sách lịch hẹn...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs border max-w-md mx-auto space-y-2">
          <Calendar size={32} className="text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Chưa có lịch xem phòng nào trong mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {appointments.map((ap) => (
            <div
              key={ap.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{ap.fullName}</h3>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">{ap.appointmentCode}</span>
                  </div>

                  <div>
                    {ap.status === 'PENDING' ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Chờ xác nhận
                      </span>
                    ) : ap.status === 'CONFIRMED' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Đã xác nhận
                      </span>
                    ) : ap.status === 'RESCHEDULED' ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        Hẹn lại
                      </span>
                    ) : ap.status === 'COMPLETED' ? (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        Đã xem xong
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                        Đã hủy
                      </span>
                    )}
                  </div>
                </div>

                {/* Phòng quan tâm */}
                <div className="bg-teal-50/60 p-3 rounded-2xl border border-teal-100/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-teal-900 font-extrabold">Phòng {ap.room?.roomNumber}</span>
                    <strong className="text-teal-700 font-bold">{ap.room?.basePrice?.toLocaleString('vi-VN')} đ/tháng</strong>
                  </div>
                  <p className="text-[11px] text-teal-800/80 line-clamp-1">
                    {ap.room?.property?.name} ({ap.room?.floor?.name})
                  </p>
                </div>

                {/* Thông tin liên hệ & giờ hẹn */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-teal-600 shrink-0" />
                    <strong className="font-mono text-slate-800">{ap.phone}</strong>
                  </p>

                  {ap.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={13} className="text-teal-600 shrink-0" />
                      <span className="truncate">{ap.email}</span>
                    </p>
                  )}

                  <p className="flex items-center gap-2">
                    <Clock size={13} className="text-teal-600 shrink-0" />
                    <span className="font-medium text-slate-700">
                      Hẹn lúc: <strong>{new Date(ap.preferredDate).toLocaleString('vi-VN')}</strong>
                    </span>
                  </p>
                </div>

                {/* Lời nhắn của khách */}
                {ap.message && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 italic">
                    "{ap.message}"
                  </div>
                )}

                {/* Ghi chú của chủ nhà */}
                {ap.ownerNote && (
                  <p className="text-[11px] text-slate-500 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    <strong>Ghi chú chủ nhà:</strong> {ap.ownerNote}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAppointment(ap);
                      setNewStatus(ap.status);
                      setOwnerNote(ap.ownerNote || '');
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition text-center"
                  >
                    Cập Nhật Trạng Thái
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConvertToTenant(ap)}
                    className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm text-center flex items-center justify-center gap-1"
                  >
                    <UserPlus size={13} /> Chốt Thuê & HĐ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal cập nhật trạng thái lịch hẹn */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Xử Lý Lịch Hẹn: {selectedAppointment.fullName}
            </h3>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái xử lý</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                >
                  <option value="CONFIRMED">Xác nhận lịch đón tiếp (CONFIRMED)</option>
                  <option value="RESCHEDULED">Đề xuất hẹn lại giờ khác (RESCHEDULED)</option>
                  <option value="COMPLETED">Đã tiếp đón và xem phòng xong (COMPLETED)</option>
                  <option value="CANCELLED">Hủy lịch hẹn (CANCELLED)</option>
                </select>
              </div>

              {newStatus === 'RESCHEDULED' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Giờ đề xuất mới</label>
                  <input
                    type="datetime-local"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ghi chú của chủ nhà</label>
                <textarea
                  rows={3}
                  value={ownerNote}
                  onChange={(e) => setOwnerNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                  placeholder="VD: Đã gọi điện xác nhận đón khách lúc 15h tại cổng SkyHome..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow"
                >
                  {updating ? 'Đang lưu...' : 'LƯU CẬP NHẬT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
