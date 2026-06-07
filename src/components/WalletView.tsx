import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  CreditCard,
  Copy,
  Check,
  X,
  Loader,
  AlertCircle,
} from 'lucide-react';

interface WalletViewProps {
  balance: number;
  transactions: Transaction[];
  addToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
  refreshUserData?: () => Promise<void>;
}

export default function WalletView({
  balance,
  transactions,
  addToast,
  refreshUserData,
}: WalletViewProps) {
  const [usdtModalOpen, setUsdtModalOpen] = useState(false);
  const [usdtInfo, setUsdtInfo] = useState({
    usdtAddress: '',
    usdtNetwork: 'TRC20',
    usdtRate: 25000,
  });
  const [usdtInfoLoading, setUsdtInfoLoading] = useState(false);
  const [amountUsdt, setAmountUsdt] = useState('');
  const [txid, setTxid] = useState('');
  const [usdtSubmitting, setUsdtSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [vietqrModalOpen, setVietqrModalOpen] = useState(false);
  const [vietqrInfo, setVietqrInfo] = useState<{
    qrCode: string;
    bankName: string;
    bankAccount: string;
    bankOwner: string;
    description: string;
    amount: number;
    orderCode: number;
    method?: string;
  } | null>(null);
  const [customDepositAmount, setCustomDepositAmount] = useState('');

  // Hiệu ứng Polling tự động quét trạng thái hóa đơn của PayOS để đóng modal và cộng tiền ngay khi chuyển khoản xong
  useEffect(() => {
    let intervalId: any;
    if (vietqrModalOpen && vietqrInfo && vietqrInfo.method === 'PayOS') {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/payment/status/${vietqrInfo.orderCode}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'completed') {
              addToast(`Nạp tiền thành công! +${vietqrInfo.amount.toLocaleString('vi-VN')} VNĐ đã được cộng vào tài khoản.`, 'success');
              setVietqrModalOpen(false);
              setVietqrInfo(null);
              if (refreshUserData) {
                await refreshUserData();
              }
            }
          }
        } catch (err) {
          console.error('Lỗi khi kiểm tra trạng thái nạp tiền:', err);
        }
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [vietqrModalOpen, vietqrInfo]);

  useEffect(() => {
    if (usdtModalOpen) {
      const fetchUsdtInfo = async () => {
        setUsdtInfoLoading(true);
        try {
          const res = await fetch('/api/payment/usdt-info');
          if (res.ok) {
            const data = await res.json();
            setUsdtInfo(data);
          } else {
            addToast('Không thể tải cấu hình USDT từ máy chủ.');
          }
        } catch (err) {
          console.error(err);
          addToast('Lỗi kết nối khi tải cấu hình USDT.');
        } finally {
          setUsdtInfoLoading(false);
        }
      };
      fetchUsdtInfo();
    }
  }, [usdtModalOpen]);

  const handleCopyAddress = () => {
    if (!usdtInfo.usdtAddress) return;
    navigator.clipboard.writeText(usdtInfo.usdtAddress);
    setCopied(true);
    addToast('Đã sao chép địa chỉ ví USDT!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUsdtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(amountUsdt);
    if (isNaN(amountNum) || amountNum <= 0) {
      addToast('Vui lòng nhập số tiền USDT hợp lệ.');
      return;
    }
    if (!txid.trim()) {
      addToast('Vui lòng cung cấp mã giao dịch TxID.');
      return;
    }

    setUsdtSubmitting(true);
    try {
      const res = await fetch('/api/payment/usdt-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUsdt: amountNum,
          txid: txid.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Yêu cầu nạp USDT của bạn đã được gửi thành công!');
        setUsdtModalOpen(false);
        setAmountUsdt('');
        setTxid('');
      } else {
        addToast(data.error || 'Gửi yêu cầu nạp USDT thất bại.');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.');
    } finally {
      setUsdtSubmitting(false);
    }
  };
  // Fast recharge options
  const rechargePresets = [
    { label: '200k', value: 200000 },
    { label: '500k', value: 500000 },
    { label: '1Tr', value: 1000000 },
    { label: '2Tr', value: 2000000 },
  ];

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handlePresetDeposit = async (amount: number) => {
    try {
      addToast(`Đang khởi tạo hóa đơn thanh toán cho số tiền ${formatVND(amount)}...`);
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      if (!res.ok) {
        const data = await res.json();
        addToast(data.error || 'Khởi tạo hóa đơn thanh toán thất bại.');
        return;
      }

      const paymentData = await res.json();
      // Cho cả PayOS và VietQR thủ công, ta hiển thị cùng một Modal bản địa
      setVietqrInfo({
        qrCode: paymentData.qrCode,
        bankName: paymentData.bankName,
        bankAccount: paymentData.bankAccount,
        bankOwner: paymentData.bankOwner,
        description: paymentData.description,
        amount: paymentData.amount,
        orderCode: paymentData.orderCode,
        method: paymentData.method,
      });
      setVietqrModalOpen(true);
    } catch (error) {
      console.error('Error creating payment:', error);
      addToast('Không thể kết nối đến máy chủ.');
    }
  };

  const handleCustomDeposit = () => {
    const amount = Number(customDepositAmount);
    if (isNaN(amount) || amount < 2000) {
      addToast('Số tiền nạp tối thiểu là 2.000 VNĐ.');
      return;
    }
    handlePresetDeposit(amount);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ví tiền &amp; Nạp tiền</h2>
        <p className="text-slate-500 text-sm mt-1">
          Nạp tiền trực tuyến an toàn qua VietQR và xem lịch sử giao dịch chi tiết.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main column: balance, deposit presets, transactions history */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Balance Box */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                SỐ DƯ KHẢ DỤNG
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-extrabold text-[#0047ab] tracking-tight">
                  {balance.toLocaleString('vi-VN')}
                </span>
                <span className="text-sm font-bold text-slate-500">VNĐ</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200 uppercase tracking-wider">
                Đã Xác Minh
              </span>
            </div>
          </div>

          {/* Rapid Refill Preset buttons */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0047ab] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Wallet size={14} />
              NẠP NHANH VÍ TÀI KHOẢN
            </h3>
            <p className="text-slate-500 text-xs">
              Chọn mức tiền nạp dưới đây để tạo liên kết thanh toán chuyển khoản VietQR nhanh:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {rechargePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetDeposit(preset.value)}
                  className="flex flex-col items-center justify-center py-4 px-3 border border-slate-200 rounded-xl font-extrabold text-[#0047ab] bg-white hover:bg-slate-50 hover:border-[#0047ab] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <span className="text-base">{preset.label}</span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1">
                    +{preset.value.toLocaleString('vi-VN')}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Hoặc nhập số tiền tùy chọn (Tối thiểu 2.000đ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="2000"
                    placeholder="Nhập số tiền VNĐ..."
                    value={customDepositAmount}
                    onChange={(e) => setCustomDepositAmount(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">VNĐ</span>
                </div>
              </div>
              <button
                onClick={handleCustomDeposit}
                className="w-full sm:w-auto bg-[#0047ab] hover:bg-[#00327d] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-[0.98] self-stretch sm:self-auto flex items-center justify-center font-bold"
              >
                Tạo mã VietQR
              </button>
            </div>
          </div>

          {/* Quick options: Crypto cards & Bank transfers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Crypto Card */}
            <div
              onClick={() => setUsdtModalOpen(true)}
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#0047ab] transition-all cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-[#0047ab] group-hover:bg-[#d5e3fd]/20">
                <span className="text-xl font-bold font-sans">₮</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Nạp Tiền Điện Tử (USDT)</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Nạp tiền qua ví điện tử USDT (mạng TRC20). Hệ thống quy đổi tự động và được duyệt thủ công bởi quản trị viên.
              </p>
              <div className="text-xs font-bold text-[#0047ab] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Nạp USDT ngay →
              </div>
            </div>

            {/* Bank Card */}
            <div
              onClick={() => handlePresetDeposit(1000000)}
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-[#0047ab] transition-all cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-[#0047ab] group-hover:bg-[#d5e3fd]/20">
                <CreditCard size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Chuyển Khoản Ngân Hàng VietQR</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Thanh toán an toàn, quét mã QR từ bất kỳ ứng dụng ngân hàng nào. Bấm để tạo liên kết nạp nhanh +1.000.000 VNĐ.
              </p>
              <div className="text-xs font-bold text-[#0047ab] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Thanh toán VietQR →
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Transaction logs history */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-sm font-bold text-slate-800">Lịch sử giao dịch</h3>
              <span className="text-xs text-slate-400 font-medium">Chi tiêu gần đây</span>
            </div>

            <div className="divide-y divide-slate-100 text-sm max-h-[400px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">Chưa có giao dịch nào được thực hiện.</div>
              ) : (
                transactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isDeposit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {isDeposit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate" title={tx.description}>{tx.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {tx.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`font-bold text-xs ${isDeposit ? 'text-green-700' : 'text-slate-700'}`}>
                          {isDeposit ? '+' : ''}
                          {tx.amount.toLocaleString('vi-VN')}
                        </p>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-green-600 uppercase tracking-wider mt-0.5">
                          <CheckCircle size={8} />
                          Thành công
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* USDT Manual Deposit Modal */}
      {usdtModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl animate-scale-up relative">
            <button
              onClick={() => {
                setUsdtModalOpen(false);
                setAmountUsdt('');
                setTxid('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 bg-blue-50 text-[#0047ab] rounded-xl flex items-center justify-center font-bold text-lg">₮</div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Nạp USDT (TRC20)</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Hỗ trợ mạng lưới TRON (TRC20)</p>
              </div>
            </div>

            {usdtInfoLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader className="animate-spin text-[#0047ab]" size={28} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang tải thông tin ví...</p>
              </div>
            ) : (
              <form onSubmit={handleUsdtSubmit} className="space-y-4">
                <div className="space-y-3.5">
                  {/* Address Box */}
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Địa chỉ ví nhận</span>
                      <span className="text-[#0047ab] bg-blue-50 px-1.5 py-0.5 rounded">{usdtInfo.usdtNetwork}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-white border border-slate-200/80 p-2.5 rounded-lg">
                      <span className="font-mono text-xs text-slate-700 font-bold select-all break-all pr-2">
                        {usdtInfo.usdtAddress || 'Chưa cấu hình địa chỉ ví'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="flex-shrink-0 p-1.5 text-slate-500 hover:text-[#0047ab] hover:bg-slate-50 border border-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Copy địa chỉ ví"
                      >
                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Rate display */}
                  <div className="flex justify-between items-center text-xs font-bold bg-blue-50/50 border border-blue-100/60 p-3 rounded-xl text-slate-700">
                    <span className="text-slate-400">Tỷ giá nạp ví:</span>
                    <span className="text-[#0047ab]">1 USDT = {usdtInfo.usdtRate.toLocaleString('vi-VN')} VNĐ</span>
                  </div>

                  {/* Amount input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Số tiền muốn nạp (USDT)
                    </label>
                    <input
                      type="number"
                      required
                      step="any"
                      min="0.01"
                      value={amountUsdt}
                      onChange={(e) => setAmountUsdt(e.target.value)}
                      placeholder="Ví dụ: 10 hoặc 100"
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                    />
                    {amountUsdt && !isNaN(Number(amountUsdt)) && (
                      <span className="text-[11px] text-green-700 font-bold block mt-1">
                        Sẽ nhận được: {(Number(amountUsdt) * usdtInfo.usdtRate).toLocaleString('vi-VN')} VNĐ
                      </span>
                    )}
                  </div>

                  {/* TxID hash input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Mã băm giao dịch (TxID / Transaction Hash)
                    </label>
                    <input
                      type="text"
                      required
                      value={txid}
                      onChange={(e) => setTxid(e.target.value)}
                      placeholder="Điền mã TxID sau khi chuyển khoản..."
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab] font-mono"
                    />
                  </div>

                  {/* Warning Box */}
                  <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl text-[10px] text-yellow-800 leading-normal flex gap-2">
                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={14} />
                    <div>
                      <span className="font-bold">Lưu ý quan trọng:</span> Chuyển đúng mạng lưới <span className="font-bold">{usdtInfo.usdtNetwork}</span>. Chuyển nhầm mạng sẽ gây mất tài sản vĩnh viễn. Giao dịch sẽ được Admin kiểm tra và duyệt sau khi nhận được tín hiệu blockchain.
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsdtModalOpen(false);
                      setAmountUsdt('');
                      setTxid('');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={usdtSubmitting}
                    className="bg-[#0047ab] hover:bg-[#00327d] text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    {usdtSubmitting && <Loader className="animate-spin" size={12} />}
                    Xác nhận đã chuyển tiền
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VietQR Native Deposit Modal (Handles both PayOS and Manual fallbacks) */}
      {vietqrModalOpen && vietqrInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl animate-scale-up relative">
            <button
              onClick={() => {
                setVietqrModalOpen(false);
                setVietqrInfo(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 bg-blue-50 text-[#0047ab] rounded-xl flex items-center justify-center font-bold text-lg">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {vietqrInfo.method === 'PayOS' ? 'Thanh toán tự động VietQR' : 'Chuyển khoản VietQR'}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {vietqrInfo.method === 'PayOS' ? 'Tự động kiểm tra & duyệt giao dịch' : 'Hỗ trợ tất cả ứng dụng Ngân hàng'}
                </p>
              </div>
            </div>

            {vietqrInfo.method === 'PayOS' && (
              <div className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50/70 border border-blue-100/60 rounded-xl text-[10px] font-bold text-[#0047ab]">
                <Loader size={12} className="animate-spin text-[#0047ab]" />
                Hệ thống đang quét giao dịch tự động...
              </div>
            )}

            <div className="flex flex-col items-center justify-center space-y-4">
              {/* VietQR Image */}
              <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm flex items-center justify-center">
                <img
                  src={
                    vietqrInfo.method === 'PayOS'
                      ? `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(vietqrInfo.qrCode)}`
                      : vietqrInfo.qrCode
                  }
                  alt="Mã QR chuyển khoản"
                  className="w-56 h-56 object-contain"
                  loading="lazy"
                />
              </div>

              <p className="text-[11px] text-slate-400 font-bold text-center uppercase tracking-wide">
                Quét mã QR để thanh toán nhanh
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Bank Details Table */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                
                {/* Bank Name */}
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400 font-medium">Ngân hàng:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{vietqrInfo.bankName}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(vietqrInfo.bankName);
                        addToast('Đã sao chép tên ngân hàng!');
                      }}
                      className="text-slate-400 hover:text-[#0047ab] cursor-pointer"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                {/* Account Number */}
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400 font-medium">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-sm">{vietqrInfo.bankAccount}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(vietqrInfo.bankAccount);
                        addToast('Đã sao chép số tài khoản!');
                      }}
                      className="text-slate-400 hover:text-[#0047ab] cursor-pointer"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                {/* Account Owner */}
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400 font-medium">Chủ tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 uppercase">{vietqrInfo.bankOwner}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(vietqrInfo.bankOwner);
                        addToast('Đã sao chép chủ tài khoản!');
                      }}
                      className="text-slate-400 hover:text-[#0047ab] cursor-pointer"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400 font-medium">Số tiền:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#0047ab] text-sm">
                      {vietqrInfo.amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(String(vietqrInfo.amount));
                        addToast('Đã sao chép số tiền!');
                      }}
                      className="text-slate-400 hover:text-[#0047ab] cursor-pointer"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                {/* Transfer Content */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-2 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                    <span className="font-mono font-bold text-red-700">{vietqrInfo.description}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(vietqrInfo.description);
                        addToast('Đã sao chép nội dung chuyển khoản!');
                      }}
                      className="text-red-700 hover:text-red-900 cursor-pointer"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Warning/Info Box */}
              <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl text-[10px] text-yellow-800 leading-normal flex gap-2">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={14} />
                <div>
                  <span className="font-bold">Lưu ý cực kỳ quan trọng:</span> Chuyển chính xác số tiền và <span className="font-bold text-red-600 underline">đúng nội dung chuyển khoản</span> phía trên để được cộng số dư. Nếu chuyển sai nội dung, giao dịch sẽ không thể xác minh tự động và xử lý rất chậm.
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              {vietqrInfo.method === 'PayOS' ? (
                <button
                  type="button"
                  onClick={() => {
                    setVietqrModalOpen(false);
                    setVietqrInfo(null);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-lg text-center cursor-pointer transition-all active:scale-[0.98]"
                >
                  Hủy giao dịch / Đóng cửa sổ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setVietqrModalOpen(false);
                    setVietqrInfo(null);
                    addToast('Yêu cầu nạp tiền đã được ghi nhận. Vui lòng chờ vài phút để quản trị viên đối soát.');
                  }}
                  className="w-full bg-[#0047ab] hover:bg-[#00327d] text-white text-xs font-bold py-2.5 rounded-lg text-center cursor-pointer transition-all active:scale-[0.98]"
                >
                  Tôi đã chuyển tiền thành công
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
