import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MaintenanceRequest } from '../types';
import {
  Wrench, CheckCircle2, Clock, AlertTriangle, MessageSquare,
  DollarSign, RefreshCw, Filter, Send, X, AlertCircle
} from 'lucide-react';

const categoryLabels: Record<string, string> = {
  ELECTRICAL: 'Điện và đèn',
  PLUMBING: 'Nước và WC',
  APPLIANCE: 'Thiết bị',
  FURNITURE: 'Nội thất',
  FEEDBACK: 'Góp ý dịch vụ',
  OTHER: 'Vấn đề khác',
};

export const MaintenanceView: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Selected request for update modal
  const [selectedReq, setSelectedReq] = useState<MaintenanceRequest | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('IN_PROGRESS');
  const [estimatedCost, setEstimatedCost] = useState<string>('0');
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;

      const res = await api.get('/maintenance', { params });
      setRequests(res.data);
    } catch (err) {
      console.error('Lỗi lấy danh sách sửa chữa:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setUpdating(true);
    try {
      // 1. Cập nhật status & chi phí
      await api.patch(`/maintenance/${selectedReq.id}/status`, {
        status: updateStatus,
        estimatedCost: parseFloat(estimatedCost || '0'),
        resolutionNote: replyMessage || undefined
      });

      setSelectedReq(null);
      setReplyMessage('');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật tiến trình.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">DỊCH VỤ VẬN HÀNH</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản lý phản hồi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tiếp nhận báo hỏng từ người thuê, điều phối thợ kỹ thuật và phản hồi tiến trình xử lý
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Mới gửi (PENDING)</option>
            <option value="RECEIVED">Đã tiếp nhận (RECEIVED)</option>
            <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
            <option value="RESOLVED">Đã hoàn tất (RESOLVED)</option>
            <option value="REJECTED">Từ chối (REJECTED)</option>
          </select>

          <button
            onClick={fetchRequests}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Làm mới"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Grid danh sách yêu cầu */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <RefreshCw size={28} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-xs text-slate-500">Đang tải danh sách sự cố...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs border max-w-md mx-auto space-y-2">
          <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
          <p className="font-semibold text-slate-700">Không có yêu cầu sửa chữa nào trong mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">{r.title}</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {r.requestCode}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Phòng {r.room?.roomNumber} ({r.room?.property?.name}) • Người gửi: <strong>{r.createdByUser?.fullName || 'Khách thuê'}</strong>
                    </span>
                  </div>

                  <div>
                    {r.status === 'RESOLVED' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Đã hoàn tất
                      </span>
                    ) : r.status === 'IN_PROGRESS' ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        Đang xử lý
                      </span>
                    ) : r.status === 'RECEIVED' ? (
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

                {/* Urgency & Category tags */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    r.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-700' :
                    r.urgency === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Mức độ: {r.urgency === 'EMERGENCY' ? 'Khẩn cấp' : r.urgency === 'HIGH' ? 'Gấp' : 'Bình thường'}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100">
                    {categoryLabels[r.category] ?? r.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                  {r.description}
                </p>

                {/* Updates timeline */}
                {r.updates && r.updates.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nhật Ký Xử Lý:</span>
                    <div className="space-y-1.5 pl-2 border-l-2 border-teal-500">
                      {r.updates.map((u) => (
                        <div key={u.id} className="text-xs space-y-0.5">
                          <p className="text-slate-700 font-medium">
                            <span className="font-bold text-teal-700">[{u.updatedByUser?.fullName || 'Chủ nhà'}]:</span> {u.message}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(u.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions & Cost */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Chi phí sửa chữa: <strong className="text-slate-900 font-bold">{r.estimatedCost?.toLocaleString('vi-VN')} đ</strong>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedReq(r);
                    setUpdateStatus(r.status);
                    setEstimatedCost(String(r.estimatedCost || 0));
                    setReplyMessage('');
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
                >
                  Xử Lý & Cập Nhật
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal cập nhật tiến trình */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Cập nhật xử lý phản hồi</h3>
                <p className="text-xs text-teal-600 font-bold">{selectedReq.title} (P.{selectedReq.room?.roomNumber})</p>
              </div>
              <button onClick={() => setSelectedReq(null)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái mới</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                >
                  <option value="RECEIVED">Đã tiếp nhận (RECEIVED)</option>
                  <option value="IN_PROGRESS">Đang xử lý / Đã hẹn thợ (IN_PROGRESS)</option>
                  <option value="RESOLVED">Đã sửa chữa hoàn tất (RESOLVED)</option>
                  <option value="REJECTED">Từ chối xử lý (REJECTED)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chi phí sửa chữa (VNĐ)
                </label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-bold"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nội dung phản hồi cho người thuê <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium"
                  placeholder="VD: Thợ điện Daikin sẽ có mặt lúc 14h chiều nay để thay tụ máy lạnh..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow"
                >
                  {updating ? 'Đang lưu...' : 'LƯU & THÔNG BÁO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
