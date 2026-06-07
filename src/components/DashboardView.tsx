import { useState, useEffect } from 'react';
import { Service, Country, Rental } from '../types';
import {
  Search,
  Info,
  Bolt,
  ShieldCheck,
  Copy,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Clock,
  Check,
  Wifi,
  Sparkles,
  MessageSquare,
  Coins,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  services: Service[];
  countries: Country[];
  balance: number;
  rentNumber: (service: Service, country: Country) => void;
  activeRentals: Rental[];
  cancelRental: (id: string) => void;
  completeRental: (id: string) => void;
}

export default function DashboardView({
  services,
  countries,
  balance,
  rentNumber,
  activeRentals,
  cancelRental,
  completeRental,
}: DashboardViewProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync selected service if none is selected
  useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Find active models
  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const selectedCountry = countries.find((c) => c.id === selectedCountryId) || countries[0];

  // Categories helper
  const categories = [
    { id: 'all', name: 'Tất cả dịch vụ', icon: Sparkles },
    { id: 'popular', name: 'Phổ biến', icon: ShieldCheck },
    { id: 'social', name: 'Mạng xã hội', icon: MessageSquare },
    { id: 'tech', name: 'Tech & Cloud', icon: Wifi }
  ];

  // Filtering services based on category and search query
  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === 'all') return true;

    const nameLower = s.name.toLowerCase();
    if (activeCategory === 'popular') {
      const popular = ['telegram', 'google', 'facebook', 'microsoft', 'openai', 'chatgpt', 'whatsapp', 'tiktok', 'discord', 'shopee', 'zalo'];
      return popular.some(kw => nameLower.includes(kw));
    }
    if (activeCategory === 'social') {
      const social = ['facebook', 'telegram', 'whatsapp', 'tiktok', 'instagram', 'twitter', 'x.com', 'discord', 'zalo', 'viber', 'wechat', 'line'];
      return social.some(kw => nameLower.includes(kw));
    }
    if (activeCategory === 'tech') {
      const tech = ['google', 'microsoft', 'openai', 'chatgpt', 'github', 'apple', 'amazon', 'netflix', 'spotify', 'digitalocean', 'aws', 'cloudflare'];
      return tech.some(kw => nameLower.includes(kw));
    }
    return true;
  });

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get network specific metadata for display styling
  const getNetworkMeta = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('viettel')) {
      return { desc: 'Mạng Viettel di động • Tốc độ cao', color: 'text-red-500' };
    }
    if (n.includes('vinaphone') || n.includes('vina')) {
      return { desc: 'Mạng VinaPhone di động • Ổn định', color: 'text-blue-500' };
    }
    if (n.includes('mobifone') || n.includes('mobi')) {
      return { desc: 'Mạng MobiFone di động • Nhận tin nhanh', color: 'text-yellow-600' };
    }
    if (n.includes('vietnamobile') || n.includes('vietna')) {
      return { desc: 'Mạng Vietnamobile • Giá tiết kiệm', color: 'text-orange-500' };
    }
    return { desc: 'Mạng viễn thông tự động • Ưu tiên cao', color: 'text-[#0047ab]' };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header and Live Balance Display */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm relative overflow-hidden">
        {/* Decorative subtle background gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/40 rounded-full blur-3xl -z-10 -mr-20 -mt-20"></div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Bảng điều khiển dịch vụ</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-700 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Cổng SIM Live
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Lựa chọn dịch vụ và nhà mạng thích hợp bên dưới để nhận mã xác minh OTP qua số điện thoại thật tức thì.
          </p>
        </div>
        <div className="bg-[#f8fafc] border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-5 self-stretch md:self-auto min-w-[200px] shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-[#0047ab]">
              <Coins size={18} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Hạn mức ví</p>
              <p className="text-lg font-semibold text-[#0047ab] mt-0.5">{formatVND(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main asymmetric Renting selection controls */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Step 1: Services Selection */}
        <section className="col-span-12 lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-semibold text-[#0047ab] tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-5 h-5 bg-[#0047ab] text-white font-mono text-[10px] font-medium rounded-full flex items-center justify-center">1</span>
                Chọn dịch vụ nhận tin
              </h3>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">Vui lòng tìm kiếm hoặc lọc các dịch vụ lớn bên dưới</p>
            </div>
            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 self-start sm:self-auto">
              {filteredServices.length} cổng khả dụng
            </span>
          </div>

          {/* Search box & Categories */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm nhanh Telegram, Google, Facebook, ChatGPT, Microsoft..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-normal focus:outline-none focus:border-[#0047ab] focus:ring-1 focus:ring-[#0047ab] transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Categories filter tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isCatActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer transition-all ${
                      isCatActive
                        ? 'bg-[#d5e3fd] text-[#00327d]'
                        : 'bg-[#f1f5f9] text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <IconComponent size={13} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services Grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredServices.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 font-medium">
                Không tìm thấy cổng dịch vụ nào phù hợp với tìm kiếm của bạn.
              </div>
            ) : (
              filteredServices.map((service) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left group ${
                      isSelected
                        ? 'border-[#0047ab] bg-blue-50/40 glow-blue'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    {/* Floating check indicator */}
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 text-[#0047ab]">
                        <CheckCircle2 size={14} className="fill-[#0047ab] text-white" />
                      </span>
                    )}

                    <div className="w-11 h-11 bg-[#f8fafc] border border-slate-100 rounded-xl flex items-center justify-center p-2 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <img
                        src={service.logoUrl}
                        alt={service.name}
                        className="w-full h-full object-contain rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://img.icons8.com/color/120/sms.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-normal text-slate-700 block truncate leading-tight pr-3">
                        {service.name}
                      </span>
                      <span className={`text-[11px] font-medium mt-1 block ${isSelected ? 'text-[#0047ab]' : 'text-slate-500'}`}>
                        {formatVND(service.price)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Step 2: Operator Selection and Preview */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          {/* Operator List Selection Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-[#0047ab] tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-5 h-5 bg-[#0047ab] text-white font-mono text-[10px] font-semibold rounded-full flex items-center justify-center">2</span>
                Chọn nhà mạng ưu tiên
              </h3>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5 font-sans">Chọn nhà mạng phù hợp để tăng tỉ lệ nhận tin</p>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {countries.map((country) => {
                const isSelected = selectedCountryId === country.id;
                const netMeta = getNetworkMeta(country.name);
                return (
                  <label
                    key={country.id}
                    onClick={() => setSelectedCountryId(country.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-[#0047ab] bg-blue-50/20'
                        : 'border-slate-100 hover:border-slate-200 bg-[#f8fafc] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg flex-shrink-0">{country.flagCode}</span>
                      <div>
                        <span className="text-xs font-medium text-slate-700 block">{country.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal block mt-0.5">{netMeta.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="country"
                        checked={isSelected}
                        readOnly
                        className="text-[#0047ab] focus:ring-[#0047ab] h-4 w-4 accent-[#0047ab] cursor-pointer"
                      />
                    </div>
                  </label>
                );
              })}
            </div>

            <button
              onClick={() => {
                rentNumber(selectedService, selectedCountry);
                setTimeout(() => {
                  document.getElementById('active-rentals-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#0047ab] hover:bg-[#00327d] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <Bolt size={14} />
              Kích hoạt số ngay
              <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        </section>
      </div>

      {/* Rented Active Ports Tracker (Fidelity Active Ports) */}
      <section id="active-rentals-section" className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <RefreshCw size={16} className="text-[#0047ab] animate-spin-slow" />
              SỐ ĐIỆN THOẠI ĐANG HOẠT ĐỘNG ({activeRentals.length})
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Mỗi số thuê vật lý hoạt động trong vòng 15 phút. Sẽ tự động hủy và hoàn tiền nếu không có mã về.</p>
          </div>
        </div>

        {activeRentals.length === 0 ? (
          <div className="text-center py-16 px-6 space-y-4">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Smartphone size={24} className="stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <div className="text-slate-700 font-bold text-sm">Không có số điện thoại nào đang thuê</div>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Chọn dịch vụ nhận OTP, nhà mạng ở phía trên và bấm <b>&quot;Kích hoạt số ngay&quot;</b> để lấy số ngẫu nhiên từ kho SIM của chúng tôi.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Dịch vụ</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Thời gian còn lại</th>
                  <th className="px-6 py-4">Mã OTP nhận được</th>
                  <th className="px-6 py-4 text-center pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {activeRentals.map((rental) => {
                  const minutes = Math.floor(rental.timeLeft / 60);
                  const seconds = rental.timeLeft % 60;
                  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                  const percentageLeft = (rental.timeLeft / rental.maxTime) * 100;

                  // Dynamic color state for time-bar
                  let timeColor = 'bg-[#0047ab]';
                  if (percentageLeft < 20) {
                    timeColor = 'bg-red-500';
                  } else if (percentageLeft < 50) {
                    timeColor = 'bg-amber-500';
                  }

                  return (
                    <tr key={rental.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Service Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center p-1.5 flex-shrink-0 shadow-sm">
                            <img
                              src={rental.logoUrl}
                              alt={rental.serviceName}
                              className="w-full h-full object-contain rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://img.icons8.com/color/120/sms.png';
                              }}
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{rental.serviceName}</span>
                            <span className="text-[10px] block text-slate-400 font-semibold mt-0.5">
                              {rental.countryName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone Column */}
                      <td className="px-6 py-4 font-mono font-bold text-base text-[#0047ab]">
                        {rental.phoneNumber}
                      </td>

                      {/* Time timer slider */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${timeColor}`}
                              style={{ width: `${percentageLeft}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-[#0047ab] bg-blue-50/50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock size={10} />
                            {formattedTime}
                          </span>
                        </div>
                      </td>

                      {/* OTP codes and pending simulation states */}
                      <td className="px-6 py-4">
                        {rental.status === 'waiting' ? (
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0047ab]"></span>
                            </span>
                            <span className="text-xs text-slate-400 font-semibold italic animate-pulse">
                              Đang chờ mã xác minh...
                            </span>
                          </div>
                        ) : rental.status === 'received' && rental.otpCode ? (
                          <div className="bg-emerald-50 text-emerald-950 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 font-mono font-black text-sm tracking-widest border border-emerald-100 glow-green">
                            {rental.otpCode}
                            <button
                              onClick={() => handleCopy(rental.id, rental.otpCode!)}
                              className="text-emerald-600 hover:text-emerald-800 cursor-pointer p-0.5 hover:bg-emerald-100/50 rounded transition-colors"
                              title="Sao chép OTP"
                            >
                              {copiedId === rental.id ? (
                                <span className="text-[10px] font-bold text-emerald-600 font-sans tracking-normal bg-white border border-emerald-200 px-1 py-0.5 rounded shadow-sm">
                                  ✓ Đã chép
                                </span>
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-red-500 font-bold uppercase">Đã hết hạn</span>
                        )}
                      </td>

                      {/* Control buttons */}
                      <td className="px-6 py-4 text-center pr-6">
                        {rental.status === 'received' ? (
                          <button
                            onClick={() => completeRental(rental.id)}
                            className="bg-[#0047ab] hover:bg-[#00327d] text-white text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow active:scale-[0.98]"
                          >
                            Hoàn tất đơn
                          </button>
                        ) : (
                          <button
                            onClick={() => cancelRental(rental.id)}
                            className="border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50/50 text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                          >
                            Hủy bỏ / Hoàn trả
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Static summary statistic info as requested in screen designs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-[#0047ab] rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={22} className="stroke-[1.5]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tỉ lệ thành công</p>
            <p className="text-base font-black text-slate-800 mt-0.5">99.8% thành công</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-slate-50 text-[#0047ab] rounded-xl flex items-center justify-center flex-shrink-0">
            <Bolt size={22} className="stroke-[1.5]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tốc độ nhận mã</p>
            <p className="text-base font-black text-slate-800 mt-0.5">~2.4 giây trung bình</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-slate-50 text-[#0047ab] rounded-xl flex items-center justify-center flex-shrink-0">
            <Info size={22} className="stroke-[1.5]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bảo mật thông tin</p>
            <p className="text-base font-black text-slate-800 mt-0.5">Đang kích hoạt AES-256</p>
          </div>
        </div>
      </div>
    </div>
  );
}

