import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Notification, Property, Room } from '../types';
import {
  Bell, Send, CheckCircle2, Users, Building2, Plus, RefreshCw, X, ShieldAlert
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // New notification modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GENERAL',
    targetType: 'ALL',
    targetPropertyId: '',
    targetRoomId: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notifRes, propRes, roomRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/properties'),
        api.get('/rooms')
      ]);
      setNotifications(notifRes.data);
      setProperties(propRes.data);
      setRooms(roomRes.data);
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const res = await api.post('/notifications', {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        targetType: formData.targetType,
        targetPropertyId: formData.targetPropertyId ? parseInt(formData.targetPropertyId) : undefined,
        targetRoomId: formData.targetRoomId ? parseInt(formData.targetRoomId) : undefined
      });

      alert(res.data.message);
      setShowModal(false);
      setFormData({
        title: '',
        content: '',
        type: 'GENERAL',
        targetType: 'ALL',
        targetPropertyId: '',
        targetRoomId: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi gửi thông báo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">KÊNH LIÊN LẠC</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý & Phát Thông Báo Nhà Trọ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gửi thông báo chốt tiền phòng, bảo trì định kỳ hoặc an ninh trật tự tới toàn khu hoặc từng phòng
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} /> Soạn Thông Báo Mới
        </button>
      </div>

      {/* Danh sách thông báo */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <RefreshCw size={28} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-xs text-slate-500">Đang tải lịch sử thông báo...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs border max-w-md mx-auto space-y-2">
          <Bell size={32} className="text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Chưa có thông báo nào được phát hành.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div key={n.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                      <Bell size={16} />
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900">{n.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Phát lúc: {new Date(n.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  Phạm vi: {n.targetType === 'ALL' ? 'Toàn bộ người thuê' : n.targetType === 'PROPERTY' ? 'Theo tòa nhà' : 'Theo phòng'}
                </span>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                {n.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal soạn thông báo */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Soạn Thông Báo Cho Người Thuê</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tiêu đề thông báo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-teal-500"
                  placeholder="VD: Thông báo chốt điện nước kỳ tháng 11/2026..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Loại thông báo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    <option value="GENERAL">Tin tức chung</option>
                    <option value="PAYMENT_REMINDER">Nhắc nhở đóng tiền</option>
                    <option value="MAINTENANCE">Lịch bảo trì</option>
                    <option value="RULES">Nội quy & PCCC</option>
                    <option value="EMERGENCY">Khẩn cấp</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Đối tượng gửi</label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    <option value="ALL">Gửi tất cả người thuê</option>
                    <option value="PROPERTY">Theo khu trọ / tòa nhà</option>
                    <option value="ROOM">Theo phòng cụ thể</option>
                  </select>
                </div>
              </div>

              {formData.targetType === 'PROPERTY' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Chọn khu trọ</label>
                  <select
                    value={formData.targetPropertyId}
                    onChange={(e) => setFormData({ ...formData, targetPropertyId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    <option value="">-- Chọn tòa nhà --</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.targetType === 'ROOM' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Chọn phòng</label>
                  <select
                    value={formData.targetRoomId}
                    onChange={(e) => setFormData({ ...formData, targetRoomId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>Phòng {r.roomNumber} ({r.property?.name})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-teal-500 leading-relaxed"
                  placeholder="Nhập nội dung thông báo gửi đến người thuê trọ..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <Send size={14} /> {sending ? 'Đang gửi...' : 'GỬI THÔNG BÁO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
