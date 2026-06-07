import { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Zap, Shield, Globe, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';

interface HomeViewProps {
  onStartClicked: () => void;
}

export default function HomeView({ onStartClicked }: HomeViewProps) {
  const [animatedOtp, setAnimatedOtp] = useState('8 4 2 9 1 0');

  // Interactive micro-interaction for simulated real-time OTP updates
  useEffect(() => {
    const interval = setInterval(() => {
      const parts = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10));
      setAnimatedOtp(parts.join(' '));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-16 animate-fade-in pb-12">
      {/* Hero Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d5e3fd] text-[#001946] rounded-full text-xs font-semibold tracking-wide">
              <ShieldCheck size={14} className="text-[#0047ab]" />
              HẠ TẦNG SMS CẤP DOANH NGHIỆP
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
              Nhận OTP qua SMS <br />
              <span className="text-[#0047ab]">trực tuyến tức thì</span>
            </h1>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-xl">
              Truy cập mạng lưới toàn cầu gồm các SIM vật lý thực để xác minh danh tính đáng tin cậy. 
              Không số ảo, không trễ, hoàn toàn ổn định cho quy trình kỹ thuật của bạn.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onStartClicked}
                className="bg-[#0047ab] hover:bg-[#00327d] text-white px-6 py-3.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
              >
                Đăng ký &amp; Thuê số
                <ArrowRight size={16} />
              </button>
              <button
                onClick={onStartClicked}
                className="border border-[#0047ab] text-[#0047ab] hover:bg-slate-50 px-6 py-3.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all"
              >
                Xem bảng giá dịch vụ
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-xl space-y-6 relative z-10 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái hiện tại</span>
                <span className="flex items-center gap-2 text-[#0047ab] text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0047ab] animate-pulse"></span>
                  Hệ thống trực tuyến
                </span>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Simulator OTP hiển thị:</div>
                  <div className="text-2xl font-mono text-[#0047ab] font-bold tracking-[0.25em] text-center bg-slate-50 py-3 rounded border border-slate-100 transition-all duration-300">
                    {animatedOtp}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 p-4 bg-white border border-slate-200 rounded-lg text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Độ trễ TB</div>
                    <div className="text-base font-bold text-slate-800">1.4 giây</div>
                  </div>
                  <div className="flex-1 p-4 bg-white border border-slate-200 rounded-lg text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cổng hoạt động</div>
                    <div className="text-base font-bold text-slate-800">142 ports</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Hạ tầng chính xác</h2>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl">
            Hệ thống của chúng tôi được xây dựng cho độ tin cậy kỹ thuật cao. Chúng tôi loại bỏ các Proxy ảo/VoIP kém chất lượng để ưu tiên SIM phần cứng vật lý nhằm đảm bảo tỉ lệ nhận nhận tin 99.9%.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="md:col-span-2 bg-white border border-slate-200 p-8 rounded-2xl flex flex-col justify-between hover:border-[#0047ab] transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-slate-100 flex items-center justify-center rounded-lg text-[#0047ab]">
                <Zap size={24} className="stroke-[2px]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Nhận tin không độ trễ</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
                Tin nhắn được thu thập trực tiếp từ hạ tầng di động vật lý và đẩy tức thì đến bảng điều khiển trình duyệt của bạn qua WebSockets bảo mật thời gian thực.
              </p>
            </div>
            <div className="pt-8 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 font-semibold rounded-md">Truy cập API trực tiếp</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 font-semibold rounded-md">Đẩy tin WebSocket</span>
            </div>
          </div>

          <div className="bg-[#0047ab] text-white p-8 rounded-2xl flex flex-col justify-between hover:bg-opacity-95 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-[#001946]/50 flex items-center justify-center rounded-lg">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold">Vòng đời mã hóa</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Mọi tin nhắn đều được mã hóa AES-256 đầu cuối từ thiết bị phần cứng, tự động thanh trừng hoặc xóa sau 15 phút an toàn tuyệt đối.
              </p>
            </div>
            <div className="pt-8 text-xs font-semibold underline cursor-pointer">
              Tài liệu bảo mật 256-bit
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col justify-between hover:border-[#0047ab] transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-slate-100 flex items-center justify-center rounded-lg text-[#0047ab]">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Phạm vi toàn cầu</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Hỗ trợ kho số từ hơn 150 quốc gia. Có sẵn các nhà mạng chính của Mỹ, Anh, Đức, Canada giúp vượt qua mọi tường lửa vị trí địa lý.
              </p>
            </div>
            <div className="pt-8 flex flex-wrap gap-1">
              {['Mỹ', 'Anh', 'Đức', 'Canada', 'Pháp', '+146'].map((c) => (
                <span key={c} className="text-[10px] font-bold border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 bg-slate-50">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white border border-slate-200 p-8 rounded-2xl flex flex-col md:flex-row gap-6 hover:border-[#0047ab] transition-all">
            <div className="space-y-4 flex-1">
              <div className="w-12 h-12 bg-slate-100 flex items-center justify-center rounded-lg text-[#0047ab]">
                <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Kho SIM vật lý thực</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Hệ thống cam kết 100% SIM vật lý, nói không với số ảo Skype/VoIP. Được ghi nhận thành công cao tuyệt đối bởi mọi dịch vụ khắt khe nhất.
              </p>
            </div>
            <div className="flex-1 space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 text-xs text-slate-600">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span>Google Account</span>
                <span className="text-[#0047ab] font-bold">Thành công 100%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span>WhatsApp SIM</span>
                <span className="text-[#0047ab] font-bold">Thành công 100%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span>Telegram API</span>
                <span className="text-[#0047ab] font-bold">Thành công 100%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Ngân hàng &amp; Fintech</span>
                <span className="text-[#0047ab] font-bold">Thành công 98.4%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perform and Pricing Grid */}
      <section className="bg-slate-900 rounded-2xl overflow-hidden text-white grid grid-cols-1 lg:grid-cols-2">
        <div className="p-8 md:p-12 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Hiệu suất thời gian thực</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest">
                <span>HIỆU SUẤT KHẢ DỤNG</span>
                <span className="text-white">99.98%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#0047ab] rounded-full w-[99.98%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest">
                <span>TỐC ĐỘ GỬI API SMS</span>
                <span className="text-white">~42ms</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#0047ab] rounded-full w-[92%]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest">
                <span>SỐ QUỐC GIA HIỆN DIỆN</span>
                <span className="text-white">156 nước</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#0047ab] rounded-full w-[85%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 bg-slate-800/40 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-center space-y-6">
          <span className="text-xs font-bold text-[#0047ab] uppercase tracking-widest">CHÍNH SÁCH CHỈ THU PHÍ KHI THÀNH CÔNG</span>
          <h3 className="text-xl md:text-2xl font-bold">Hệ thống Minh Bạch Giá Cả</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Chúng tôi hoàn trả 100% tiền nếu cổng số điện thoại không nhận được mã SMS OTP trong vòng 15 phút. Bạn chỉ mất phí khi mã OTP hiển thị thành công.
          </p>
          <ul className="space-y-3 pt-2 text-sm text-slate-200">
            <li className="flex items-center gap-3">
              <CheckCircle size={16} className="text-[#0047ab]" />
              Không phí duy trì hay phụ phí phát sinh
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle size={16} className="text-[#0047ab]" />
              Số dư vĩnh viễn không bao giờ hết hạn
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle size={16} className="text-[#0047ab]" />
              Hỗ trợ thanh toán nhanh bằng ngân hàng &amp; Crypto
            </li>
          </ul>
        </div>
      </section>

      {/* final banner CTA */}
      <section className="bg-[#0047ab] rounded-2xl p-8 md:p-12 text-center text-white space-y-6">
        <h2 className="text-2xl md:text-4xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
          Sẵn sàng cho việc nhận mã OTP quy mô dịch vụ?
        </h2>
        <p className="text-blue-100 text-sm md:text-base max-w-xl mx-auto">
          Thuê ngay số điện thoại chất lượng cao của chúng tôi để xác thực bảo mật thông tin hoặc tự động hóa quy trình nghiệp vụ của bạn.
        </p>
        <div>
          <button
            onClick={onStartClicked}
            className="bg-white hover:bg-slate-50 text-[#0047ab] font-bold px-8 py-4 rounded-lg uppercase text-xs tracking-wider transition-all"
          >
            Tạo tài khoản &amp; Thuê ngay
          </button>
        </div>
      </section>
    </div>
  );
}
