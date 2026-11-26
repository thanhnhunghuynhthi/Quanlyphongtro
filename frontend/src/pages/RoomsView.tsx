import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Room, Property, Amenity } from '../types';
import {
  Plus, Home, UserCheck, Wrench, Search, Eye, Edit2, Layers, CheckCircle2,
  Trash2, Building2, MapPin, Maximize2, Bed, Image as ImageIcon, Sparkles,
  Lock, Globe, Archive, AlertCircle, X, RefreshCw
} from 'lucide-react';

interface RoomsViewProps {
  onSelectRoomForContract?: (roomId: number) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({ onSelectRoomForContract }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [form, setForm] = useState({
    roomNumber: '',
    propertyId: '',
    floorId: '',
    area: '22',
    basePrice: '3200000',
    depositAmount: '3200000',
    maxRenters: '2',
    status: 'AVAILABLE',
    isPublic: true,
    description: '',
    selectedAmenityIds: [] as number[],
    imageUrls: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ]
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [selectedPropertyId, statusFilter, search]);

  const fetchInitialData = async () => {
    try {
      const [propsRes, amensRes] = await Promise.all([
        api.get('/properties'),
        api.get('/amenities')
      ]);
      setProperties(propsRes.data);
      setAmenities(amensRes.data);
      if (propsRes.data.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(String(propsRes.data[0].id));
      }
    } catch (err) {
      console.error('Lỗi tải danh mục cơ sở:', err);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/rooms', { params });
      setRooms(res.data);
    } catch (err) {
      console.error('Lỗi lấy danh sách phòng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingRoomId(null);
    const activeProp = properties.find(p => String(p.id) === selectedPropertyId) || properties[0];
    const defaultFloor = activeProp?.floors?.[0]?.id || '';

    setForm({
      roomNumber: `P.${Math.floor(100 + Math.random() * 300)}`,
      propertyId: String(activeProp?.id || ''),
      floorId: String(defaultFloor),
      area: '24',
      basePrice: '3500000',
      depositAmount: '3500000',
      maxRenters: '2',
      status: 'AVAILABLE',
      isPublic: true,
      description: 'Phòng mới nâng cấp gác lửng, ban công thoáng mát, đầy đủ tiện ích cơ bản.',
      selectedAmenityIds: amenities.slice(0, 4).map(a => a.id),
      imageUrls: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
      ]
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setEditingRoomId(room.id);
    setForm({
      roomNumber: room.roomNumber,
      propertyId: String(room.propertyId),
      floorId: String(room.floorId),
      area: String(room.area),
      basePrice: String(room.basePrice),
      depositAmount: String(room.depositAmount),
      maxRenters: String(room.maxRenters),
      status: room.status,
      isPublic: room.isPublic,
      description: room.description || '',
      selectedAmenityIds: room.roomAmenities?.map(ra => ra.amenityId) || [],
      imageUrls: room.images?.map(i => i.url) || []
    });
    setShowModal(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        roomNumber: form.roomNumber,
        propertyId: parseInt(form.propertyId),
        floorId: parseInt(form.floorId),
        area: parseFloat(form.area),
        basePrice: parseFloat(form.basePrice),
        depositAmount: parseFloat(form.depositAmount),
        maxRenters: parseInt(form.maxRenters),
        status: form.status,
        isPublic: form.isPublic,
        description: form.description,
        amenityIds: form.selectedAmenityIds,
        imageUrls: form.imageUrls
      };

      if (editingRoomId) {
        await api.put(`/rooms/${editingRoomId}`, payload);
        alert('Cập nhật phòng thành công!');
      } else {
        await api.post('/rooms', payload);
        alert('Thêm phòng mới thành công!');
      }

      setShowModal(false);
      fetchRooms();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    const confirm = window.confirm('Bạn có chắc muốn xóa hoặc lưu trữ phòng này?');
    if (!confirm) return;

    try {
      const res = await api.delete(`/rooms/${id}`);
      alert(res.data.message);
      fetchRooms();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa phòng.');
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const res = await api.get(`/rooms/${id}`);
      setSelectedRoom(res.data);
    } catch (err) {
      alert('Lỗi tải chi tiết phòng.');
    }
  };

  const currentProperty = properties.find(p => String(p.id) === selectedPropertyId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">SƠ ĐỒ TÒA NHÀ</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Khu Trọ, Tầng & Phòng Trọ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi trạng thái phòng trống, đang thuê, cấu hình công khai và tiện ích niêm yết
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md self-start sm:self-auto"
        >
          <Plus size={16} /> Thêm Phòng Mới
        </button>
      </div>

      {/* Property Switcher Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {properties.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPropertyId(String(p.id))}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              selectedPropertyId === String(p.id)
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-100 border'
            }`}
          >
            <Building2 size={15} />
            <span>{p.name}</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {p.code}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and stats summary */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">Phòng trống (AVAILABLE)</option>
            <option value="OCCUPIED">Đang thuê (OCCUPIED)</option>
            <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
          </select>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm mã phòng, mô tả..."
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 w-56"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 font-semibold text-slate-500 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Trống: <strong>{rooms.filter(r => r.status === 'AVAILABLE').length}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Đang thuê: <strong>{rooms.filter(r => r.status === 'OCCUPIED').length}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Bảo trì: <strong>{rooms.filter(r => r.status === 'MAINTENANCE').length}</strong>
          </span>
        </div>
      </div>

      {/* Room Grid Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <RefreshCw size={28} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Đang tải danh sách phòng...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500 text-xs border max-w-md mx-auto space-y-2">
          <Home size={32} className="text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Không tìm thấy phòng nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => {
            const activeContract = room.contracts?.[0];
            const tenantName = activeContract?.tenant?.fullName;

            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                        Phòng {room.roomNumber}
                        {room.isPublic && (
                          <span title="Hiển thị trên web công khai">
                            <Globe size={13} className="text-teal-600" />
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {room.floor?.name || `Tầng ${room.floorId}`} • {room.area} m²
                      </span>
                    </div>

                    <div>
                      {room.status === 'AVAILABLE' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Trống
                        </span>
                      ) : room.status === 'OCCUPIED' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Đang thuê
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          Bảo trì
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Giá thuê:</span>
                      <strong className="text-teal-700 font-bold">{room.basePrice.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tiền cọc:</span>
                      <strong className="text-slate-700">{room.depositAmount.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>

                  {/* Khách đang thuê nếu có */}
                  {tenantName && (
                    <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100 text-xs">
                      <span className="text-[10px] text-amber-700 font-bold block uppercase">Khách đang ở:</span>
                      <strong className="text-slate-800 font-bold">{tenantName}</strong>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleViewDetail(room.id)}
                    className="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
                    title="Xem hồ sơ phòng"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(room)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit2 size={16} />
                  </button>

                  {room.status === 'AVAILABLE' && onSelectRoomForContract && (
                    <button
                      type="button"
                      onClick={() => onSelectRoomForContract(room.id)}
                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold transition"
                    >
                      Lập HĐ
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="Xóa hoặc lưu trữ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL THÊM / SỬA PHÒNG */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingRoomId ? `Chỉnh Sửa Phòng ${form.roomNumber}` : 'Thêm Phòng Trọ Mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Khu trọ / Cơ sở</label>
                  <select
                    value={form.propertyId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const prop = properties.find(p => String(p.id) === pId);
                      setForm({
                        ...form,
                        propertyId: pId,
                        floorId: String(prop?.floors?.[0]?.id || '')
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tầng</label>
                  <select
                    value={form.floorId}
                    onChange={(e) => setForm({ ...form, floorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    {properties
                      .find(p => String(p.id) === form.propertyId)
                      ?.floors?.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mã phòng</label>
                  <input
                    type="text"
                    required
                    value={form.roomNumber}
                    onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold"
                    placeholder="P.101"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Diện tích (m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tối đa người</label>
                  <input
                    type="number"
                    required
                    value={form.maxRenters}
                    onChange={(e) => setForm({ ...form, maxRenters: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Giá thuê (VNĐ/tháng)</label>
                  <input
                    type="number"
                    required
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold text-teal-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tiền cọc tiêu chuẩn (VNĐ)</label>
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái phòng</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-semibold bg-slate-50"
                  >
                    <option value="AVAILABLE">Trống (Sẵn sàng cho thuê)</option>
                    <option value="OCCUPIED">Đang cho thuê</option>
                    <option value="MAINTENANCE">Đang bảo trì / sửa chữa</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPublicCheck"
                    checked={form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <label htmlFor="isPublicCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Công khai trên Website tìm phòng
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô tả chi tiết phòng</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                />
              </div>

              {/* Amenity Checkboxes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Tiện ích trong phòng</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 border rounded-xl bg-slate-50">
                  {amenities.map(a => {
                    const isChecked = form.selectedAmenityIds.includes(a.id);
                    return (
                      <label key={a.id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, selectedAmenityIds: [...form.selectedAmenityIds, a.id] });
                            } else {
                              setForm({ ...form, selectedAmenityIds: form.selectedAmenityIds.filter(id => id !== a.id) });
                            }
                          }}
                          className="rounded text-teal-600"
                        />
                        <span className="truncate">{a.name}</span>
                      </label>
                    );
                  })}
                </div>
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
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow"
                >
                  Lưu Phòng Trọ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT PHÒNG CHO CHỦ NHÀ */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Hồ Sơ Phòng {selectedRoom.roomNumber}</h3>
                <p className="text-xs text-slate-500">{selectedRoom.property?.name} • {selectedRoom.floor?.name}</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="p-1 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-slate-400 block text-[10px]">Giá thuê niêm yết</span>
                  <strong className="text-teal-700 font-bold">{selectedRoom.basePrice.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-slate-400 block text-[10px]">Tiền đặt cọc</span>
                  <strong className="text-slate-800">{selectedRoom.depositAmount.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-slate-400 block text-[10px]">Diện tích</span>
                  <strong className="text-slate-800">{selectedRoom.area} m²</strong>
                </div>
              </div>

              {/* Hợp đồng hiện tại */}
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Hợp Đồng Thuê Gần Nhất:</h4>
                {selectedRoom.contracts && selectedRoom.contracts.length > 0 ? (
                  <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-teal-900">{selectedRoom.contracts[0].contractCode}</span>
                      <span className="text-slate-600">Khách: {selectedRoom.contracts[0].tenant?.fullName}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Thời hạn: {new Date(selectedRoom.contracts[0].startDate).toLocaleDateString('vi-VN')} đến {new Date(selectedRoom.contracts[0].endDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Chưa có hợp đồng nào phát sinh.</p>
                )}
              </div>

              {/* Lịch sử hóa đơn gần đây */}
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Lịch Sử Hóa Đơn (6 Kỳ Gần Nhất):</h4>
                <div className="divide-y border rounded-xl overflow-hidden">
                  {selectedRoom.invoices?.map((inv: any) => (
                    <div key={inv.id} className="p-2.5 flex justify-between bg-white text-[11px]">
                      <span>{inv.invoiceCode} ({inv.period})</span>
                      <strong className="text-slate-800">{inv.totalAmount.toLocaleString('vi-VN')} đ</strong>
                      <span className={inv.status === 'PAID' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                        {inv.status === 'PAID' ? 'Đã thu' : 'Còn nợ'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
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
