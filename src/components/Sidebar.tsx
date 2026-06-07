import { LayoutDashboard, Smartphone, History, Wallet, Settings, HelpCircle, PlusCircle, LogOut, User, LogIn, UserPlus, Shield } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  balance: number;
  triggerDeposit: () => void;
  triggerLogout: () => void;
  isAuthenticated?: boolean;
  userRole?: string;
}

export default function Sidebar({ currentTab, setCurrentTab, balance, triggerDeposit, triggerLogout, isAuthenticated = false, userRole }: SidebarProps) {
  const menuItems = isAuthenticated
    ? [
      { id: 'home', label: 'Trang chủ', icon: Smartphone },
      { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
      { id: 'history', label: 'Lịch sử nhận mã', icon: History },
      { id: 'wallet', label: 'Ví tiền & Nạp tiền', icon: Wallet },
      { id: 'profile', label: 'Hồ sơ & Bảo mật', icon: User },
      ...(userRole === 'admin' ? [{ id: 'admin', label: 'Quản trị hệ thống', icon: Shield }] : []),
    ]
    : [
      { id: 'home', label: 'Trang chủ', icon: Smartphone },
      { id: 'login', label: 'Đăng nhập', icon: LogIn },
      { id: 'register', label: 'Đăng ký', icon: UserPlus },
    ];

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col justify-between py-6 fixed left-0 top-0 z-40 hidden md:flex">
      {/* Branding Header */}
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-bold font-sans text-[#00327d] tracking-tight">SMSVN.NET</h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
          {/* {isAuthenticated ? 'Tài khoản đã xác minh' : 'Chào mừng bạn'} */}
        </p>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${isActive
                  ? 'bg-[#d5e3fd] text-[#00327d]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <Icon size={18} className={isActive ? 'stroke-[2.5px]' : ''} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Controls (Actions, Balance, Settings) */}
      <div className="px-3 mt-auto space-y-4">
        {/* Rapid Balance display in sidebar */}
        {isAuthenticated ? (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Số dư hiện tại</p>
            <p className="text-lg font-bold text-slate-800 tracking-tight">{formatVND(balance)}</p>
            <button
              onClick={triggerDeposit}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-[#0047ab] text-white py-2 px-3 rounded-lg text-xs font-bold hover:bg-[#00327d] active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusCircle size={14} />
              Nạp tiền nhanh
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block text-center">Chào mừng quay trở lại</p>
            <button
              onClick={() => setCurrentTab('login')}
              className="w-full bg-[#0047ab] text-white py-2 px-3 rounded-lg text-xs font-bold hover:bg-[#00327d] active:scale-[0.98] transition-all cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        <div className="border-t border-slate-200 pt-3 space-y-1">
          <button
            onClick={() => setCurrentTab(isAuthenticated ? 'profile' : 'login')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
          >
            <Settings size={18} />
            Cài đặt bảo mật
          </button>
          <button
            onClick={() => setCurrentTab('support')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              currentTab === 'support'
                ? 'bg-[#d5e3fd] text-[#00327d]'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <HelpCircle size={18} />
            Hỗ trợ & FAQ
          </button>
          {isAuthenticated && (
            <button
              onClick={triggerLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut size={18} />
              Đăng xuất tài khoản
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
