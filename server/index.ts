import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, pool, getCachedSetting, updateSetting } from './db';
import { CodeSimService } from './codesim';
import { OTPWorker, USDTWorker } from './worker';
import { getPayOSInstance } from './payos';
import { Transaction } from './types';
import { authenticateRequest, requireAdmin } from './auth';
import { encryptPayload, decryptPayload } from './crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_sms_reseller_key_12345';

app.use(cors());
app.use(express.json());

// Global API Payload Encryption & Decryption Middleware
app.use((req, res, next) => {
  // Loại trừ cổng Webhook của PayOS để cho phép nhận cuộc gọi webhook tự động từ ngân hàng bên ngoài
  if (req.path === '/api/payment/webhook') {
    return next();
  }

  // 1. Giải mã Request Body nếu chứa dữ liệu mã hóa 'encrypted'
  if (req.body && req.body.encrypted) {
    try {
      const decryptedStr = decryptPayload(req.body.encrypted);
      req.body = JSON.parse(decryptedStr);
    } catch (err) {
      console.error('Lỗi giải mã payload request:', err);
      return res.status(400).json({ error: 'Giải mã yêu cầu thất bại. Dữ liệu không hợp lệ.' });
    }
  }

  // 2. Ghi đè res.json để tự động mã hóa phản hồi trả về
  const originalJson = res.json;
  res.json = function (body) {
    try {
      const encryptedStr = encryptPayload(JSON.stringify(body));
      return originalJson.call(this, { encrypted: encryptedStr });
    } catch (err) {
      console.error('Lỗi mã hóa payload response:', err);
      return originalJson.call(this, { error: 'Mã hóa phản hồi thất bại.' });
    }
  };

  next();
});

// Khởi chạy Database và Worker
async function bootstrap() {
  try {
    await db.init();
    OTPWorker.start();
    USDTWorker.start();

    app.listen(PORT, () => {
      console.log(`Backend server đang hoạt động tại cổng ${PORT}`);
    });
  } catch (error) {
    console.error('Lỗi khi khởi động Backend:', error);
    process.exit(1);
  }
}

// ================= AUTH APIs =================

// Đăng ký người dùng mới
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên, email và mật khẩu.' });
  }

  try {
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email này đã được đăng ký bởi một tài khoản khác.' });
    }

    // Băm mật khẩu an toàn
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.createUser(name, email, passwordHash);

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công.',
      user: newUser
    });
  } catch (err: any) {
    console.error('Lỗi khi đăng ký:', err);
    res.status(500).json({ error: 'Lỗi đăng ký tài khoản.' });
  }
});

// Đăng nhập người dùng
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu.' });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    // Ký JWT Token có thời hạn 7 ngày có trường role
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: Number(user.balance),
        apiKey: user.apiKey,
        is2FAEnabled: Boolean(user.is2FAEnabled),
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ error: 'Lỗi đăng nhập.' });
  }
});


// ================= USER PROFILE APIs (Authenticated) =================

