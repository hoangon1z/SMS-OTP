import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
  addToast: (message: string, type: 'success' | 'info' | 'warn') => void;
  onSwitchToRegister: () => void;
}

export default function LoginView({ onLoginSuccess, addToast, onSwitchToRegister }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công.');
      }

      addToast('Đăng nhập hệ thống thành công!', 'success');
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
      addToast(err.message || 'Đăng nhập thất bại.', 'warn');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f7f9fb] relative font-sans py-12">
      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 m-4">
        {/* Logo/Branding section */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="w-14 h-14 bg-[#0047ab] rounded-2xl flex items-center justify-center shadow-md shadow-[#0047ab]/10 mb-3 border border-slate-100">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Rent<span className="text-[#0047ab]">SMS</span>OTP
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest text-center">
            Hệ Thống Thuê Số OTP Tự Động
          </p>
        </div>

        {/* Auth Light Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-100 p-6 sm:p-8 relative">
          <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Đăng Nhập Tài Khoản</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-3.5 rounded-xl flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="name@example.com"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#0047ab] focus:ring-2 focus:ring-[#0047ab]/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl py-3 pl-11 pr-11 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#0047ab] focus:ring-2 focus:ring-[#0047ab]/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <span className="text-xs font-bold text-[#0047ab] hover:underline cursor-pointer transition-all">
                Quên mật khẩu?
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0047ab] hover:bg-[#00327d] text-white rounded-xl py-3.5 text-sm font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Đăng nhập ngay'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-semibold">
              Chương trình chưa có tài khoản?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-[#0047ab] hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>

        {/* Footer/Trust info */}
        <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-6 font-semibold">
          © 2026 SMSVN. Bảo mật mã hóa SSL 256-bit.
        </p>
      </div>
    </div>
  );
}
