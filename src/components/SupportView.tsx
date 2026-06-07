import { useState } from 'react';
import { ShieldAlert, HelpCircle, ChevronDown, MessageSquare, Mail, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

export default function SupportView() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Làm thế nào để kích hoạt số nhận OTP?',
      a: 'Bạn vào mục "Bảng điều khiển", chọn dịch vụ cần nhận tin nhắn (ví dụ: Google, Facebook, Shopee...) và nhà mạng mong muốn, sau đó nhấn "Kích hoạt số ngay". Số điện thoại sẽ hiển thị kèm theo thời gian đếm ngược 15 phút để bạn nhận mã.'
    },
    {
      q: 'Tôi có bị trừ phí nếu không nhận được OTP không?',
      a: 'Hoàn toàn không. Hệ thống chỉ tính tiền khi có mã OTP trả về thành công. Nếu quá thời gian 15 phút hoặc bạn bấm nút "Hủy bỏ / Hoàn trả" khi chưa có mã, số tiền tạm giữ sẽ được hoàn trả 100% vào số dư tài khoản của bạn ngay lập tức.'
    },
    {
      q: 'Hiện tại có hỗ trợ nhận OTP Zalo và Telegram không?',
      a: 'Không. Hiện tại dịch vụ nhận mã OTP cho Zalo và Telegram đang bị CẤM hoàn toàn trên hệ thống do chính sách siết chặt bảo mật pháp lý. Vui lòng không cố gắng thực hiện các hành vi lách luật để thuê các dịch vụ này.'
    },
    {
      q: 'Tại sao cần chọn chính xác tên dịch vụ khi thuê số?',
      a: 'Hệ thống định tuyến số điện thoại thật theo đúng cổng dịch vụ để tối ưu tỷ lệ nhận mã thành công. Việc chọn sai dịch vụ (ví dụ: chọn dịch vụ giá rẻ hơn để nhận mã cho dịch vụ đắt tiền hơn) được coi là hành vi lách luật và sẽ bị hệ thống khóa tài khoản vĩnh viễn.'
    },
    {
      q: 'Giao dịch chuyển tiền nạp ví mất bao lâu để xử lý?',
      a: 'Nếu bạn nạp tiền tự động qua VietQR/PayOS, số dư sẽ được cộng vào tài khoản trong vòng 5-30 giây sau khi chuyển khoản thành công. Đối với các hình thức nạp thủ công khác, ban quản trị sẽ kiểm tra và phê duyệt trong vòng 5-15 phút.'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-50/30 rounded-full blur-3xl -z-10 -mr-20 -mt-20"></div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <HelpCircle size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Hỗ trợ & Câu hỏi thường gặp</h2>
            <p className="text-slate-500 text-sm mt-1">
              Trung tâm trợ giúp pháp lý, nội quy hệ thống và giải đáp thắc mắc dịch vụ.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Legal Warning Banner */}
      <section className="bg-red-50/50 border border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-red-700 pb-2 border-b border-red-100">
          <ShieldAlert size={20} className="text-red-600 flex-shrink-0" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Cảnh báo pháp lý & Quy định bắt buộc</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 leading-relaxed font-sans">
          <div className="space-y-3">
            <div className="flex gap-2">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
              <p>
                <strong className="text-red-700 font-bold uppercase">Tuân thủ pháp luật tuyệt đối:</strong> Nghiêm cấm mọi hành vi sử dụng số điện thoại của hệ thống cho các hoạt động đánh bạc online, cá độ, tài xỉu, lừa đảo chiếm đoạt tài sản, tạo tài khoản ngân hàng ảo (Bank ảo), ví điện tử ảo, rửa tiền hoặc giao dịch tiền ảo trái phép.
              </p>
            </div>
            <div className="flex gap-2">
              <Lock className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
              <p>
                <strong className="text-red-700 font-bold uppercase">Lưu trữ thông tin đối chiếu:</strong> Toàn bộ địa chỉ IP đăng nhập, thông tin tài khoản chuyển khoản ngân hàng và lịch sử thuê số điện thoại đều được hệ thống tự động ghi nhật ký và lưu trữ đầy đủ để phục vụ công tác đối chiếu pháp luật khi có yêu cầu từ cơ quan chức năng.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
              <p>
                <strong className="text-red-700 font-bold uppercase">Nghiêm cấm lọc tài khoản cũ:</strong> Tuyệt đối không sử dụng dịch vụ để thực hiện lọc (scan) danh sách nick cũ trên các mạng xã hội như Facebook, Tiktok, Zalo... nhằm mục đích hack tài khoản hoặc các hành vi spam phi pháp.
              </p>
            </div>
            <div className="flex gap-2">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
              <p>
                <strong className="text-red-700 font-bold uppercase">Chọn đúng cổng dịch vụ:</strong> Bạn bắt buộc phải chọn đúng tên dịch vụ cần nhận OTP. Mọi hành vi cố tình chọn sai dịch vụ (lách cổng) nhằm trục lợi chênh lệch giá sẽ bị hệ thống khóa tài khoản vĩnh viễn và không hoàn lại số dư còn lại dưới bất kỳ hình thức nào.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-100/50 border border-red-200/80 p-3.5 rounded-xl text-xs text-red-800 font-medium flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-700 flex-shrink-0" />
          <span>
            <strong>THÔNG BÁO QUAN TRỌNG:</strong> Hiện tại dịch vụ thuê OTP cho <strong>ZALO</strong> và <strong>TELEGRAM</strong> đang bị <strong>CẤM HOÀN TOÀN</strong> và không thể thực hiện giao dịch thành công.
          </span>
        </div>
      </section>

      {/* Main Grid: FAQ and Contact Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs Accordion */}
        <section className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <HelpCircle size={16} className="text-[#0047ab]" />
            Giải đáp thắc mắc phổ biến
          </h3>

          <div className="divide-y divide-slate-100">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="py-3.5 first:pt-0 last:pb-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between text-left font-semibold text-slate-700 hover:text-[#0047ab] text-xs transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-xs text-slate-500 leading-relaxed font-sans pl-1 border-l-2 border-blue-100">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact Support Side Card */}
        <section className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <MessageSquare size={16} className="text-[#0047ab]" />
              Liên hệ CSKH
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Nếu bạn gặp bất kỳ sự cố nào liên quan đến giao dịch nạp tiền hoặc nhận mã kích hoạt, hãy gửi yêu cầu hỗ trợ ngay cho đội ngũ hỗ trợ trực tuyến của chúng tôi.
            </p>

            <div className="space-y-2">
              <a
                href="mailto:support@SMSVN.com"
                className="w-full flex items-center justify-center gap-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all"
              >
                <Mail size={14} className="text-[#0047ab]" />
                support@SMSVN.com
              </a>
            </div>
            
            <div className="border-t border-slate-100 pt-3 flex items-center gap-2 text-[10px] text-slate-400 font-medium justify-center">
              <CheckCircle2 size={12} className="text-green-500" />
              <span>Thời gian phản hồi trung bình: dưới 30 phút</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
