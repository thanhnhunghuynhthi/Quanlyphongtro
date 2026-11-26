import React from 'react';
import { User } from '../types';
import {
  Home, Building2, Users, FileText, Receipt, Calendar, Wrench,
  Bell, BarChart3, LogOut, KeyRound, Globe, Shield, Sparkles, ChevronRight
} from 'lucide-react';

export type OwnerTab =
  | 'dashboard'
  | 'rooms'
  | 'tenants'
  | 'contracts'
  | 'billing'
  | 'appointments'
  | 'maintenance'
  | 'notifications'
  | 'reports';

interface OwnerSidebarProps {
  currentUser: User;
  activeTab: OwnerTab;
  setActiveTab: (tab: OwnerTab) => void;
  onLogout: () => void;
  onViewPublic: () => void;
}

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onViewPublic
}) => {
  const menuItems = [
    { id: 'dashboard' as OwnerTab, label: 'Tổng Quan', icon: BarChart3 },
    { id: 'rooms' as OwnerTab, label: 'Khu Trọ & Phòng', icon: Building2 },
    { id: 'tenants' as OwnerTab, label: 'Khách thuê & Tài khoản', icon: Users },
    { id: 'contracts' as OwnerTab, label: 'Hợp Đồng Thuê', icon: FileText },
    { id: 'billing' as OwnerTab, label: 'Điện Nước & Hóa Đơn', icon: Receipt },
    { id: 'appointments' as OwnerTab, label: 'Lịch Xem Phòng', icon: Calendar },
    { id: 'maintenance' as OwnerTab, label: 'Quản lý phản hồi', icon: Wrench },
    { id: 'notifications' as OwnerTab, label: 'Thông Báo', icon: Bell },
    { id: 'reports' as OwnerTab, label: 'Báo Cáo & Nhật Ký', icon: Shield },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Nhà Trọ Số" className="h-10 w-auto object-contain drop-shadow" />
          <div className="overflow-hidden">
            <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              Nhà Trọ Số <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">PRO</span>
            </h1>
            <p className="text-[10px] text-teal-400 font-medium uppercase tracking-wider">Cổng Quản Trị Chủ Nhà</p>
          </div>
        </div>
      </div>

      {/* User profile snippet */}
      <div className="p-4 mx-3 my-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
          Ba
        </div>
        <div className="overflow-hidden">
          <strong className="text-xs font-bold text-white block truncate">{currentUser.fullName}</strong>
          <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1">
            <Sparkles size={10} /> Chủ Nhà Trọ (OWNER)
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-teal-200" />}
            </button>
          );
        })}
      </nav>

      {/* Quick Public View & Logout Footer */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        <button
          onClick={onViewPublic}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-teal-300 text-xs font-bold transition border border-slate-700/60"
        >
          <Globe size={14} /> Xem Website Công Khai
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold transition border border-red-900/40"
        >
          <LogOut size={14} /> Đăng Xuất
        </button>
      </div>
    </aside>
  );
};
