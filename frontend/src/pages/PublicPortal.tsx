import { getPropertyPhone, supportPhone, siteCopyright } from '../siteDetails';
import React, { useState, useEffect } from 'react';
import { ContactView } from './ContactView';
import api from '../services/api';
import { Room, Property, Amenity } from '../types';
import {
  Home, Search, MapPin, CheckCircle2, Phone, Mail, Calendar,
  Clock, Shield, Wifi, Sparkles, Filter, ChevronRight, X,
  Building2, Bed, Maximize2, Layers, ArrowRight, UserCheck, AlertCircle
} from 'lucide-react';

interface PublicPortalProps {
  onGoToLogin?: () => void;
  accountLabel?: string;
  embedded?: boolean;
  bookingContact?: { fullName: string; phone?: string; email?: string };
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ onGoToLogin, accountLabel = "Đăng nhập", embedded = false, bookingContact }) => {
  const [showContact, setShowContact] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('AVAILABLE');

  // Selected room for detail modal
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Booking modal
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [bookingForm, setBookingForm] = useState({
    fullName: bookingContact?.fullName ?? '',
    phone: bookingContact?.phone ?? '',
    email: bookingContact?.email ?? '',
    preferredDate: '',
    message: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState('');

  // Active image in room detail modal
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, propsRes] = await Promise.all([
        api.get('/public/rooms'),
        api.get('/public/properties')
      ]);
      setRooms(roomsRes.data);
      setProperties(propsRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu trang công khai:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (selectedStatus) params.status = selectedStatus;
      if (searchKeyword) params.search = searchKeyword;

      if (priceRange === 'under3') params.maxPrice = 3000000;
      else if (priceRange === '3to4') {
        params.minPrice = 3000000;
        params.maxPrice = 4000000;
      } else if (priceRange === 'above4') {
        params.minPrice = 4000000;
      }

      const res = await api.get('/public/rooms', { params });
      setRooms(res.data);
    } catch (err) {
      console.error('Lỗi lọc phòng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRoom) return;

    setBookingError('');
    setBookingLoading(true);

    try {
      const res = await api.post('/public/appointments', {
        ...bookingForm,
        roomId: bookingRoom.id
      });

      setBookingSuccess(res.data.appointmentCode);
      setBookingForm({
        fullName: bookingContact?.fullName ?? '',
        phone: bookingContact?.phone ?? '',
        email: bookingContact?.email ?? '',
        preferredDate: '',
        message: ''
      });
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu đặt lịch.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className={`flex flex-col font-sans text-slate-800 ${embedded ? '' : 'min-h-screen bg-slate-50'}`}>
      {/* 1. TOP NAVBAR */}
      {!embedded && <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto grid min-h-20 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Nhà Trọ Số" className="h-11 w-auto object-contain drop-shadow" />
            <div className="hidden sm:block">
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Nhà Trọ Số <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase tracking-wider">Hệ Thống Quản Lý</span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">Hệ Thống Nhà Cho Thuê & Căn Hộ Mini Tiện Nghi</p>
            </div>
          </div>

          <nav aria-label="Điều hướng chính" className="order-last col-span-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-300 sm:text-sm lg:order-none lg:col-span-1 xl:gap-x-8">
            {showContact ? (
              <button type="button" onClick={() => setShowContact(false)} className="hover:text-teal-400 transition">Xem phòng</button>
            ) : (
              <>
                <a href="#rooms" className="hover:text-teal-400 transition">Xem phòng</a>
                <a href="#properties" className="hover:text-teal-400 transition">Khu Trọ</a>
                <a href="#services" className="hover:text-teal-400 transition">Bảng Giá Dịch Vụ</a>
              </>
            )}
            <button type="button" aria-current={showContact ? 'page' : undefined} onClick={() => setShowContact(true)} className="hover:text-teal-400 aria-[current=page]:text-teal-400 transition">Liên hệ</button>
          </nav>

          <div className="justify-self-end">
            <button
              onClick={onGoToLogin}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold tracking-wide transition shadow-lg shadow-teal-600/30 flex items-center gap-2 active:scale-95"
            >
              <UserCheck size={16} /> {accountLabel}
            </button>
          </div>
        </div>
      </header>}

      {showContact ? (
        <main className="flex-1 px-4">
          <ContactView onViewRooms={() => setShowContact(false)} />
        </main>
      ) : <>
      {/* 2. HERO BANNER */}
      <section className={`relative overflow-hidden bg-gradient-to-br from-slate-900 to-teal-950 px-4 text-white ${embedded ? "rounded-3xl py-7 sm:px-8" : "border-b border-slate-800 pt-16 pb-24"}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          {embedded ? (
            <div className="text-left">
              <h1 className="text-2xl font-black sm:text-3xl">Tìm phòng cho thuê</h1>
              <p className="mt-2 text-sm text-slate-300">Lọc theo khu vực, giá thuê và tình trạng phòng để đặt lịch xem.</p>
            </div>
          ) : <>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} /> An ninh 24/7 - Khóa vân tay - Không chung chủ
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Tìm Phòng Trọ Tiện Nghi, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400">
              Hiện Đại & Minh Bạch Chi Phí
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Hệ thống quản lý phòng trọ thế hệ mới với 20+ phòng tiện ích tại Cầu Giấy (Hà Nội) và Bình Thạnh (TP.HCM). Xem phòng trực tiếp, ký hợp đồng điện tử và quản lý tiền phòng qua cổng trực tuyến.
          </p>

          </>}

          {/* Quick Filter Box */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-2xl text-slate-800 max-w-4xl mx-auto border border-slate-100 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Khu Vực / Tòa Nhà</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                >
                  <option value="">Tất cả các cơ sở</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mức Giá Thuê</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                >
                  <option value="all">Mọi mức giá</option>
                  <option value="under3">Dưới 3.000.000 đ</option>
                  <option value="3to4">3.000.000 đ - 4.000.000 đ</option>
                  <option value="above4">Trên 4.000.000 đ</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Trạng Thái Phòng</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="AVAILABLE">Phòng trống sẵn sàng</option>
                  <option value="OCCUPIED">Đang cho thuê</option>
                  <option value="MAINTENANCE">Đang bảo trì</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleFilter}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Search size={15} /> TÌM PHÒNG NGAY
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DANH SÁCH PHÒNG TRỌ CÔNG KHAI */}
      <section id="rooms" style={{ scrollMarginTop: embedded ? 160 : 120 }} className={embedded ? "w-full py-4" : "max-w-7xl mx-auto px-4 sm:px-6 py-16 flex-1"}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-teal-600 tracking-wider uppercase">DANH MỤC PHÒNG TRỌ</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Khám Phá Các Căn Phòng Đang Cho Thuê
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Hiển thị <strong>{rooms.length}</strong> phòng phù hợp với yêu cầu
          </p>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Đang tải danh sách phòng trọ...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200 space-y-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Home size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy phòng phù hợp</h3>
            <p className="text-xs text-slate-500">
              Hãy thử thay đổi tiêu chí lọc giá, khu vực hoặc tìm kiếm phòng ở trạng thái khác.
            </p>
            <button
              onClick={() => {
                setSelectedPropertyId('');
                setPriceRange('all');
                setSelectedStatus('');
                setSearchKeyword('');
                fetchData();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const coverImg = room.images?.find(i => i.isCover)?.url || room.images?.[0]?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Image cover with badges */}
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    <img
                      src={coverImg}
                      alt={room.roomNumber}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {room.status === 'AVAILABLE' ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white font-black text-[11px] shadow-sm flex items-center gap-1">
                          <CheckCircle2 size={12} /> Đang trống
                        </span>
                      ) : room.status === 'OCCUPIED' ? (
                        <span className="px-3 py-1 rounded-full bg-amber-600/90 backdrop-blur-sm text-white font-bold text-[11px] shadow-sm">
                          Đang thuê
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-700/90 backdrop-blur-sm text-white font-bold text-[11px] shadow-sm">
                          Đang bảo trì
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-white font-bold text-[11px]">
                        {room.floor?.name || `Tầng ${room.floorId}`}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-sm text-white font-extrabold text-sm shadow">
                      {room.basePrice.toLocaleString('vi-VN')} <span className="text-[10px] font-normal text-slate-300">đ/tháng</span>
                    </div>
                  </div>

                  {/* Room details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-600 transition">
                          Phòng {room.roomNumber}
                        </h3>
                        <span className="text-xs font-semibold text-slate-500">
                          Cọc: {room.depositAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin size={14} className="text-teal-600 shrink-0" />
                        <span className="line-clamp-1">{room.property?.name} ({room.property?.district})</span>
                      </p>

                      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 pt-1">
                        <span className="flex items-center gap-1">
                          <Maximize2 size={13} className="text-slate-400" /> {room.area} m²
                        </span>
                        <span className="flex items-center gap-1">
                          <Bed size={13} className="text-slate-400" /> Tối đa {room.maxRenters} người
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 pt-1 leading-relaxed">
                        {room.description || 'Phòng thoáng mát, đầy đủ tiện ích cơ bản, an ninh đảm bảo.'}
                      </p>

                      {/* Amenities pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {room.roomAmenities?.slice(0, 3).map(ra => (
                          <span
                            key={ra.id}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100"
                          >
                            {ra.amenity.name}
                          </span>
                        ))}
                        {(room.roomAmenities?.length || 0) > 3 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            +{(room.roomAmenities?.length || 0) - 3} tiện ích
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoom(room);
                          setActiveImageIndex(0);
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition text-center"
                      >
                        Xem Chi Tiết
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBookingRoom(room);
                          setBookingSuccess(null);
                          setBookingError('');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition text-center shadow-sm flex items-center justify-center gap-1"
                      >
                        <Calendar size={14} /> Đặt Lịch Xem
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. GIỚI THIỆU 2 TÒA NHÀ KHU TRỌ */}
      {!embedded && <>
      <section id="properties" className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">HỆ THỐNG CƠ SỞ</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Hai Khu Trọ Tiêu Chuẩn Tại Hà Nội & TP.HCM
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Vị trí đắc địa gần các trường đại học lớn và trục đường huyết mạch, trang bị đồng bộ an ninh và tiện ích.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {properties.map(p => (
              <div
                key={p.id}
                className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700 hover:border-teal-500/50 transition duration-300 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
                    <Building2 size={26} />
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-700 text-slate-300">
                    Mã: {p.code}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white">{p.name}</h3>

                <p className="text-xs text-slate-300 flex items-start gap-2">
                  <MapPin size={16} className="text-teal-400 shrink-0 mt-0.5" />
                  <span>{p.address}</span>
                </p>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {p.description}
                </p>

                <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 font-semibold block">Quản lý khu trọ:</span>
                    <strong className="text-slate-200">{p.managerName || 'Bác Ba'}</strong>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[11px] text-slate-500 font-semibold block">Hotline liên hệ:</span>
                    <strong className="text-teal-400 font-mono">{getPropertyPhone(p.managerPhone)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BẢNG GIÁ DỊCH VỤ MINH BẠCH */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">MINH BẠCH CHI PHÍ</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bảng Giá Dịch Vụ Niêm Yết
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Không phát sinh chi phí ẩn. Chỉ số điện nước chốt ngày cuối tháng và đối soát trực tiếp qua ứng dụng.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto">
              <Sparkles size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Điện Sinh Hoạt</h4>
            <p className="text-lg font-black text-teal-600">3.500 đ</p>
            <span className="text-[11px] text-slate-500 block">/ kWh (Theo đồng hồ)</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto">
              <Layers size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Nước Sinh Hoạt</h4>
            <p className="text-lg font-black text-teal-600">25.000 đ</p>
            <span className="text-[11px] text-slate-500 block">/ m³ (Đồng hồ riêng)</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
              <Wifi size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Internet Cáp Quang</h4>
            <p className="text-lg font-black text-teal-600">100.000 đ</p>
            <span className="text-[11px] text-slate-500 block">/ Phòng / Tháng</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto">
              <Shield size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Gửi Xe Máy</h4>
            <p className="text-lg font-black text-teal-600">100.000 đ</p>
            <span className="text-[11px] text-slate-500 block">/ Xe / Tháng</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-2 shadow-sm">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mx-auto">
              <Home size={20} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Vệ Sinh & Rác</h4>
            <p className="text-lg font-black text-teal-600">50.000 đ</p>
            <span className="text-[11px] text-slate-500 block">/ Phòng / Tháng</span>
          </div>
        </div>
      </section>

      </>}

      {/* 6. MODAL CHI TIẾT PHÒNG */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Header modal */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Thông Tin Chi Tiết - Phòng {selectedRoom.roomNumber}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={12} className="text-teal-600" />
                  {selectedRoom.property?.name} ({selectedRoom.property?.address})
                </p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Gallery */}
              {selectedRoom.images && selectedRoom.images.length > 0 && (
                <div className="space-y-3">
                  <div className="h-72 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={selectedRoom.images[activeImageIndex]?.url}
                      alt={selectedRoom.roomNumber}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Thumbnails */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedRoom.images.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`h-16 w-24 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                          activeImageIndex === idx ? 'border-teal-500 scale-95 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-semibold block">Giá thuê niêm yết</span>
                  <strong className="text-base text-teal-600 font-black">
                    {selectedRoom.basePrice.toLocaleString('vi-VN')} đ
                  </strong>
                  <span className="text-[10px] text-slate-400 block">/ tháng</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-semibold block">Tiền đặt cọc</span>
                  <strong className="text-base text-slate-800 font-bold">
                    {selectedRoom.depositAmount.toLocaleString('vi-VN')} đ
                  </strong>
                  <span className="text-[10px] text-slate-400 block">(Hoàn trả khi trả phòng)</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-semibold block">Diện tích sử dụng</span>
                  <strong className="text-base text-slate-800 font-bold">{selectedRoom.area} m²</strong>
                  <span className="text-[10px] text-slate-400 block">{selectedRoom.floor?.name}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-semibold block">Số người ở tối đa</span>
                  <strong className="text-base text-slate-800 font-bold">{selectedRoom.maxRenters} người</strong>
                  <span className="text-[10px] text-slate-400 block">Phù hợp nhóm bạn/cặp đôi</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mô Tả Không Gian</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  {selectedRoom.description || 'Phòng trọ được thiết kế đón sáng tự nhiên, môi trường văn minh, yên tĩnh và an ninh tuyệt đối.'}
                </p>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Trang Thiết Bị & Tiện Nghi</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedRoom.roomAmenities?.map(ra => (
                    <div
                      key={ra.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-teal-900 text-xs font-semibold"
                    >
                      <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
                      <span>{ra.amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick action in detail modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Quan tâm căn phòng này?</span>
                  <p className="text-xs font-bold text-slate-800">Đặt lịch hẹn để được đón tiếp chu đáo nhất</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedRoom;
                    setSelectedRoom(null);
                    setBookingRoom(r);
                    setBookingSuccess(null);
                    setBookingError('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Calendar size={15} /> Đặt Lịch Xem Phòng Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL ĐẶT LỊCH XEM PHÒNG */}
      {bookingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Đặt Lịch Hẹn Xem Phòng</h3>
                <p className="text-xs text-teal-700 font-bold">
                  Phòng {bookingRoom.roomNumber} - {bookingRoom.property?.name}
                </p>
              </div>
              <button
                onClick={() => setBookingRoom(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                  <CheckCircle2 size={26} />
                </div>
                <h4 className="text-base font-bold text-emerald-900">Gửi Yêu Cầu Thành Công!</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Mã lịch hẹn của bạn là: <strong className="font-mono text-sm underline">{bookingSuccess}</strong>.
                  <br />
                  Chủ nhà (<a className="font-semibold underline" href={`tel:${supportPhone}`}>{supportPhone}</a>) sẽ liên hệ với bạn qua số điện thoại để xác nhận lịch đón tiếp.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingRoom(null)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Đóng Hộp Thoại
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} /> {bookingError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Họ và tên của bạn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingForm.fullName}
                    onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="VD: Nguyễn Văn Anh"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="09xx xxx xxx"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email liên hệ (nếu có)</label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="email@gmail.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Thời gian mong muốn xem phòng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingForm.preferredDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Lời nhắn cho chủ nhà</label>
                  <textarea
                    rows={2}
                    value={bookingForm.message}
                    onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="VD: Tôi muốn dọn vào ở từ cuối tuần này..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingRoom(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {bookingLoading ? 'Đang gửi...' : 'GỬI YÊU CẦU ĐẶT LỊCH'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 8. FOOTER */}
      </>}
      {!embedded && <footer id="contact" className="bg-slate-950 text-white border-t border-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Nhà Trọ Số" className="h-10 w-auto object-contain brightness-110" />
              <span className="text-lg font-black text-white">Nhà Trọ Số</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Giải pháp số hóa toàn diện việc quản lý phòng trọ, căn hộ dịch vụ và thanh toán điện tử cho chủ nhà và người thuê.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Cơ sở Hà Nội</h4>
            <p className="text-xs text-slate-300">Tòa nhà SkyHome Cầu Giấy</p>
            <p className="text-xs text-slate-400">Số 26 Ngõ 165 Cầu Giấy, Quan Hoa, Hà Nội</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Cơ sở TP.HCM</h4>
            <p className="text-xs text-slate-300">Tòa nhà GreenHouse Bình Thạnh</p>
            <p className="text-xs text-slate-400">48/12 Ung Văn Khiêm, Phường 25, Bình Thạnh</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Đường Dây Nóng</h4>
            <p className="text-sm font-mono font-bold text-white flex items-center gap-1.5">
              <Phone size={15} className="text-teal-400" /> <a href={`tel:${supportPhone}`} className="hover:underline">{supportPhone}</a>
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock size={14} className="text-teal-400" /> Tiếp khách xem phòng: 8h00 - 20h00
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-900 text-center text-xs text-slate-500">
          {siteCopyright}
        </div>
      </footer>}
    </div>
  );
};