// Lấy thông tin tài khoản reseller đang đăng nhập
app.get('/api/user/profile', authenticateRequest, async (req: any, res) => {
  try {
    const profile = await db.getUserById(req.userId);
    if (!profile) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản.' });
    }
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Làm mới khóa API đại lý
app.post('/api/user/rotate-api-key', authenticateRequest, async (req: any, res) => {
  try {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let newKey = 'api_sk_SMSVN_';
    for (let i = 0; i < 24; i++) {
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const profile = await db.updateUserProfile(req.userId, { apiKey: newKey });
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Đổi mật khẩu tài khoản (Giả lập)
app.post('/api/user/change-password', authenticateRequest, async (req, res) => {
  res.json({ message: 'Mật khẩu đã được đổi thành công.' });
});


// ================= CODESIM GATEWAY (Authenticated / Public Services) =================

// Lấy danh sách dịch vụ (Có chênh lệch giá markup)
// Endpoint này được truy vấn trước khi login nên ta cho phép public
app.get('/api/services', async (req, res) => {
  try {
    let cachedServices = await db.getServices();
    if (cachedServices.length === 0) {
      console.log('Chưa có dịch vụ trong DB, tự động đồng bộ lần đầu từ CodeSim...');
      const parentServices = await CodeSimService.getServices();
      if (parentServices && parentServices.length > 0) {
        await db.saveServices(parentServices);
        cachedServices = await db.getServices();
      }
    }
    const activeServices = cachedServices.filter(s => s.isActive);
    res.json(activeServices);
  } catch (err: any) {
    console.error('Lỗi khi lấy danh sách dịch vụ:', err.message);
    res.status(500).json({ error: 'Không thể tải danh sách dịch vụ.' });
  }
});

// Lấy danh sách nhà mạng
app.get('/api/networks', async (req, res) => {
  try {
    const networks = await CodeSimService.getNetworks();
    res.json(networks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy cấu hình công khai của hệ thống (Ví dụ: Link support)
app.get('/api/config', async (req, res) => {
  try {
    res.json({
      supportLink: getCachedSetting('support_link', 'https://t.me/your_telegram_support')
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Thuê số điện thoại nhận code (Authenticated)
app.post('/api/rent', authenticateRequest, async (req: any, res) => {
  const { serviceId, networkId, phonePrefix } = req.body;
  if (!serviceId) {
    return res.status(400).json({ error: 'Thiếu serviceId.' });
  }

  try {
    // 1. Kiểm tra số dư tài khoản đại lý
    const profile = await db.getUserById(req.userId);
    if (!profile) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const services = await db.getServices();
    const service = services.find(s => s.id === String(serviceId));

    if (!service) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin dịch vụ này.' });
    }

    if (profile.balance < service.price) {
      return res.status(400).json({ error: 'Số dư tài khoản không đủ để thực hiện thuê số!' });
    }

    // 2. Gọi sang API nguồn thuê SIM
    console.log(`User #${req.userId} đang thuê SIM dịch vụ: ${service.name} (parentServiceId: ${service.parentServiceId || service.id})`);
    const originalRes = await CodeSimService.rentSIM(service.parentServiceId || service.id, networkId, phonePrefix);

    if (originalRes.status !== 200 || !originalRes.data) {
      return res.status(400).json({
        error: originalRes.message || 'Nhà cung cấp hiện tại không còn số trống, vui lòng thử lại sau.'
      });
    }

    const sourceData = originalRes.data; // { otpId, simId, payment, phone, serviceName, serviceId }

    // 3. Trừ tiền tạm thời & Ghi nhận giao dịch
    await db.updateUserBalance(req.userId, -service.price);

    const timestamp = new Date().toLocaleString('vi-VN');

    const newTx: Transaction = {
      id: `t_rent_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: req.userId,
      type: 'rent',
      amount: -service.price,
      description: `Thuê số OTP - ${sourceData.phone} (${service.name})`,
      timestamp,
      status: 'completed',
    };
    await db.addTransaction(newTx);

    // 4. Lưu thông tin thuê số vào database để worker theo dõi
    const newRental = {
      id: `r_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: req.userId,
      otpId: Number(sourceData.otpId),
      simId: Number(sourceData.simId),
      serviceId: service.id,
      serviceName: service.name,
      logoUrl: service.logoUrl,
      phoneNumber: sourceData.phone,
      otpCode: null,
      timeLeft: 900, // 15 phút (900 giây)
      maxTime: 900,
      status: 'waiting' as const,
      timestamp,
      networkName: networkId ? 'Chọn lọc' : 'Tự động',
      price: service.price,
    };
    await db.saveRental(newRental);

    res.json(newRental);
  } catch (err: any) {
    console.error('Lỗi khi thực hiện thuê SIM:', err);
    res.status(500).json({ error: err.message || 'Lỗi hệ thống.' });
  }
});

// Hủy số đang thuê (Authenticated)
app.post('/api/rentals/:id/cancel', authenticateRequest, async (req: any, res) => {
  const { id } = req.params;
  try {
    const rental = await db.getRentalById(id);
    if (!rental) {
      return res.status(404).json({ error: 'Không tìm thấy phiên thuê số.' });
    }

    if (rental.userId !== req.userId) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này.' });
    }

    if (rental.status !== 'waiting') {
      return res.status(400).json({ error: 'Giao dịch thuê số này đã hoàn thành hoặc hết hạn.' });
    }

    // Gọi API nguồn để hủy
    await CodeSimService.cancelSIM(rental.simId);

    // Cập nhật DB
    rental.status = 'expired';
    rental.timeLeft = 0;
    await db.saveRental(rental);

    // Hoàn tiền cho người dùng
    const refundAmount = rental.price > 0 ? rental.price : 1200;

    await db.updateUserBalance(req.userId, refundAmount);

    // Tạo giao dịch hoàn tiền
    await db.addTransaction({
      id: `t_refund_${Date.now()}`,
      userId: req.userId,
      type: 'refund',
      amount: refundAmount,
      description: `Hoàn tiền hủy kích hoạt - ${rental.phoneNumber} (${rental.serviceName})`,
      timestamp: new Date().toLocaleString('vi-VN'),
      status: 'completed',
      method: 'Hệ thống',
    });

    res.json({ message: 'Hủy số và hoàn tiền thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Hoàn thành thuê số (Authenticated)
app.post('/api/rentals/:id/complete', authenticateRequest, async (req: any, res) => {
  const { id } = req.params;
  try {
    const rental = await db.getRentalById(id);
    if (!rental) {
      return res.status(404).json({ error: 'Không tìm thấy phiên thuê số.' });
    }

    if (rental.userId !== req.userId) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này.' });
    }

    rental.status = 'completed';
    await db.saveRental(rental);
    res.json({ message: 'Phiên giao dịch đã được lưu lịch sử.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách số đang chờ nhận OTP của user đang đăng nhập (Authenticated)
app.get('/api/rentals/active', authenticateRequest, async (req: any, res) => {
  try {
    const rentals = await db.getRentals(req.userId);
    const active = rentals.filter(r => r.status === 'waiting' || r.status === 'received');
    res.json(active);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách lịch sử đã xong/hết hạn của user đang đăng nhập (Authenticated)
app.get('/api/rentals/history', authenticateRequest, async (req: any, res) => {
  try {
    const rentals = await db.getRentals(req.userId);
    const history = rentals.filter(r => r.status === 'expired' || r.status === 'completed');
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy lịch sử giao dịch nạp rút ví (Authenticated)
app.get('/api/transactions', authenticateRequest, async (req: any, res) => {
  try {
    const txs = await db.getTransactions(req.userId);
    res.json(txs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ================= PAYOS & USDT DEPOSITS (Authenticated) =================

// Tạo hóa đơn nạp tiền VietQR
app.post('/api/payment/create', authenticateRequest, async (req: any, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) < 2000) {
    return res.status(400).json({ error: 'Số tiền nạp tối thiểu là 2.000 VNĐ.' });
  }

  try {
    let usePayOS = false;
    
    // Kiểm tra cấu hình PayOS xem có hợp lệ không
    let payosClientId = (process.env.PAYOS_CLIENT_ID || '').trim();
    let payosApiKey = (process.env.PAYOS_API_KEY || '').trim();
    let payosChecksumKey = (process.env.PAYOS_CHECKSUM_KEY || '').trim();
    
    let isEnvValid = (
      payosClientId && payosClientId !== 'YOUR_PAYOS_CLIENT_ID_HERE' &&
      payosApiKey && payosApiKey !== 'YOUR_PAYOS_API_KEY_HERE' &&
      payosChecksumKey && payosChecksumKey !== 'YOUR_PAYOS_CHECKSUM_KEY_HERE'
    );

    if (!isEnvValid) {
      payosClientId = getCachedSetting('payos_client_id', '').trim();
      payosApiKey = getCachedSetting('payos_api_key', '').trim();
      payosChecksumKey = getCachedSetting('payos_checksum_key', '').trim();
      
      if (
        payosClientId && payosClientId !== 'YOUR_PAYOS_CLIENT_ID_HERE' && payosClientId !== '' &&
        payosApiKey && payosApiKey !== 'YOUR_PAYOS_API_KEY_HERE' && payosApiKey !== '' &&
        payosChecksumKey && payosChecksumKey !== 'YOUR_PAYOS_CHECKSUM_KEY_HERE' && payosChecksumKey !== ''
      ) {
        usePayOS = true;
      }
    } else {
      usePayOS = true;
    }

    const orderCode = Number(String(Date.now()).slice(-9) + Math.floor(Math.random() * 10));
    const amountNum = Number(amount);

    if (usePayOS) {
      try {
        const payosInstance = getPayOSInstance();
        const paymentPayload = {
          orderCode,
          amount: amountNum,
          description: `Nap tien #${orderCode}`,
          returnUrl: `${process.env.APP_URL || 'http://localhost:3000'}/`,
          cancelUrl: `${process.env.APP_URL || 'http://localhost:3000'}/`,
        };

        console.log(`Đang tạo liên kết thanh toán PayOS. Code: ${orderCode}, Số tiền: ${amountNum}`);
        const payosResponse = await payosInstance.paymentRequests.create(paymentPayload);

        // Lưu giao dịch chờ nạp tiền (pending) vào Database
        await db.addTransaction({
          id: String(orderCode),
          userId: req.userId,
          type: 'deposit',
          amount: amountNum,
          description: `Nạp số dư tài khoản qua VietQR (Hóa đơn #${orderCode})`,
          timestamp: new Date().toLocaleString('vi-VN'),
          status: 'pending',
          method: 'PayOS',
        });

        const bankNameMap: { [key: string]: string } = {
          '970422': 'MB Bank',
          '970415': 'VietinBank',
          '970436': 'Vietcombank',
          '970418': 'BIDV',
          '970405': 'Agribank',
          '970407': 'Techcombank',
          '970403': 'Sacombank',
          '970423': 'TPBank',
          '970429': 'SCB',
          '970441': 'VIB',
          '970416': 'ACB',
          '970432': 'VPBank'
        };
        const mappedBankName = bankNameMap[payosResponse.bin] || `Ngân hàng (BIN ${payosResponse.bin})`;

        return res.json({
          method: 'PayOS',
          checkoutUrl: payosResponse.checkoutUrl,
          qrCode: payosResponse.qrCode,
          bankName: mappedBankName,
          bankAccount: payosResponse.accountNumber,
          bankOwner: payosResponse.accountName,
          description: payosResponse.description,
          amount: payosResponse.amount,
          orderCode
        });
      } catch (payosErr: any) {
        console.error('Lỗi khi gọi API PayOS, tự động chuyển sang VietQR thủ công:', payosErr);
        // Fallback tự động xuống VietQR thủ công bên dưới
      }
    }

    // Cơ chế nạp VietQR thủ công (Fallback khi chưa cấu hình hoặc cấu hình lỗi)
    console.log(`Sử dụng cổng VietQR thủ công. Code: ${orderCode}, Số tiền: ${amountNum}`);
    const bankName = getCachedSetting('bank_name', 'MB Bank');
    const bankAccount = getCachedSetting('bank_account', '9999999999');
    const bankOwner = getCachedSetting('bank_owner', 'NGUYEN VAN A');
    const bankQrTemplate = getCachedSetting('bank_qr_template', 'compact');
    
    // Nội dung chuyển khoản chuẩn hóa: SMS [userId] NAP [orderCode]
    const paymentDescription = `SMS ${req.userId} NAP ${orderCode}`;

    // Lưu giao dịch chờ nạp tiền (pending) vào Database
    await db.addTransaction({
      id: String(orderCode),
      userId: req.userId,
      type: 'deposit',
      amount: amountNum,
      description: `Nạp VietQR thủ công. ND: ${paymentDescription}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      method: 'VietQR',
    });

    // Tạo link ảnh QR VietQR bằng API vietqr.io công khai
    const encodedBankOwner = encodeURIComponent(bankOwner);
    const encodedDescription = encodeURIComponent(paymentDescription);
    const qrCodeUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-${bankQrTemplate}.png?amount=${amountNum}&addInfo=${encodedDescription}&accountName=${encodedBankOwner}`;

    return res.json({
      method: 'VietQR',
      qrCode: qrCodeUrl,
      bankName,
      bankAccount,
      bankOwner,
      description: paymentDescription,
      amount: amountNum,
      orderCode
    });

  } catch (err: any) {
    console.error('Lỗi hệ thống khi tạo yêu cầu thanh toán:', err);
    res.status(500).json({ error: err.message || 'Lỗi khi tạo yêu cầu thanh toán.' });
  }
});

// Kiểm tra trạng thái hóa đơn thanh toán phục vụ tự động duyệt trên giao diện
app.get('/api/payment/status/:orderCode', authenticateRequest, async (req: any, res) => {
  const { orderCode } = req.params;
  try {
    const [rows]: any = await pool.query(
      'SELECT status, amount FROM transactions WHERE id = ? AND userId = ?',
      [String(orderCode), req.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn giao dịch này.' });
    }
    res.json({ status: rows[0].status, amount: rows[0].amount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy cấu hình cổng nạp USDT công khai (Địa chỉ ví, mạng lưới, tỷ giá)
app.get('/api/payment/usdt-info', authenticateRequest, async (req: any, res) => {
  try {
    res.json({
      usdtAddress: getCachedSetting('usdt_address', 'TR7NHgoK3FUknZsfwMsDqtKsA6MS7g96Ku'),
      usdtNetwork: getCachedSetting('usdt_network', 'TRC20'),
      usdtRate: Number(getCachedSetting('usdt_rate', '25000'))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Yêu cầu nạp USDT (Manual verification)
app.post('/api/payment/usdt-deposit', authenticateRequest, async (req: any, res) => {
  const { amountUsdt, txid } = req.body;
  if (!amountUsdt || isNaN(Number(amountUsdt)) || Number(amountUsdt) <= 0 || !txid) {
    return res.status(400).json({ error: 'Thông tin yêu cầu nạp USDT không hợp lệ.' });
  }

  const txidClean = String(txid).trim();

  try {
    const [existing]: any = await pool.query('SELECT * FROM transactions WHERE id = ? OR description LIKE ?', [txidClean, `%${txidClean}%`]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Mã giao dịch (TxID) này đã được báo cáo hoặc đã tồn tại trong hệ thống.' });
    }

    const rate = Number(getCachedSetting('usdt_rate', '25000'));
    const amountVnd = Math.round(Number(amountUsdt) * rate);
    const orderId = `USDT_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await db.addTransaction({
      id: orderId,
      userId: req.userId,
      type: 'deposit',
      amount: amountVnd,
      description: `Nạp ${amountUsdt} USDT. TxID: ${txidClean}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      status: 'pending',
      method: 'USDT'
    });

    res.json({ message: 'Yêu cầu nạp USDT đã được gửi! Vui lòng chờ quản trị viên duyệt.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook xử lý thanh toán tự động từ PayOS (Public callback)
app.post('/api/payment/webhook', async (req, res) => {
  console.log('Nhận tín hiệu Webhook từ PayOS:', req.body);
  try {
    const payosInstance = getPayOSInstance();
    // Xác thực chữ ký webhook từ PayOS gửi sang
    const webhookData = await payosInstance.webhooks.verify(req.body);

    if (webhookData) {
      const orderCode = webhookData.orderCode;
      const amount = webhookData.amount;

      const [rows]: any = await pool.query('SELECT * FROM transactions WHERE id = ?', [String(orderCode)]);
      if (rows.length > 0) {
        const tx = rows[0];

        if (tx.status === 'pending') {
          console.log(`Webhook hợp lệ! Tiến hành nạp +${amount} VNĐ vào tài khoản User #${tx.userId}.`);

          // Cập nhật trạng thái giao dịch
          await pool.query('UPDATE transactions SET status = "completed" WHERE id = ?', [String(orderCode)]);

          // Cộng số dư ví cho user
          await db.updateUserBalance(tx.userId, amount);

          return res.json({ status: 'success', message: 'Nạp tiền hoàn tất.' });
        } else {
          console.log(`Giao dịch #${orderCode} đã xử lý trước đó.`);
        }
      } else {
        console.log(`Không tìm thấy giao dịch #${orderCode} trong Database.`);
      }
    }

    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Lỗi xác thực hoặc xử lý webhook PayOS:', err);
    res.status(400).json({ error: 'Chữ ký webhook không hợp lệ hoặc lỗi xử lý.' });
  }
});

// ================= ADMIN APIs (Authenticated & Role Checked) =================

// Lấy danh sách thành viên
app.get('/api/admin/users', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT id, name, email, balance, apiKey, is2FAEnabled, role FROM users');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cộng/Trừ số dư thành viên thủ công
app.post('/api/admin/users/:id/balance', authenticateRequest, requireAdmin, async (req: any, res) => {
  const { id } = req.params;
  const { adjustAmount, note } = req.body;

  if (adjustAmount === undefined || isNaN(Number(adjustAmount))) {
    return res.status(400).json({ error: 'Số tiền điều chỉnh không hợp lệ.' });
  }

  try {
    const user = await db.getUserById(Number(id));
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng này.' });
    }

    await db.updateUserBalance(Number(id), Number(adjustAmount));

    // Ghi nhận giao dịch thủ công
    const txId = `t_admin_${Date.now()}`;
    await db.addTransaction({
      id: txId,
      userId: Number(id),
      type: Number(adjustAmount) >= 0 ? 'deposit' : 'rent',
      amount: Number(adjustAmount),
      description: note || `Admin điều chỉnh số dư: ${Number(adjustAmount) >= 0 ? '+' : ''}${adjustAmount} VNĐ`,
      timestamp: new Date().toLocaleString('vi-VN'),
      status: 'completed',
      method: 'Hệ thống'
    });

    const updatedUser = await db.getUserById(Number(id));
    res.json({ message: 'Điều chỉnh số dư thành công.', user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật vai trò thành viên (admin <=> user <=> blocked)
app.post('/api/admin/users/:id/role', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || (role !== 'user' && role !== 'admin' && role !== 'blocked')) {
    return res.status(400).json({ error: 'Vai trò (role) không hợp lệ.' });
  }

  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    const updatedUser = await db.getUserById(Number(id));
    res.json({ message: 'Cập nhật vai trò thành công.', user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Đặt lại mật khẩu thành viên trực tiếp (Admin reset)
app.post('/api/admin/users/:id/password', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 6 ký tự.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET passwordHash = ? WHERE id = ?', [hash, id]);
    res.json({ message: 'Đặt lại mật khẩu thành viên thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy lịch sử giao dịch của 1 thành viên cụ thể
app.get('/api/admin/users/:id/transactions', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC', [id]);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy lịch sử thuê SIM của 1 thành viên cụ thể
app.get('/api/admin/users/:id/rentals', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM rentals WHERE userId = ? ORDER BY timestamp DESC', [id]);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy cấu hình cổng thanh toán (PayOS, USDT & VietQR thủ công)
app.get('/api/admin/gateway-settings', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    res.json({
      payosClientId: getCachedSetting('payos_client_id', ''),
      payosApiKey: getCachedSetting('payos_api_key', ''),
      payosChecksumKey: getCachedSetting('payos_checksum_key', ''),
      usdtAddress: getCachedSetting('usdt_address', 'TR7NHgoK3FUknZsfwMsDqtKsA6MS7g96Ku'),
      usdtNetwork: getCachedSetting('usdt_network', 'TRC20'),
      usdtRate: Number(getCachedSetting('usdt_rate', '25000')),
      bankName: getCachedSetting('bank_name', 'MB Bank'),
      bankAccount: getCachedSetting('bank_account', '9999999999'),
      bankOwner: getCachedSetting('bank_owner', 'NGUYEN VAN A'),
      bankQrTemplate: getCachedSetting('bank_qr_template', 'compact'),
      supportLink: getCachedSetting('support_link', 'https://t.me/your_telegram_support')
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật cấu hình cổng thanh toán (PayOS, USDT & VietQR thủ công)
app.post('/api/admin/gateway-settings', authenticateRequest, requireAdmin, async (req, res) => {
  const { payosClientId, payosApiKey, payosChecksumKey, usdtAddress, usdtNetwork, usdtRate, bankName, bankAccount, bankOwner, bankQrTemplate, supportLink } = req.body;
  try {
    if (payosClientId !== undefined) await updateSetting('payos_client_id', String(payosClientId).trim());
    if (payosApiKey !== undefined) await updateSetting('payos_api_key', String(payosApiKey).trim());
    if (payosChecksumKey !== undefined) await updateSetting('payos_checksum_key', String(payosChecksumKey).trim());
    if (usdtAddress !== undefined) await updateSetting('usdt_address', String(usdtAddress).trim());
    if (usdtNetwork !== undefined) await updateSetting('usdt_network', String(usdtNetwork).trim());
    if (usdtRate !== undefined) await updateSetting('usdt_rate', String(usdtRate).trim());
    if (bankName !== undefined) await updateSetting('bank_name', String(bankName).trim());
    if (bankAccount !== undefined) await updateSetting('bank_account', String(bankAccount).trim());
    if (bankOwner !== undefined) await updateSetting('bank_owner', String(bankOwner).trim());
    if (bankQrTemplate !== undefined) await updateSetting('bank_qr_template', String(bankQrTemplate).trim());
    if (supportLink !== undefined) await updateSetting('support_link', String(supportLink).trim());

    res.json({ message: 'Cập nhật cấu hình cổng thanh toán thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách yêu cầu nạp tiền chờ duyệt (Cả USDT và VietQR)
app.get('/api/admin/pending-deposits', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT t.*, u.name as userName, u.email as userEmail FROM transactions t JOIN users u ON t.userId = u.id WHERE t.type = "deposit" AND t.status = "pending" ORDER BY t.timestamp DESC'
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Hỗ trợ backward compatibility cho frontend cũ
app.get('/api/admin/usdt-deposits', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT t.*, u.name as userName, u.email as userEmail FROM transactions t JOIN users u ON t.userId = u.id WHERE t.type = "deposit" AND t.status = "pending" ORDER BY t.timestamp DESC'
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Phê duyệt / Từ chối yêu cầu nạp tiền (Cả USDT và VietQR)
app.post('/api/admin/pending-deposits/:id/action', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Hành động không hợp lệ.' });
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM transactions WHERE id = ? AND type = "deposit" AND status = "pending"', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Yêu cầu nạp tiền không tồn tại hoặc đã được xử lý.' });
    }

    const tx = rows[0];

    if (action === 'approve') {
      await pool.query('UPDATE transactions SET status = "completed" WHERE id = ?', [id]);
      await db.updateUserBalance(tx.userId, tx.amount);
      res.json({ message: 'Phê duyệt nạp tiền và cộng số dư tài khoản thành công.' });
    } else {
      await pool.query('UPDATE transactions SET status = "failed" WHERE id = ?', [id]);
      res.json({ message: 'Đã từ chối và hủy bỏ yêu cầu nạp tiền.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Hỗ trợ backward compatibility cho frontend cũ
app.post('/api/admin/usdt-deposits/:id/action', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Hành động không hợp lệ.' });
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM transactions WHERE id = ? AND type = "deposit" AND status = "pending"', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Yêu cầu nạp tiền không tồn tại hoặc đã được xử lý.' });
    }

    const tx = rows[0];

    if (action === 'approve') {
      await pool.query('UPDATE transactions SET status = "completed" WHERE id = ?', [id]);
      await db.updateUserBalance(tx.userId, tx.amount);
      res.json({ message: 'Phê duyệt nạp tiền và cộng số dư tài khoản thành công.' });
    } else {
      await pool.query('UPDATE transactions SET status = "failed" WHERE id = ?', [id]);
      res.json({ message: 'Đã từ chối và hủy bỏ yêu cầu nạp tiền.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách dịch vụ phía quản trị viên
app.get('/api/admin/services', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    const services = await db.getServices();
    res.json(services);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Điều chỉnh giá bán dịch vụ thủ công (Markup)
app.post('/api/admin/services/:id/price', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { price, isCustom } = req.body;

  if (price === undefined || isNaN(Number(price))) {
    return res.status(400).json({ error: 'Giá bán không hợp lệ.' });
  }

  try {
    const [rows]: any = await pool.query('SELECT priceOriginal FROM services WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ này.' });
    }

    const original = Number(rows[0].priceOriginal);
    if (Number(price) < original) {
      return res.status(400).json({ error: `Giá bán mới (${price}đ) không được thấp hơn giá gốc nhập (${original}đ).` });
    }

    await pool.query('UPDATE services SET price = ?, isCustomPrice = ? WHERE id = ?', [Number(price), isCustom ? 1 : 0, id]);
    res.json({ message: 'Cấu hình giá bán dịch vụ thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy cấu hình giá bán (markup) chung của hệ thống
app.get('/api/admin/markup-settings', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    const flat = Number(getCachedSetting('markup_flat', '200'));
    const percent = Number(getCachedSetting('markup_percent', '1.15'));
    res.json({ markupFlat: flat, markupPercent: percent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật cấu hình giá bán (markup) chung của hệ thống
app.post('/api/admin/markup-settings', authenticateRequest, requireAdmin, async (req, res) => {
  const { markupFlat, markupPercent, applyToCustom } = req.body;

  if (markupFlat === undefined || isNaN(Number(markupFlat)) || markupPercent === undefined || isNaN(Number(markupPercent))) {
    return res.status(400).json({ error: 'Giá trị cấu hình không hợp lệ.' });
  }

  try {
    const flat = Number(markupFlat);
    const percent = Number(markupPercent);

    await updateSetting('markup_flat', String(flat));
    await updateSetting('markup_percent', String(percent));

    if (applyToCustom) {
      // Thiết lập lại toàn bộ dịch vụ và tính toán lại giá
      await pool.query('UPDATE services SET price = CEIL((priceOriginal * ? + ?) / 100) * 100, isCustomPrice = 0', [percent, flat]);
    } else {
      // Chỉ tính toán lại giá cho các dịch vụ đang ở chế độ tự động
      await pool.query('UPDATE services SET price = CEIL((priceOriginal * ? + ?) / 100) * 100 WHERE isCustomPrice = 0', [percent, flat]);
    }

    res.json({ message: 'Cập nhật cấu hình giá bán chung thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Điều chỉnh giá bán dịch vụ hàng loạt
app.post('/api/admin/services/bulk-adjust', authenticateRequest, requireAdmin, async (req, res) => {
  const { action, value, applyToCustom } = req.body;

  if (!action || value === undefined || isNaN(Number(value))) {
    return res.status(400).json({ error: 'Tham số điều chỉnh không hợp lệ.' });
  }

  const val = Number(value);
  const customFlag = applyToCustom ? 1 : 0;

  try {
    if (action === 'increase_flat') {
      await pool.query(
        'UPDATE services SET price = price + ?, isCustomPrice = CASE WHEN ? = 1 THEN 1 ELSE isCustomPrice END WHERE (isCustomPrice = 0 OR ? = 1)',
        [val, customFlag, customFlag]
      );
    } else if (action === 'decrease_flat') {
      await pool.query(
        'UPDATE services SET price = GREATEST(price - ?, priceOriginal), isCustomPrice = CASE WHEN ? = 1 THEN 1 ELSE isCustomPrice END WHERE (isCustomPrice = 0 OR ? = 1)',
        [val, customFlag, customFlag]
      );
    } else if (action === 'increase_percent') {
      const multiplier = 1 + val / 100;
      await pool.query(
        'UPDATE services SET price = CEIL((price * ?) / 100) * 100, isCustomPrice = CASE WHEN ? = 1 THEN 1 ELSE isCustomPrice END WHERE (isCustomPrice = 0 OR ? = 1)',
        [multiplier, customFlag, customFlag]
      );
    } else if (action === 'decrease_percent') {
      const multiplier = 1 - val / 100;
      await pool.query(
        'UPDATE services SET price = GREATEST(CEIL((price * ?) / 100) * 100, priceOriginal), isCustomPrice = CASE WHEN ? = 1 THEN 1 ELSE isCustomPrice END WHERE (isCustomPrice = 0 OR ? = 1)',
        [multiplier, customFlag, customFlag]
      );
    } else if (action === 'reset_auto') {
      const flat = Number(getCachedSetting('markup_flat', '200'));
      const percent = Number(getCachedSetting('markup_percent', '1.15'));
      await pool.query('UPDATE services SET price = CEIL((priceOriginal * ? + ?) / 100) * 100, isCustomPrice = 0', [percent, flat]);
    } else {
      return res.status(400).json({ error: 'Hành động điều chỉnh không hợp lệ.' });
    }

    res.json({ message: 'Điều chỉnh giá hàng loạt thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách dịch vụ gốc trực tiếp từ web cha
app.get('/api/admin/parent-services', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    const parentServices = await CodeSimService.getServices();
    res.json(parentServices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Đồng bộ danh sách dịch vụ từ nguồn
app.post('/api/admin/services/sync', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    const parentServices = await CodeSimService.getServices();
    if (parentServices && parentServices.length > 0) {
      await db.saveServices(parentServices);
      res.json({ message: 'Đồng bộ danh sách dịch vụ từ nguồn thành công!' });
    } else {
      res.status(400).json({ error: 'Không lấy được danh sách dịch vụ từ web cha.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm dịch vụ tùy chỉnh mới
app.post('/api/admin/services/add', authenticateRequest, requireAdmin, async (req, res) => {
  const { name, code, logoUrl, parentServiceId, price, isCustomPrice } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Vui lòng điền tên và mã code dịch vụ.' });
  }

  try {
    const customId = `custom_${Date.now()}`;
    const logo = logoUrl || 'https://cdn-icons-png.flaticon.com/512/846/846480.png';
    const isCustom = isCustomPrice ? 1 : 0;

    // Tìm giá gốc của parent service nếu có
    let priceOriginal = 0;
    if (parentServiceId) {
      const parentList = await CodeSimService.getServices();
      const parent = parentList.find(p => p.id === String(parentServiceId));
      if (parent) {
        priceOriginal = parent.priceOriginal;
      }
    }

    // Nếu không cấu hình giá custom, tính theo markup mặc định
    let finalPrice = Number(price || 0);
    if (!isCustom) {
      const flat = Number(getCachedSetting('markup_flat', '200'));
      const percent = Number(getCachedSetting('markup_percent', '1.15'));
      finalPrice = Math.ceil((priceOriginal * percent + flat) / 100) * 100;
    }

    await pool.query(
      'INSERT INTO services (id, name, price, priceOriginal, code, logoUrl, isCustomPrice, parentServiceId, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [customId, name, finalPrice, priceOriginal, code, logo, isCustom, parentServiceId || null]
    );

    res.json({ message: 'Thêm dịch vụ tùy chỉnh mới thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật/Sửa dịch vụ tùy chỉnh
app.put('/api/admin/services/:id/edit', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, code, logoUrl, parentServiceId, price, isCustomPrice } = req.body;

  try {
    const [rows]: any = await pool.query('SELECT priceOriginal FROM services WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ.' });
    }

    let priceOriginal = Number(rows[0].priceOriginal);
    const isCustom = isCustomPrice ? 1 : 0;

    // Nếu đổi sang parentServiceId mới, cập nhật giá gốc
    if (parentServiceId) {
      const parentList = await CodeSimService.getServices();
      const parent = parentList.find(p => p.id === String(parentServiceId));
      if (parent) {
        priceOriginal = parent.priceOriginal;
      }
    }

    let finalPrice = Number(price || 0);
    if (!isCustom) {
      const flat = Number(getCachedSetting('markup_flat', '200'));
      const percent = Number(getCachedSetting('markup_percent', '1.15'));
      finalPrice = Math.ceil((priceOriginal * percent + flat) / 100) * 100;
    }

    await pool.query(
      'UPDATE services SET name = ?, code = ?, logoUrl = ?, parentServiceId = ?, price = ?, priceOriginal = ?, isCustomPrice = ? WHERE id = ?',
      [name, code, logoUrl, parentServiceId || null, finalPrice, priceOriginal, isCustom, id]
    );

    res.json({ message: 'Cập nhật thông tin dịch vụ thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bật/Tắt hoạt động của dịch vụ
app.post('/api/admin/services/:id/toggle', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    await pool.query('UPDATE services SET isActive = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    res.json({ message: 'Cập nhật trạng thái hoạt động dịch vụ thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa dịch vụ
app.delete('/api/admin/services/:id', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Xóa dịch vụ thành công.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy thông tin thống kê tổng quan của hệ thống
app.get('/api/admin/stats', authenticateRequest, requireAdmin, async (req, res) => {
  try {
    const [userCount]: any = await pool.query('SELECT COUNT(*) as count, SUM(balance) as totalBalance FROM users');
    const [rentalCount]: any = await pool.query('SELECT COUNT(*) as count FROM rentals');
    const [successRentalCount]: any = await pool.query('SELECT COUNT(*) as count FROM rentals WHERE status = "received" OR status = "completed"');

    // Tính toán lợi nhuận thu về từ chênh lệch giá thuê thành công
    const [profitRows]: any = await pool.query(`
      SELECT SUM(s.price - s.priceOriginal) as profit 
      FROM rentals r 
      JOIN services s ON r.serviceId = s.id 
      WHERE r.status = 'completed' OR r.status = 'received'
    `);

    const profit = profitRows[0].profit || 0;

    res.json({
      totalUsers: userCount[0].count,
      totalUserBalance: userCount[0].totalBalance || 0,
      totalRentals: rentalCount[0].count,
      successRentals: successRentalCount[0].count,
      totalProfit: Number(profit)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Khởi chạy
bootstrap();
