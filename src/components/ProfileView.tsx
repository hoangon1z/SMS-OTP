import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  User,
  Shield,
  RefreshCw,
  EyeOff,
  Eye,
  Copy,
  Lock,
} from 'lucide-react';

interface ProfileViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  addToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export default function ProfileView({
  userProfile,
  setUserProfile,
  addToast,
}: ProfileViewProps) {
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rotatedKey, setRotatedKey] = useState(false);

  // 2FA toggle simulation
  const handle2FAToggle = () => {
    setUserProfile((prev) => {
      const nextVal = !prev.is2FAEnabled;
      addToast(nextVal ? 'Đã bật bảo mật 2FA thành công!' : 'Đã tắt bảo mật 2FA.', 'success');
      return {
        ...prev,
        is2FAEnabled: nextVal,
      };
    });
  };

  // API rotation integration
  const handleRotateAPIKey = async () => {
    setRotatedKey(true);
    try {
      const res = await fetch('/api/user/rotate-api-key', {
        method: 'POST'
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        setUserProfile(updatedProfile);
        addToast('Làm mới khóa API thành công! Hãy lưu lại khóa mới.', 'success');
      } else {
        addToast('Không thể làm mới khóa API.', 'warn');
      }
    } catch (error) {
      console.error(error);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    } finally {
      setTimeout(() => setRotatedKey(false), 1000);
    }
  };

  // Password change simulation
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      addToast('Vui lòng điền đầy đủ thông tin mật khẩu.', 'warn');
      return;
    }
    setPasswordModalOpen(false);
    setOldPassword('');
    setNewPassword('');
    addToast('Đã thay đổi mật khẩu tài khoản thành công!', 'success');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`Đã sao chép ${label} vào bộ nhớ tạm!`, 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hồ sơ &amp; Bảo mật</h2>
        <p className="text-slate-500 text-sm mt-1">
          Cập nhật cấu hình bảo mật tài khoản, đổi mật khẩu và quản lý API Key phục vụ tích hợp MMO.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Profile overview card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-[#d5e3fd] text-[#0047ab] rounded-xl flex items-center justify-center relative">
                <User size={32} className="stroke-[2px]" />
                <div
                  className="absolute bottom-[-2px] right-[-2px] h-4 w-4 bg-green-500 border-2 border-white rounded-full"
                  title="Đang hoạt động"
                ></div>
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">{userProfile.name || 'Người dùng'}</h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">{userProfile.email || 'email@example.com'}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400 font-semibold mb-0.5">Cấp độ tài khoản</p>
                <p className="text-[#0047ab] font-bold">{userProfile.level || 'Thành viên'}</p>
              </div>
              <span className="text-xs font-bold text-[#0047ab] bg-blue-100/60 p-2 rounded-lg">PRO</span>
            </div>
          </div>
        </div>

        {/* Security details settings */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-[#0047ab] uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} />
              CÀI ĐẶT BẢO MẬT HỆ THỐNG
            </h4>

            <div className="space-y-4 text-xs font-medium text-slate-600">
              {/* 2FA switcher */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Xác thực 2 yếu tố (2FA)</p>
                  <p className="text-slate-400 mt-0.5 text-[11px]">Tăng cường tối đa bảo mật tài khoản</p>
                </div>
                <button
                  onClick={handle2FAToggle}
                  className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${
                    userProfile.is2FAEnabled ? 'bg-[#0047ab] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-5 h-5 rounded-full shadow-sm transition-all"></span>
                </button>
              </div>

              {/* API credentials refresh block */}
              <div className="py-2 border-b border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Khóa API tích hợp (reseller)</p>
                    <p className="text-slate-400 mt-0.5 text-[11px]">Sử dụng cho MMO bot hoặc tool tự động</p>
                  </div>
                  <button
                    onClick={handleRotateAPIKey}
                    className={`text-[#0047ab] hover:text-[#00327d] italic text-xs flex items-center gap-1 cursor-pointer ${
                      rotatedKey ? 'animate-spin' : ''
                    }`}
                  >
                    <RefreshCw size={14} />
                    Làm mới
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                  <span className="font-mono text-[10px] break-all select-all flex-1">
                    {apiKeyVisible ? userProfile.apiKey : '• • • • • • • • • • • • • • • • • • • • • • • •'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {apiKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(userProfile.apiKey, 'Khóa API')}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Password change panel */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Mật khẩu đăng nhập</p>
                  <p className="text-slate-400 mt-0.5 text-[11px]">Định kỳ thay đổi để tránh rò rỉ</p>
                </div>
                <button
                  onClick={() => setPasswordModalOpen(true)}
                  className="text-[#0047ab] hover:text-[#00327d] bg-blue-50 hover:bg-blue-100 h-8 px-4 font-bold rounded-lg uppercase tracking-wide transition-all cursor-pointer"
                >
                  Thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal Simulation */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handlePasswordChange}
            className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-scale-up"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Lock className="text-[#0047ab]" size={20} />
              <h3 className="text-base font-bold text-slate-800">Thay đổi mật khẩu</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cũ..."
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bg-[#0047ab] hover:bg-[#00327d] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Lưu lại
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
