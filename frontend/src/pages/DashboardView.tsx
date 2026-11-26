import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DashboardStats } from '../types';
import {
  Home, DollarSign, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Calendar, Users, Wrench, ArrowRight, ShieldCheck, RefreshCw, Layers
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface DashboardViewProps {
  onNavigateTab?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Lỗi tải thống kê:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw size={32} className="animate-spin text-teal-600 mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Đang tổng hợp số liệu kinh doanh nhà trọ...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-12 text-center text-red-500 font-bold text-sm">
        Không thể tải dữ liệu thống kê từ máy chủ.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">TỔNG QUAN HỆ THỐNG</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Tình Hình Kinh Doanh & Vận Hành Nhà Trọ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Số liệu tháng <strong className="text-slate-800">{stats.financialStats.currentPeriod}</strong> cập nhật theo thời gian thực
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Làm Mới Dữ Liệu
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tỷ lệ lấp đầy */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tỷ lệ lấp đầy</p>
            <h3 className="text-3xl font-black text-teal-600 mt-1">{stats.roomStats.occupancyRate}%</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Đang thuê: <strong className="text-slate-800">{stats.roomStats.occupied}</strong> / {stats.roomStats.total} phòng
            </p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
            <Home size={26} />
          </div>
        </div>

        {/* Đã thực thu */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Thực thu tháng này</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatVND(stats.financialStats.monthCollected)}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Tiền thực nhận về tài khoản</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={26} />
          </div>
        </div>

        {/* Tổng phát hành */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Hóa đơn phát hành</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{formatVND(stats.financialStats.monthBilled)}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Tổng tiền phòng & dịch vụ</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <DollarSign size={26} />
          </div>
        </div>

        {/* Công nợ tồn đọng */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Công nợ còn thiếu</p>
            <h3 className={`text-2xl font-black mt-1 ${stats.financialStats.totalOutstandingDebt > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {formatVND(stats.financialStats.totalOutstandingDebt)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Từ {stats.financialStats.unpaidInvoicesCount} hóa đơn chưa tất toán
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <Clock size={26} />
          </div>
        </div>
      </div>

      {/* Biểu đồ doanh thu 6 tháng gần nhất */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Biểu Đồ Thu Tiền & Hóa Đơn 6 Tháng Gần Nhất</h3>
            <p className="text-xs text-slate-500">Đối chiếu giữa số tiền thực thu và tổng hóa đơn phát hành</p>
          </div>
          <span className="text-xs font-bold text-teal-600 flex items-center gap-1 bg-teal-50 px-3 py-1 rounded-full">
            <TrendingUp size={14} /> Tăng trưởng ổn định
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThucThu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHoaDon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
              />
              <Tooltip
                formatter={(val: number) => [formatVND(val), '']}
                contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="thucThu" name="Tiền Thực Thu" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorThucThu)" />
              <Area type="monotone" dataKey="tongHoaDon" name="Tổng Hóa Đơn" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorHoaDon)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid 3 cột thông tin vận hành quan trọng */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1: Lịch xem phòng sắp tới */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-teal-600" />
              <h4 className="text-sm font-extrabold text-slate-900">Lịch Xem Phòng Sắp Tới</h4>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('appointments')}
                className="text-xs text-teal-600 font-bold hover:underline"
              >
                Tất cả
              </button>
            )}
          </div>

          <div className="space-y-3">
            {stats.upcomingAppointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Không có lịch hẹn nào sắp tới.</p>
            ) : (
              stats.upcomingAppointments.map((ap) => (
                <div key={ap.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{ap.fullName}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      Phòng {ap.room?.roomNumber}
                    </span>
                  </div>
                  <p className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <Clock size={12} className="text-teal-600" />
                    {new Date(ap.preferredDate).toLocaleString('vi-VN')}
                  </p>
                  <p className="text-slate-600 font-mono text-[11px]">SĐT: {ap.phone}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột 2: Yêu cầu sửa chữa chưa xử lý */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-amber-600" />
              <h4 className="text-sm font-extrabold text-slate-900">Sửa Chữa Chưa Xử Lý</h4>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('maintenance')}
                className="text-xs text-teal-600 font-bold hover:underline"
              >
                Tất cả
              </button>
            )}
          </div>

          <div className="space-y-3">
            {stats.pendingMaintenance.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Tất cả yêu cầu sửa chữa đã được giải quyết.</p>
            ) : (
              stats.pendingMaintenance.map((m) => (
                <div key={m.id} className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{m.title}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      P.{m.room?.roomNumber}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-1 text-[11px]">{m.description}</p>
                  <span className="text-[10px] text-slate-400 block">
                    Gửi lúc: {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột 3: Hợp đồng sắp hết hạn trong 30 ngày */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" />
              <h4 className="text-sm font-extrabold text-slate-900">Hợp Đồng Sắp Hết Hạn</h4>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('contracts')}
                className="text-xs text-teal-600 font-bold hover:underline"
              >
                Tất cả
              </button>
            )}
          </div>

          <div className="space-y-3">
            {stats.expiringContracts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Không có hợp đồng nào hết hạn trong 30 ngày tới.</p>
            ) : (
              stats.expiringContracts.map((c) => (
                <div key={c.id} className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{c.tenant?.fullName}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Phòng {c.room?.roomNumber}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Hết hạn: <strong className="text-indigo-900">{new Date(c.endDate).toLocaleDateString('vi-VN')}</strong>
                  </p>
                  <span className="text-[10px] text-slate-400 block font-mono">{c.contractCode}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
