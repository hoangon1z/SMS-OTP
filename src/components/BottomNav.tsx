import { Smartphone, LayoutDashboard, History, Wallet, User, LogIn, UserPlus, Shield } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAuthenticated?: boolean;
  userRole?: string;
}

export default function BottomNav({ currentTab, setCurrentTab, isAuthenticated = false, userRole }: BottomNavProps) {
  const navItems = isAuthenticated
    ? [
        { id: 'home', label: 'Trang chủ', icon: Smartphone },
        { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
        { id: 'history', label: 'Lịch sử', icon: History },
        { id: 'wallet', label: 'Ví tiền', icon: Wallet },
        { id: 'profile', label: 'Hồ sơ', icon: User },
        ...(userRole === 'admin' ? [{ id: 'admin', label: 'Quản trị', icon: Shield }] : []),
      ]
    : [
        { id: 'home', label: 'Trang chủ', icon: Smartphone },
        { id: 'login', label: 'Đăng nhập', icon: LogIn },
        { id: 'register', label: 'Đăng ký', icon: UserPlus },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-50 flex items-center justify-around md:hidden px-2 shadow-sm">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-all"
          >
            <div
              className={`flex items-center justify-center px-3 py-1 rounded-full ${
                isActive ? 'bg-[#d5e3fd] text-[#00327d]' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} className={isActive ? 'stroke-[2.5px]' : ''} />
            </div>
            <span
              className={`text-[9px] tracking-tight mt-0.5 font-sans truncate ${
                isActive ? 'text-[#0047ab] font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
