import React, { useState, useEffect } from 'react';
import { User } from './types';
import { PublicPortal } from './pages/PublicPortal';
import { LoginPage } from './pages/LoginPage';
import { TenantPortal } from './pages/TenantPortal';
import { OwnerSidebar, OwnerTab } from './components/OwnerSidebar';
import { DashboardView } from './pages/DashboardView';
import { RoomsView } from './pages/RoomsView';
import { TenantsView } from './pages/TenantsView';
import { ContractsView } from './pages/ContractsView';
import { BillingView } from './pages/BillingView';
import { AppointmentsView } from './pages/AppointmentsView';
import { MaintenanceView } from './pages/MaintenanceView';
import { NotificationsView } from './pages/NotificationsView';
import { ReportsView } from './pages/ReportsView';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'public' | 'owner' | 'tenant'>('public');
  const [showLogin, setShowLogin] = useState(() => window.location.pathname === '/login');

  const closeLogin = () => {
    setShowLogin(false);
    if (window.location.pathname === '/login') window.history.replaceState(null, '', '/');
  };
  const [ownerActiveTab, setOwnerActiveTab] = useState<OwnerTab>('dashboard');
  const [prefilledContract, setPrefilledContract] = useState<{ tenantId?: number; roomId?: number }>({});
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('tro_user');
    const token = localStorage.getItem('tro_token');

    if (savedUser && token) {
      try {
        const u: User = JSON.parse(savedUser);
        setCurrentUser(u);
        if (u.role === 'OWNER') {
          setCurrentView('owner');
        } else if (u.role === 'TENANT') {
          setCurrentView('tenant');
        } else {
          setCurrentView('public');
        }
      } catch (e) {
        localStorage.removeItem('tro_user');
        localStorage.removeItem('tro_token');
        setCurrentView('public');
      }
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (user: User, token: string) => {
    closeLogin();
    setCurrentUser(user);
    if (user.role === 'OWNER') {
      setCurrentView('owner');
      setOwnerActiveTab('dashboard');
    } else {
      setCurrentView('tenant');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tro_user');
    localStorage.removeItem('tro_token');
    setCurrentUser(null);
    setCurrentView('public');
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-teal-400 font-bold text-sm">
        Đang khởi động hệ thống quản lý phòng trọ SmartTro Pro...
      </div>
    );
  }

  // 1. GIAO DIỆN CÔNG KHAI (PUBLIC PORTAL)
  if (currentView === 'public') {
    return (
      <>
        <PublicPortal
          accountLabel={currentUser ? 'Về trang quản trị' : 'Đăng nhập'}
          onGoToLogin={() => currentUser?.role === 'OWNER' ? setCurrentView('owner') : setShowLogin(true)}
        />
        {showLogin && <LoginPage onLoginSuccess={handleLoginSuccess} onClose={closeLogin} />}
      </>
    );
  }

  // 3. CỔNG DÀNH RIÊNG CHO NGƯỜI THUÊ TRỌ (TENANT PORTAL)
  if (currentView === 'tenant' && currentUser) {
    return (
      <TenantPortal
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  // 4. CỔNG QUẢN TRỊ CHỦ NHÀ (OWNER PORTAL VỚI SIDEBAR BÊN TRÁI)
  if (currentView === 'owner' && currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
        {/* Left Sidebar */}
        <OwnerSidebar
          currentUser={currentUser}
          activeTab={ownerActiveTab}
          setActiveTab={setOwnerActiveTab}
          onLogout={handleLogout}
          onViewPublic={() => setCurrentView('public')}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto max-h-screen">
          {ownerActiveTab === 'dashboard' && (
            <DashboardView onNavigateTab={(tab) => setOwnerActiveTab(tab)} />
          )}

          {ownerActiveTab === 'rooms' && (
            <RoomsView
              onSelectRoomForContract={(roomId) => {
                setPrefilledContract({ roomId });
                setOwnerActiveTab('contracts');
              }}
            />
          )}

          {ownerActiveTab === 'tenants' && <TenantsView />}

          {ownerActiveTab === 'contracts' && (
            <ContractsView
              initialTenantId={prefilledContract.tenantId}
              initialRoomId={prefilledContract.roomId}
            />
          )}

          {ownerActiveTab === 'billing' && <BillingView />}

          {ownerActiveTab === 'appointments' && (
            <AppointmentsView
              onConvertToContract={(tenantId, roomId) => {
                setPrefilledContract({ tenantId, roomId });
                setOwnerActiveTab('contracts');
              }}
            />
          )}

          {ownerActiveTab === 'maintenance' && <MaintenanceView />}

          {ownerActiveTab === 'notifications' && <NotificationsView />}

          {ownerActiveTab === 'reports' && <ReportsView />}
        </main>
      </div>
    );
  }

  return null;
}

export default App;
