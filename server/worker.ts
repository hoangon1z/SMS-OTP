import { db, updateSetting } from './db';
import { CodeSimService } from './codesim';
import { Rental } from './types';

// Map lưu thời điểm check OTP gần nhất của từng số (ID hệ thống -> timestamp)
const lastCheckedMap = new Map<string, number>();

export class OTPWorker {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static start() {
    if (this.intervalId) return;

    console.log('Background Worker kiểm tra OTP đang chạy...');
    this.intervalId = setInterval(async () => {
      if (this.isRunning) return; // Tránh chạy song song nếu vòng lặp trước chưa xong
      
      this.isRunning = true;
      try {
        await this.processActiveRentals();
      } catch (error) {
        console.error('Lỗi trong worker kiểm tra OTP:', error);
      } finally {
        this.isRunning = false;
      }
    }, 2000); // Chạy mỗi 2 giây để quét
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Background Worker kiểm tra OTP đã dừng.');
    }
  }

  private static async processActiveRentals() {
    const rentals = await db.getAllRentals();
    // Quét các số đang trong trạng thái chờ hoặc đã nhận OTP nhưng chưa hoàn tất
    const activeRentals = rentals.filter(r => r.status === 'waiting' || r.status === 'received');
    const now = Date.now();

    for (const rental of activeRentals) {
      try {
        // Truy xuất trạng thái mới nhất từ Database để tránh Race Condition (User đã nhấn hủy / hoàn tất)
        const freshRental = await db.getRentalById(rental.id);
        if (!freshRental || (freshRental.status !== 'waiting' && freshRental.status !== 'received')) {
          continue; // Bỏ qua nếu đơn đã bị hủy, hoàn thành hoặc hết hạn trước đó
        }

        // 1. Kiểm tra hết hạn (timeLeft <= 0)
        if (freshRental.timeLeft <= 0) {
          if (freshRental.status === 'received') {
            // Đã nhận được mã OTP nhưng hết hạn chờ -> Tự động đánh dấu hoàn tất đơn hàng, KHÔNG HOÀN TIỀN
            freshRental.status = 'completed';
            await db.saveRental(freshRental);
            console.log(`Đơn hàng số ${freshRental.phoneNumber} đã tự động hoàn tất do hết thời gian chờ.`);
          } else {
            // Chưa nhận được mã OTP mà hết hạn chờ -> Gọi hàm hủy số và HOÀN TIỀN
            await this.handleExpiredRental(freshRental);
          }
          continue;
        }

        // Trừ thời gian còn lại (timeLeft)
        const nextTime = Math.max(0, freshRental.timeLeft - 2); // Mỗi vòng quét chạy 2 giây
        freshRental.timeLeft = nextTime;

        if (nextTime <= 0) {
          if (freshRental.status === 'received') {
            freshRental.status = 'completed';
            await db.saveRental(freshRental);
            console.log(`Đơn hàng số ${freshRental.phoneNumber} đã tự động hoàn tất do hết thời gian chờ.`);
          } else {
            await this.handleExpiredRental(freshRental);
          }
          continue;
        } else {
          // Lưu lại timeLeft mới vào DB để Client đồng bộ
          await db.saveRental(freshRental);
        }

        // 2. Kiểm tra điều kiện tần suất gọi API nguồn (Rate limit 5 giây/số) - Chỉ check khi chưa có OTP
        if (freshRental.status === 'waiting') {
          const lastChecked = lastCheckedMap.get(freshRental.id) || 0;
          if (now - lastChecked >= 5000) {
            lastCheckedMap.set(freshRental.id, now);
            await this.checkOTPApi(freshRental);
          }
        }

      } catch (err) {
        console.error(`Lỗi xử lý rental ${rental.id} (${rental.phoneNumber}):`, err);
      }
    }
  }

  private static async checkOTPApi(rental: Rental) {
    try {
      console.log(`Đang check OTP cho số ${rental.phoneNumber} (otpId: ${rental.otpId})...`);
      const res = await CodeSimService.checkOTP(rental.otpId);

      // Nếu thành công và nhận được code
      if (res.status === 200 && res.data && res.data.code) {
        rental.status = 'received';
        rental.otpCode = res.data.code;
        await db.saveRental(rental);
        console.log(`Nhận thành công OTP cho số ${rental.phoneNumber}: ${res.data.code}`);
      }
    } catch (error) {
      console.error(`Lỗi khi gọi checkOTP API nguồn cho số ${rental.phoneNumber}:`, error);
    }
  }

  private static async handleExpiredRental(rental: Rental) {
    console.log(`Số thuê ${rental.phoneNumber} đã hết hạn. Bắt đầu hoàn tiền...`);
    
    // 1. Gọi API hủy số phía CodeSim
    try {
      await CodeSimService.cancelSIM(rental.simId);
    } catch (err) {
      console.error(`Không thể gọi API hủy SIM nguồn cho ${rental.phoneNumber}:`, err);
    }

    // 2. Cập nhật trạng thái trong DB thành 'expired'
    rental.status = 'expired';
    rental.timeLeft = 0;
    await db.saveRental(rental);

    // 3. Hoàn tiền cho tài khoản khách hàng (Sử dụng giá đã lưu lúc thuê)
    const refundAmount = rental.price > 0 ? rental.price : 1200; 

    await db.updateUserBalance(rental.userId, refundAmount);

    // 4. Lưu giao dịch hoàn tiền
    await db.addTransaction({
      id: `t_refund_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: rental.userId,
      type: 'refund',
      amount: refundAmount,
      description: `Hoàn tiền tự động hết hạn - ${rental.phoneNumber} (${rental.serviceName})`,
      timestamp: new Date().toLocaleString('vi-VN'),
      status: 'completed',
      method: 'Hệ thống',
    });

    console.log(`Hoàn tiền thành công +${refundAmount}đ cho ${rental.phoneNumber}`);
  }
}

export class USDTWorker {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static start() {
    if (this.intervalId) return;

    console.log('Background Worker cập nhật tỷ giá USDT đang chạy...');
    // Chạy cập nhật ngay lần đầu tiên
    this.updateUSDTRate();

    // Định kỳ chạy mỗi 12 giờ
    this.intervalId = setInterval(async () => {
      if (this.isRunning) return;
      this.isRunning = true;
      try {
        await this.updateUSDTRate();
      } catch (err) {
        console.error('Lỗi định kỳ trong worker tỷ giá USDT:', err);
      } finally {
        this.isRunning = false;
      }
    }, 12 * 60 * 60 * 1000);
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Background Worker cập nhật tỷ giá USDT đã dừng.');
    }
  }

  private static async updateUSDTRate() {
    try {
      console.log('Đang tự động lấy tỷ giá USDT/VND mới nhất...');
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.rates && data.rates.VND) {
        const rateUSD = Math.round(Number(data.rates.VND));
        // Thêm chênh lệch tỷ giá tự do (USDT chợ đen thường cao hơn USD ngân hàng khoảng 150 VNĐ)
        const finalRate = rateUSD + 150;
        await updateSetting('usdt_rate', String(finalRate));
        console.log(`[Tỷ giá] Tự động cập nhật tỷ giá USDT thành công: 1 USDT = ${finalRate.toLocaleString('vi-VN')} VNĐ (Tỷ giá gốc USD: ${rateUSD.toLocaleString('vi-VN')} VNĐ)`);
      }
    } catch (error) {
      console.error('Lỗi khi tự động cập nhật tỷ giá USDT:', error);
    }
  }
}
