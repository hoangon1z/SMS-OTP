import { useState, useEffect } from 'react';
import { Service, Country, Rental, Transaction, UserProfile } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import DashboardView from './components/DashboardView';
import HistoryView from './components/HistoryView';
import WalletView from './components/WalletView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ProfileView from './components/ProfileView';
import AdminView from './components/AdminView';
import SupportView from './components/SupportView';
import { Bell, CheckCircle, AlertCircle, RefreshCw, ArrowRight, User, History, Wallet, Shield, LogOut, ChevronDown, MessageSquare } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warn';
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/history') return 'history';
    if (path === '/wallet') return 'wallet';
    if (path === '/profile') return 'profile';
    if (path === '/admin') return 'admin';
    if (path === '/support') return 'support';
    return 'home';
  };
  const currentTab = getCurrentTab();

  const setCurrentTab = (tab: string) => {
    if (tab === 'home') navigate('/');
    else navigate('/' + tab);
  };

  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [services, setServices] = useState<Service[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [activeRentals, setActiveRentals] = useState<Rental[]>([]);
  const [history, setHistory] = useState<Rental[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    balance: 0,
    apiKey: '',
    is2FAEnabled: false,
    level: 'Thành viên'
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(!localStorage.getItem('token'));
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [supportLink, setSupportLink] = useState<string>('https://t.me/your_telegram_support');

  // Function to add toast prompts
  const addToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const fetchUserData = async () => {
    try {
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserProfile(profile);
      }
      const txsRes = await fetch('/api/transactions');
      if (txsRes.ok) {
        const txs = await txsRes.json();
        setTransactions(txs);
      }
      const historyRes = await fetch('/api/rentals/history');
      if (historyRes.ok) {
        const hist = await historyRes.json();
        // Áp dụng định dạng hiển thị tương thích
        const mappedHist = hist.map((h: any) => ({
          ...h,
          countryName: h.networkName || 'Tự động'
        }));
        setHistory(mappedHist);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setProfileLoaded(true);
    }
  };

  const fetchActiveRentals = async () => {
    try {
      const activeRes = await fetch('/api/rentals/active');
      if (activeRes.ok) {
        const active = await activeRes.json();
        // Đồng bộ và map networkName thành countryName để khớp với component props
        const mappedActive = active.map((a: any) => ({
          ...a,
          countryName: a.networkName || 'Tự động'
        }));

        // Kiểm tra xem có OTP mới xuất hiện hay không để hiển thị Toast thông báo
        active.forEach((newRental: any) => {
          const oldRental = activeRentals.find(o => o.id === newRental.id);
          if (newRental.status === 'received' && (!oldRental || oldRental.status === 'waiting')) {
            addToast(
              `[Tin nhắn SMS] Nhận mã OTP mới cho dịch vụ ${newRental.serviceName}: ${newRental.otpCode}`,
              'success'
            );
          }
        });

        setActiveRentals(mappedActive);
      }
    } catch (error) {
      console.error('Error fetching active rentals:', error);
    }
  };

  // Live Core Timer Loop (Smooth Local Tick)
  useEffect(() => {
    if (activeRentals.length === 0) return;

    const interval = setInterval(() => {
      setActiveRentals((prevRentals) => {
        return prevRentals
          .map((rental) => {
            const nextTime = Math.max(0, rental.timeLeft - 1);
            return {
              ...rental,
              timeLeft: nextTime,
            };
          })
          .filter((rental) => rental.timeLeft > 0 || rental.status === 'received');
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRentals.length]);

  // Listen for unauthorized events to trigger logout
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUserProfile({
        name: '',
        email: '',
        balance: 0,
        apiKey: '',
        is2FAEnabled: false,
        level: 'Thành viên'
      });
      setProfileLoaded(true);
      addToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'warn');
      navigate('/login');
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  // Initial setup for public resources
  useEffect(() => {
    const init = async () => {
      try {
        const servicesRes = await fetch('/api/services');
        if (servicesRes.ok) {
          const s = await servicesRes.json();
          setServices(s);
        }
        const networksRes = await fetch('/api/networks');
        if (networksRes.ok) {
          const nets = await networksRes.json();
          // Map nhà mạng thành đối tượng Country tương thích giao diện
          const mappedNets = nets.map((n: any) => ({
            id: n.id,
            name: n.name,
            code: n.code,
            flagCode: '📶'
          }));
          setCountries(mappedNets);
        }
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const cfg = await configRes.json();
          if (cfg.supportLink) {
            setSupportLink(cfg.supportLink);
          }
        }
      } catch (error) {
        console.error('Error initializing services/networks:', error);
      }
    };

    init();
  }, []);

  // Polling setup for active user session
  useEffect(() => {
    if (!token) return;

    fetchUserData();
    fetchActiveRentals();

    const pollInterval = setInterval(() => {
      fetchActiveRentals();
      fetchUserData();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [token]);

  // Rent active phone numbers action
  const rentNumber = async (service: Service, country: Country) => {
    if (userProfile.balance < service.price) {
      addToast('Mức số dư tài khoản không đủ để thuê số này! Vui lòng nạp thêm tiền.', 'warn');
      setCurrentTab('wallet');
      return;
    }

    try {
      const res = await fetch('/api/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          networkId: country.id === 'auto' ? undefined : country.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        addToast(data.error || 'Không thể lấy số lúc này, vui lòng thử lại!', 'warn');
        return;
      }

      const newRental = await res.json();
      const mappedRental = {
        ...newRental,
        countryName: newRental.networkName || 'Tự động'
      };

      setActiveRentals((prev) => [mappedRental, ...prev]);
      addToast(`Thuê số thành công! Vui lòng chờ SMS.`, 'success');

      fetchUserData();
    } catch (error) {
      console.error('Error renting number:', error);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    }
  };

  // Refund / Cancel active renting
  const cancelRental = async (id: string) => {
    try {
      const res = await fetch(`/api/rentals/${id}/cancel`, {
        method: 'POST'
      });

      if (res.ok) {
        addToast('Đã hủy số kích hoạt và hoàn trả số dư thành công!', 'info');
        setActiveRentals((prev) => prev.filter((r) => r.id !== id));
        fetchUserData();
      } else {
        const data = await res.json();
        addToast(data.error || 'Hủy số thất bại.', 'warn');
      }
    } catch (error) {
      console.error('Error canceling rental:', error);
      addToast('Lỗi kết nối tới máy chủ.', 'warn');
    }
  };

  // Complete rental
  const completeRental = async (id: string) => {
    try {
      const res = await fetch(`/api/rentals/${id}/complete`, {
        method: 'POST'
      });

      if (res.ok) {
        addToast('Giao dịch thuê mã OTP hoàn tất thành công!', 'success');
        setActiveRentals((prev) => prev.filter((r) => r.id !== id));
        fetchUserData();
      }
    } catch (error) {
      console.error('Error completing rental:', error);
    }
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Bảng điều khiển';
      case 'history':
        return 'Lịch sử';
      case 'wallet':
        return 'Hồ sơ tài khoản';
      default:
        return 'Trang chủ';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUserProfile({
      name: '',
      email: '',
      balance: 0,
      apiKey: '',
      is2FAEnabled: false,
      level: 'Thành viên'
    });
    setProfileLoaded(true);
    addToast('Đã đăng xuất tài khoản thành công.', 'info');
    navigate('/');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const useDashboardLayout = token &&
    location.pathname !== '/' &&
    location.pathname !== '/login' &&
    location.pathname !== '/register';

  if (token && !profileLoaded) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[#0047ab]" size={36} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-800 flex flex-col font-sans">
      {useDashboardLayout && (
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          balance={userProfile.balance}
          isAuthenticated={!!token}
          userRole={userProfile.role}
          triggerLogout={handleLogout}
          triggerDeposit={() => {
            navigate('/wallet');
            addToast('Chọn phương thức nạp tiền bên dưới để tiến hành nạp ví!', 'info');
          }}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen ${useDashboardLayout ? 'md:ml-64' : ''}`}>
        {/* Landing Page Header */}
        {location.pathname === '/' && (
          <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-black text-[#00327d] text-xl tracking-tight">SMSVN</span>
                {/* <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-[#0047ab] rounded">
                  v1.2.0
                </span> */}
              </div>
              <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
                <a href="#features" className="hover:text-[#0047ab] transition-colors">Tính năng</a>
                <a href="#pricing" className="hover:text-[#0047ab] transition-colors">Bảng giá</a>
                <a href="#about" className="hover:text-[#0047ab] transition-colors">Hạ tầng</a>
              </div>
              <div className="flex items-center gap-3">
                {token ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-[#0047ab] hover:bg-[#00327d] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    Vào Bảng điều khiển
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="text-slate-600 hover:text-slate-900 text-xs font-bold px-4 py-2 cursor-pointer"
                    >
                      Đăng nhập
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="bg-[#0047ab] hover:bg-[#00327d] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Đăng ký ngay
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>
        )}

        {useDashboardLayout && (
          /* Top App Header (Mobile Navigation Support & Notifications) */
          <header className="bg-white border-b border-slate-200 h-16 px-6 sticky top-0 flex items-center justify-between z-30 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#00327d] text-lg md:hidden">SMSVN</span>
              <span className="hidden md:inline text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                Cổng thuê SIM: <span className="text-green-600 font-bold">142 Trực tuyến</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => addToast('Hệ thống hoạt động bình thường, không có thông báo mới.', 'info')}
                className="p-2 hover:bg-slate-50 text-slate-500 rounded-full transition-colors relative"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {token ? (
                /* User widget profile trigger with dropdown */
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer text-left focus:outline-none"
                  >
                    <div className="w-7 h-7 bg-[#0047ab] text-white flex items-center justify-center rounded-full font-sans font-black text-xs uppercase flex-shrink-0">
                      {userProfile.name ? userProfile.name.slice(0, 2) : 'US'}
                    </div>
                    <div className="hidden sm:block min-w-[70px]">
                      <p className="text-xs font-bold leading-none truncate max-w-[100px]">{userProfile.name}</p>
                      <p className="text-[9px] text-[#0047ab] font-bold mt-0.5 uppercase tracking-wider">
                        {userProfile.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                      </p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Overlay backdrop to close when click outside */}
                  {profileDropdownOpen && (
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setProfileDropdownOpen(false)}
                    ></div>
                  )}

                  {/* Dropdown menu panel */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-scale-up text-xs font-semibold text-slate-600">
                      {/* User Header Summary */}
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-800 truncate">{userProfile.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{userProfile.email}</p>
                      </div>

                      {/* Menu links */}
                      <div className="p-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            navigate('/profile');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer text-left"
                        >
                          <User size={14} className="text-slate-400" />
                          Hồ sơ cá nhân
                        </button>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            navigate('/history');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer text-left"
                        >
                          <History size={14} className="text-slate-400" />
                          Lịch sử nhận mã
                        </button>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            navigate('/wallet');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer text-left"
                        >
                          <Wallet size={14} className="text-slate-400" />
                          Ví tiền & Nạp tiền
                        </button>

                        {userProfile.role === 'admin' && (
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              navigate('/admin');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-[#0047ab] hover:bg-blue-50/40 transition-all cursor-pointer text-left text-slate-600 font-bold"
                          >
                            <Shield size={14} className="text-[#0047ab]" />
                            Quản trị hệ thống
                          </button>
                        )}
                      </div>

                      {/* Logout Action */}
                      <div className="border-t border-slate-100 p-1 mt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-all cursor-pointer text-left"
                        >
                          <LogOut size={14} className="text-red-500" />
                          Đăng xuất tài khoản
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#0047ab] hover:bg-[#00327d] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </header>
        )}

        {/* Dynamic Views Rendering Area */}
        <main className={`flex-1 w-full ${useDashboardLayout ? 'p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-24 md:pb-12' : (isAuthPage ? '' : 'p-6 md:p-8 max-w-6xl mx-auto space-y-8')}`}>
          <Routes>
            <Route path="/" element={<HomeView onStartClicked={() => navigate(token ? '/dashboard' : '/login')} />} />

            <Route path="/login" element={
              token ? <Navigate to="/dashboard" replace /> : (
                <LoginView
                  onLoginSuccess={(newToken, newUser) => {
                    localStorage.setItem('token', newToken);
                    setToken(newToken);
                    setUserProfile(newToken ? newUser : { name: '', email: '', balance: 0, apiKey: '', is2FAEnabled: false, level: 'Thành viên' });
                    setProfileLoaded(true);
                    navigate('/dashboard');
                  }}
                  addToast={addToast}
                  onSwitchToRegister={() => navigate('/register')}
                />
              )
            } />

            <Route path="/register" element={
              token ? <Navigate to="/dashboard" replace /> : (
                <RegisterView
                  onRegisterSuccess={(newToken, newUser) => {
                    localStorage.setItem('token', newToken);
                    setToken(newToken);
                    setUserProfile(newToken ? newUser : { name: '', email: '', balance: 0, apiKey: '', is2FAEnabled: false, level: 'Thành viên' });
                    setProfileLoaded(true);
                    navigate('/dashboard');
                  }}
                  addToast={addToast}
                  onSwitchToLogin={() => navigate('/login')}
                />
              )
            } />

            {/* Protected Routes Wrapper */}
            <Route element={token ? <Outlet /> : <Navigate to="/login" replace />}>
              <Route path="/dashboard" element={
                <DashboardView
                  services={services}
                  countries={countries}
                  balance={userProfile.balance}
                  rentNumber={rentNumber}
                  activeRentals={activeRentals}
                  cancelRental={cancelRental}
                  completeRental={completeRental}
                />
              } />

              <Route path="/history" element={<HistoryView history={history} />} />

              <Route path="/wallet" element={
                <WalletView
                  balance={userProfile.balance}
                  transactions={transactions}
                  addToast={addToast}
                  refreshUserData={fetchUserData}
                />
              } />

              <Route path="/profile" element={
                <ProfileView
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  addToast={addToast}
                />
              } />

              <Route path="/support" element={<SupportView />} />

              <Route path="/admin" element={
                userProfile.role === 'admin' ? (
                  <AdminView
                    userProfile={userProfile}
                    addToast={addToast}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } />
            </Route>

            {/* Fallback to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {!isAuthPage && (
          /* Global Footer */
          <footer className="bg-white border-t border-slate-200 w-full py-6 mt-auto">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#00327d] text-sm">SMSVN</span>
                <span>•</span>
                <p>© 2026 SMSVN. Bảo lưu mọi quyền.</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <span className="hover:text-[#0047ab] cursor-pointer">Điều khoản dịch vụ</span>
                <span className="hover:text-[#0047ab] cursor-pointer">Chính sách bảo mật</span>
                <span className="hover:text-[#0047ab] cursor-pointer">Tài liệu API</span>
                <span onClick={() => window.open(supportLink, '_blank')} className="hover:text-[#0047ab] cursor-pointer">Liên hệ hỗ trợ</span>
              </div>
            </div>
          </footer>
        )}
      </div>

      {useDashboardLayout && (
        /* Bottom Nav - Mobile Layout only */
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} isAuthenticated={!!token} userRole={userProfile.role} />
      )}

      {/* Floating UI system toast alerts floating overlay */}
      <div className="fixed bottom-24 md:bottom-28 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-slide-up pointer-events-auto bg-slate-900 border-slate-800 text-white`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
            ) : toast.type === 'warn' ? (
              <AlertCircle className="text-yellow-500 flex-shrink-0" size={18} />
            ) : (
              <CheckCircle className="text-blue-400 flex-shrink-0" size={18} />
            )}
            <p className="text-xs font-sans font-semibold leading-relaxed leading-normal">
              {toast.message}
            </p>
          </div>
        ))}
      </div>

      {/* Floating support link widget */}
      <a
        href={supportLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 right-6 bg-[#0047ab] hover:bg-[#00327d] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 z-40 group border border-blue-400/20"
        title="Liên hệ hỗ trợ"
      >
        <div className="relative flex items-center justify-center">
          <MessageSquare className="w-5 h-5 stroke-[2.5px]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white animate-pulse"></span>
        </div>
        
        {/* Hover tooltips */}
        <span className="absolute right-14 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mr-2 border border-slate-800">
          Hỗ trợ trực tuyến
        </span>
      </a>
    </div>
  );
}
