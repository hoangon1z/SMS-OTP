import { useState } from 'react';
import { Rental } from '../types';
import { Search, Filter, Download, Copy, ChevronLeft, ChevronRight, MessageSquare, AlertTriangle } from 'lucide-react';

interface HistoryViewProps {
  history: Rental[];
}

export default function HistoryView({ history }: HistoryViewProps) {
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState('All');
  const [selectedTime, setSelectedTime] = useState('30days');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique services from history for the dropdown filter
  const uniqueServices = Array.from(new Set(history.map((h) => h.serviceName)));

  // Filter history list
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.phoneNumber.includes(search) ||
      item.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchesService = selectedService === 'All' || item.serviceName === selectedService;
    return matchesSearch && matchesService;
  });

  // Pagination simulation (items per page)
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // High fidelity export CSV function
  const exportToCSV = () => {
    const headers = ['Ngày & Giờ', 'Dịch vụ', 'Quốc gia', 'Số điện thoại', 'Mã OTP', 'Trạng thái'];
    const rows = filteredHistory.map((item) => [
      item.timestamp.replace(' • ', ' '),
      item.serviceName,
      item.countryName,
      item.phoneNumber,
      item.otpCode || 'Không có OTP',
      item.status === 'completed' ? 'Thành công' : 'Hết hạn',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rentsms_otp_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Export Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Lịch sử nhận mã</h2>
          <p className="text-slate-500 text-sm mt-1">
            Xem và xuất danh sách các mã OTP đã nhận cùng lịch sử thuê số điện thoại trực tuyến của bạn.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
        >
          <Download size={14} />
          Xuất CSV Lịch Sử
        </button>
      </div>

      {/* Control / Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo số điện thoại hoặc dịch vụ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0047ab] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:border-[#0047ab]"
          >
            <option value="All">Tất cả dịch vụ</option>
            {uniqueServices.map((srv) => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </select>

          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:border-[#0047ab]"
          >
            <option value="30days">30 ngày qua</option>
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày qua</option>
            <option value="alltime">Tất cả thời gian</option>
          </select>

          <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* History table list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f2f4f6]/60 border-b border-slate-200 text-slate-500 text-xs">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Ngày &amp; Giờ</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Dịch vụ</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Số điện thoại</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Mã OTP nhận giống</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400">
                    Không tìm thấy kết quả lịch sử tương thích
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item) => {
                  const isSuccess = item.status === 'completed';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* DateTime */}
                      <td className="px-6 py-4 text-xs">
                        <div className="font-bold text-slate-800">
                          {item.timestamp.split(' • ')[0]}
                        </div>
                        <div className="text-slate-400 mt-0.5">
                          {item.timestamp.split(' • ')[1] || 'Đã ghi nhận'}
                        </div>
                      </td>

                      {/* Service */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.logoUrl}
                            alt={item.serviceName}
                            className="w-7 h-7 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://img.icons8.com/color/120/sms.png';
                            }}
                          />
                          <div>
                            <span className="font-bold text-slate-800">{item.serviceName}</span>
                            <span className="text-[10px] block text-slate-400 font-bold">
                              {item.countryName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number with tabbed features */}
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">
                        {item.phoneNumber}
                      </td>

                      {/* OTP codes with precise design elements from the user's images */}
                      <td className="px-6 py-4">
                        {isSuccess && item.otpCode ? (
                          <div className="inline-block px-3 py-1 bg-[#dae2ff] text-[#001946] font-mono font-extrabold text-[#0047ab] rounded border border-blue-100">
                            {item.otpCode}
                          </div>
                        ) : (
                          <div className="inline-block px-3 py-1 bg-slate-100 text-slate-500 font-sans italic text-xs rounded border border-slate-200">
                            Không có OTP
                          </div>
                        )}
                      </td>

                      {/* Code state */}
                      <td className="px-6 py-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            <MessageSquare size={12} />
                            Thành công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle size={12} />
                            Hết hạn
                          </span>
                        )}
                      </td>

                      {/* Operation action button inside row */}
                      <td className="px-6 py-4 text-right">
                        {isSuccess && item.otpCode ? (
                          <button
                            onClick={() => handleCopy(item.id, item.otpCode!)}
                            className="p-1.5 text-slate-400 hover:text-[#0047ab] hover:bg-slate-100 rounded-lg active:scale-95 transition-all cursor-pointer"
                            title="Sao chép OTP"
                          >
                            {copiedId === item.id ? (
                              <span className="text-xs font-bold text-green-600">✓ Đã chép</span>
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 pointer-events-none">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination simulator controls */}
        <div className="px-6 py-4 bg-[#f2f4f6]/40 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500">
          <span>
            Hiển thị {filteredHistory.length > 0 ? startIndex + 1 : 0} đến{' '}
            {Math.min(startIndex + itemsPerPage, filteredHistory.length)} trong tổng số{' '}
            {filteredHistory.length} kết quả thuê
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded transition-all ${
                    currentPage === i + 1
                      ? 'bg-[#0047ab] text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
