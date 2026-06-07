import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import { UserProfile, Rental, Transaction, Service } from './types';
import { getLogoForService } from './logoUtils';

dotenv.config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 3306);
const dbUser = process.env.DB_USER || 'sms_user';
const dbPassword = process.env.DB_PASSWORD || 'sms_password';
const dbName = process.env.DB_NAME || 'sms_reseller';

export let pool: mysql.Pool;

const settingsCache: { [key: string]: string } = {};

export function getCachedSetting(key: string, defaultValue: string): string {
  return settingsCache[key] !== undefined ? settingsCache[key] : defaultValue;
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', [key, value, value]);
  settingsCache[key] = value;
}

class Database {
  async init(): Promise<void> {
    try {
      console.log('Đang kết nối tới MySQL Server...');

      const tempConn = await mysql.createConnection({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword
      });

      console.log(`Đang kiểm tra/tạo database '${dbName}'...`);
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await tempConn.end();

      pool = mysql.createPool({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      console.log('Kết nối MySQL Database thành công.');

      // KIỂM TRA MIGRATION: Nếu bảng users chưa có trường role hoặc services chưa có isCustomPrice, tiến hành dọn sạch dữ liệu cũ
      let needsMigration = false;
      try {
        const [columnsUsers]: any = await pool.query('SHOW COLUMNS FROM users LIKE "role"');
        const [columnsServices]: any = await pool.query('SHOW COLUMNS FROM services LIKE "isCustomPrice"');
        if (columnsUsers.length === 0 || columnsServices.length === 0) {
          needsMigration = true;
        }
      } catch (err) {
        // Bảng chưa tồn tại -> Không cần dọn dẹp
      }

      if (needsMigration) {
        console.log('Phát hiện dữ liệu cấu trúc cũ (thiếu role hoặc isCustomPrice). Đang dọn dẹp toàn bộ dữ liệu mock...');
        await pool.query('DROP TABLE IF EXISTS transactions');
        await pool.query('DROP TABLE IF EXISTS rentals');
        await pool.query('DROP TABLE IF EXISTS services');
        await pool.query('DROP TABLE IF EXISTS users');
      }

      // Khởi tạo bảng Users mới (có trường role)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          passwordHash VARCHAR(255) NOT NULL,
          balance DOUBLE NOT NULL DEFAULT 0,
          apiKey VARCHAR(255) UNIQUE NOT NULL,
          is2FAEnabled TINYINT(1) NOT NULL DEFAULT 0,
          role VARCHAR(50) NOT NULL DEFAULT 'user'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Khởi tạo bảng Services (có trường isCustomPrice)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS services (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DOUBLE NOT NULL,
          priceOriginal DOUBLE NOT NULL,
          code VARCHAR(255) NOT NULL,
          logoUrl VARCHAR(255) NOT NULL,
          isCustomPrice TINYINT(1) NOT NULL DEFAULT 0,
          parentServiceId VARCHAR(255) NULL,
          isActive TINYINT(1) NOT NULL DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Kiểm tra migration các cột mới cho bảng services
      try {
        const [colsParent]: any = await pool.query('SHOW COLUMNS FROM services LIKE "parentServiceId"');
        if (colsParent.length === 0) {
          await pool.query('ALTER TABLE services ADD COLUMN parentServiceId VARCHAR(255) NULL');
          console.log('--- ĐÃ MIGRATION THÊM CỘT parentServiceId VÀO BẢNG services ---');
        }
        const [colsActive]: any = await pool.query('SHOW COLUMNS FROM services LIKE "isActive"');
        if (colsActive.length === 0) {
          await pool.query('ALTER TABLE services ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1');
          console.log('--- ĐÃ MIGRATION THÊM CỘT isActive VÀO BẢNG services ---');
        }
      } catch (err) {
        console.error('Lỗi khi chạy migration bảng services:', err);
      }

      // Khởi tạo bảng Settings mới
      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          \`key\` VARCHAR(255) PRIMARY KEY,
          \`value\` VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Tải toàn bộ settings vào cache
      const [settingsRows]: any = await pool.query('SELECT `key`, `value` FROM settings');
      for (const row of settingsRows) {
        settingsCache[row.key] = row.value;
      }

      // Khởi tạo giá trị mặc định cho Settings nếu chưa có
      if (settingsCache['markup_flat'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['markup_flat', '200', '200']);
        settingsCache['markup_flat'] = '200';
      }
      if (settingsCache['markup_percent'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['markup_percent', '1.15', '1.15']);
        settingsCache['markup_percent'] = '1.15';
      }
      if (settingsCache['payos_client_id'] === undefined) {
        const val = process.env.PAYOS_CLIENT_ID || '';
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?', ['payos_client_id', val, val]);
        settingsCache['payos_client_id'] = val;
      }
      if (settingsCache['payos_api_key'] === undefined) {
        const val = process.env.PAYOS_API_KEY || '';
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?', ['payos_api_key', val, val]);
        settingsCache['payos_api_key'] = val;
      }
      if (settingsCache['payos_checksum_key'] === undefined) {
        const val = process.env.PAYOS_CHECKSUM_KEY || '';
        await pool.query('INSERT INTO settings (`key`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?', ['payos_checksum_key', val, val]);
        settingsCache['payos_checksum_key'] = val;
      }
      if (settingsCache['usdt_address'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?', ['usdt_address', 'TR7NHgoK3FUknZsfwMsDqtKsA6MS7g96Ku', 'TR7NHgoK3FUknZsfwMsDqtKsA6MS7g96Ku']);
        settingsCache['usdt_address'] = 'TR7NHgoK3FUknZsfwMsDqtKsA6MS7g96Ku';
      }
      if (settingsCache['usdt_network'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?', ['usdt_network', 'TRC20', 'TRC20']);
        settingsCache['usdt_network'] = 'TRC20';
      }
      if (settingsCache['usdt_rate'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?', ['usdt_rate', '25000', '25000']);
        settingsCache['usdt_rate'] = '25000';
      }
      if (settingsCache['bank_name'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['bank_name', 'MB Bank', 'MB Bank']);
        settingsCache['bank_name'] = 'MB Bank';
      }
      if (settingsCache['bank_account'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['bank_account', '9999999999', '9999999999']);
        settingsCache['bank_account'] = '9999999999';
      }
      if (settingsCache['bank_owner'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['bank_owner', 'NGUYEN VAN A', 'NGUYEN VAN A']);
        settingsCache['bank_owner'] = 'NGUYEN VAN A';
      }
      if (settingsCache['bank_qr_template'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['bank_qr_template', 'compact', 'compact']);
        settingsCache['bank_qr_template'] = 'compact';
      }
      if (settingsCache['support_link'] === undefined) {
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['support_link', 'https://t.me/your_telegram_support', 'https://t.me/your_telegram_support']);
        settingsCache['support_link'] = 'https://t.me/your_telegram_support';
      }


      // Khởi tạo bảng Rentals mới (có cột userId)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS rentals (
          id VARCHAR(255) PRIMARY KEY,
          userId INT NOT NULL,
          otpId BIGINT NOT NULL,
          simId BIGINT NOT NULL,
          serviceId VARCHAR(255) NOT NULL,
          serviceName VARCHAR(255) NOT NULL,
          logoUrl VARCHAR(255) NOT NULL,
          phoneNumber VARCHAR(255) NOT NULL,
          otpCode VARCHAR(255) NULL,
          timeLeft INT NOT NULL,
          maxTime INT NOT NULL,
          status VARCHAR(50) NOT NULL,
          timestamp VARCHAR(255) NOT NULL,
          networkName VARCHAR(255) NOT NULL,
          price DOUBLE NOT NULL DEFAULT 0,
          INDEX (userId),
          INDEX (otpId),
          INDEX (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Kiểm tra xem bảng rentals có cột price chưa
      try {
        const [columnsRentals]: any = await pool.query('SHOW COLUMNS FROM rentals LIKE "price"');
        if (columnsRentals.length === 0) {
          await pool.query('ALTER TABLE rentals ADD COLUMN price DOUBLE NOT NULL DEFAULT 0');
          console.log('--- ĐÃ MIGRATION THÊM CỘT PRICE VÀO BẢNG RENTALS ---');
        }
      } catch (err) {
        // Lỗi nếu bảng chưa được tạo
      }

      // Khởi tạo bảng Transactions mới (có cột userId)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR(255) PRIMARY KEY,
          userId INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          amount DOUBLE NOT NULL,
          description TEXT NOT NULL,
          timestamp VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          method VARCHAR(50) NULL,
          INDEX (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // SEED DEFAULT ADMIN IF NO USERS EXIST
      const [userCountRows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
      if (userCountRows[0].count === 0) {
        const adminHash = await bcryptjs.hash('adminpassword123', 10);
        await this.createUser('Administrator', 'admin@smsreseller.com', adminHash, 'admin');
        console.log('--- ĐÃ TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH: admin@smsreseller.com / adminpassword123 ---');
      }

      // ENSURE USER admin@gmail.com EXISTS AND HAS ROLE 'admin' AND PASSWORD '123123123'
      const [adminRows]: any = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@gmail.com']);
      const requestedAdminHash = await bcryptjs.hash('123123123', 10);
      if (adminRows.length === 0) {
        await this.createUser('Admin', 'admin@gmail.com', requestedAdminHash, 'admin');
        console.log('--- ĐÃ TẠO TÀI KHOẢN ADMIN: admin@gmail.com / 123123123 ---');
      } else {
        await pool.query('UPDATE users SET passwordHash = ?, role = ? WHERE email = ?', [requestedAdminHash, 'admin', 'admin@gmail.com']);
        console.log('--- ĐÃ CẬP NHẬT TÀI KHOẢN ADMIN: admin@gmail.com / 123123123 ---');
      }

      // AUTO UPDATE LOGOS FOR EXISTING SERVICES ON STARTUP TO MATCH NEW LOGOS
      try {
        const [services]: any = await pool.query('SELECT id, name, logoUrl FROM services');
        let updatedCount = 0;
        for (const s of services) {
          const expectedLogo = getLogoForService(s.name);
          if (s.logoUrl !== expectedLogo) {
            await pool.query('UPDATE services SET logoUrl = ? WHERE id = ?', [expectedLogo, s.id]);
            updatedCount++;
          }
        }
        if (updatedCount > 0) {
          console.log(`--- ĐÃ TỰ ĐỘNG CẬP NHẬT LOGO CHO ${updatedCount} DỊCH VỤ HIỆN CÓ ---`);
        }
      } catch (err) {
        console.error('Lỗi khi tự động cập nhật logo dịch vụ:', err);
      }

      console.log('Database đã được chuẩn hóa và sẵn sàng (Dữ liệu giả lập đã bị xóa).');
    } catch (error) {
      console.error('Lỗi khi khởi tạo cơ sở dữ liệu MySQL:', error);
      throw error;
    }
  }

  // --- USER AUTHENTICATION & PROFILE ---
  async createUser(name: string, email: string, passwordHash: string, role = 'user'): Promise<any> {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let apiKey = 'api_sk_SMSVN_';
    for (let i = 0; i < 24; i++) {
      apiKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, passwordHash, apiKey, balance, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, apiKey, 0.0, role]
    );
    return { id: result.insertId, name, email, apiKey, balance: 0, role };
  }

  async getUserByEmail(email: string): Promise<any | null> {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  async getUserById(id: number): Promise<any | null> {
    const [rows]: any = await pool.query('SELECT id, name, email, balance, apiKey, is2FAEnabled, role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  async getUserByApiKey(apiKey: string): Promise<any | null> {
    const [rows]: any = await pool.query('SELECT id, name, email, balance, apiKey, role FROM users WHERE apiKey = ?', [apiKey]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  async updateUserBalance(userId: number, amount: number): Promise<void> {
    await pool.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);
  }

  async updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<any> {
    const sets: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      sets.push('name = ?');
      values.push(updates.name);
    }
    if (updates.apiKey !== undefined) {
      sets.push('apiKey = ?');
      values.push(updates.apiKey);
    }
    if (updates.is2FAEnabled !== undefined) {
      sets.push('is2FAEnabled = ?');
      values.push(updates.is2FAEnabled ? 1 : 0);
    }

    if (sets.length > 0) {
      values.push(userId);
      await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
    }

    return await this.getUserById(userId);
  }

  // --- RENTALS ---
  async getRentals(userId: number): Promise<Rental[]> {
    const [rows]: any = await pool.query('SELECT * FROM rentals WHERE userId = ? ORDER BY timestamp DESC', [userId]);
    return rows.map((r: any) => ({
      ...r,
      otpId: Number(r.otpId),
      simId: Number(r.simId),
      timeLeft: Number(r.timeLeft),
      maxTime: Number(r.maxTime),
      price: Number(r.price || 0),
    }));
  }

  // Cần thiết cho worker ngầm truy vấn tất cả các số đang chờ của tất cả các user
  async getAllRentals(): Promise<Rental[]> {
    const [rows]: any = await pool.query('SELECT * FROM rentals');
    return rows.map((r: any) => ({
      ...r,
      otpId: Number(r.otpId),
      simId: Number(r.simId),
      timeLeft: Number(r.timeLeft),
      maxTime: Number(r.maxTime),
      price: Number(r.price || 0),
    }));
  }

  async getRentalById(id: string): Promise<Rental | undefined> {
    const [rows]: any = await pool.query('SELECT * FROM rentals WHERE id = ?', [id]);
    if (rows.length === 0) return undefined;
    const r = rows[0];
    return {
      ...r,
      otpId: Number(r.otpId),
      simId: Number(r.simId),
      timeLeft: Number(r.timeLeft),
      maxTime: Number(r.maxTime),
      price: Number(r.price || 0),
    };
  }

  async getRentalByOtpId(otpId: number): Promise<Rental | undefined> {
    const [rows]: any = await pool.query('SELECT * FROM rentals WHERE otpId = ?', [otpId]);
    if (rows.length === 0) return undefined;
    const r = rows[0];
    return {
      ...r,
      otpId: Number(r.otpId),
      simId: Number(r.simId),
      timeLeft: Number(r.timeLeft),
      maxTime: Number(r.maxTime),
      price: Number(r.price || 0),
    };
  }

  async saveRental(rental: Rental): Promise<void> {
    const exists = await this.getRentalById(rental.id);
    if (exists) {
      await pool.query(
        'UPDATE rentals SET otpId = ?, simId = ?, serviceId = ?, serviceName = ?, logoUrl = ?, phoneNumber = ?, otpCode = ?, timeLeft = ?, maxTime = ?, status = ?, timestamp = ?, networkName = ?, userId = ?, price = ? WHERE id = ?',
        [
          rental.otpId,
          rental.simId,
          rental.serviceId,
          rental.serviceName,
          rental.logoUrl,
          rental.phoneNumber,
          rental.otpCode,
          rental.timeLeft,
          rental.maxTime,
          rental.status,
          rental.timestamp,
          rental.networkName,
          rental.userId,
          rental.price || 0,
          rental.id,
        ]
      );
    } else {
      await pool.query(
        'INSERT INTO rentals (id, userId, otpId, simId, serviceId, serviceName, logoUrl, phoneNumber, otpCode, timeLeft, maxTime, status, timestamp, networkName, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          rental.id,
          rental.userId,
          rental.otpId,
          rental.simId,
          rental.serviceId,
          rental.serviceName,
          rental.logoUrl,
          rental.phoneNumber,
          rental.otpCode,
          rental.timeLeft,
          rental.maxTime,
          rental.status,
          rental.timestamp,
          rental.networkName,
          rental.price || 0,
        ]
      );
    }
  }

  // --- TRANSACTIONS ---
  async getTransactions(userId: number): Promise<Transaction[]> {
    const [rows]: any = await pool.query('SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC', [userId]);
    return rows.map((t: any) => ({
      ...t,
      amount: Number(t.amount),
    }));
  }

  async addTransaction(tx: Transaction): Promise<void> {
    await pool.query(
      'INSERT INTO transactions (id, userId, type, amount, description, timestamp, status, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [tx.id, tx.userId, tx.type, tx.amount, tx.description, tx.timestamp, tx.status, tx.method || null]
    );
  }

  // --- SERVICES ---
  async getServices(): Promise<Service[]> {
    const [rows]: any = await pool.query('SELECT * FROM services');
    return rows.map((s: any) => ({
      ...s,
      price: Number(s.price),
      priceOriginal: Number(s.priceOriginal),
      isCustomPrice: Boolean(s.isCustomPrice),
      parentServiceId: s.parentServiceId || null,
      isActive: Boolean(s.isActive),
    }));
  }

  async saveServices(services: Service[]): Promise<void> {
    for (const service of services) {
      // Kiểm tra nếu dịch vụ đã được tùy chỉnh giá thủ công bởi admin
      const [rows]: any = await pool.query('SELECT isCustomPrice, price FROM services WHERE id = ?', [service.id]);
      if (rows.length > 0 && rows[0].isCustomPrice === 1) {
        // Chỉ cập nhật thông tin mô tả và giá gốc gốc từ API nguồn. Giữ nguyên giá bán tùy chỉnh.
        await pool.query(
          'UPDATE services SET name = ?, priceOriginal = ?, code = ?, logoUrl = ? WHERE id = ?',
          [service.name, service.priceOriginal, service.code, service.logoUrl, service.id]
        );
      } else {
        await pool.query(
          'INSERT INTO services (id, name, price, priceOriginal, code, logoUrl, isCustomPrice, parentServiceId, isActive) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1) ON DUPLICATE KEY UPDATE name = ?, price = ?, priceOriginal = ?, code = ?, logoUrl = ?, parentServiceId = COALESCE(parentServiceId, ?)',
          [
            service.id,
            service.name,
            service.price,
            service.priceOriginal,
            service.code,
            service.logoUrl,
            service.parentServiceId || service.id, // mặc định ánh xạ parentServiceId vào chính nó khi đồng bộ
            service.name,
            service.price,
            service.priceOriginal,
            service.code,
            service.logoUrl,
            service.parentServiceId || service.id,
          ]
        );
      }
    }
  }
}

export const db = new Database();
