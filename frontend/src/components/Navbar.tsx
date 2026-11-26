import React from 'react';
import { User } from '../types';
import { Home, Receipt, FileText, Users, BarChart3, LogOut, ShieldCheck, KeyRound } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'rooms' | 'billing' | 'contracts' | 'tenants' | 'dashboard';
  setActiveTab: (tab: 'rooms' | 'billing' | 'contracts' | 'tenants' | 'dashboard') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, activeTab, setActiveTab, onLogout }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Nhà Trọ Số" className="h-10 w-auto object-contain drop-shadow" />
        <div>
          <h1 className="font-extrabold text-slate-800 text-base leading-tight tracking-tight">Nhà Trọ Số</h1>
          <p className="text-[10px] text-teal-600 font-bold tracking-wider uppercase">HỆ THỐNG QUẢN LÝ NHÀ TRỌ</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'rooms' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home size={15} /> Sơ Đồ Phòng
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'billing' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt size={15} /> Tính Tiền & Hóa Đơn
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'contracts' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText size={15} /> Hợp Đồng
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'tenants' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users size={15} /> Khách & Tạm Trú
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'dashboard' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={15} /> Thống Kê
        </button>
      </nav>

      {/* User profile & Logout */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-800">{currentUser?.fullName}</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-orange-100 text-orange-700">
            <KeyRound size={10} />
            {currentUser?.role === 'LANDLORD' ? 'Chủ Nhà Trọ' : 'Quản Lý Tòa Nhà'}
          </span>
        </div>

        <button
          onClick={onLogout}
          title="Đăng xuất"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
