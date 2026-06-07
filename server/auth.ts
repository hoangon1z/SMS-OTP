import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_sms_reseller_key_12345';

// Sử dụng kiểu Request mở rộng (any) để tránh lỗi kiểu dữ liệu TypeScript khi thêm các trường tự định nghĩa
export async function authenticateRequest(req: any, res: Response, next: NextFunction) {
  try {
    // 1. Kiểm tra JWT Token trong Header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
        if (err) {
          return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
        
        const user = await db.getUserById(decoded.id);
        if (!user) {
          return res.status(404).json({ error: 'Tài khoản không tồn tại trên hệ thống.' });
        }
        if (user.role === 'blocked') {
          return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
        }

        req.userId = decoded.id;
        req.user = user; // { id, name, email, balance, apiKey, role }
        next();
      });
      return;
    }

    // 2. Kiểm tra API Key trong Header hoặc Query params (Dành cho tool MMO tự động)
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (apiKey) {
      const user = await db.getUserByApiKey(String(apiKey));
      if (user) {
        if (user.role === 'blocked') {
          return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
        }
        req.userId = user.id;
        req.user = user;
        next();
        return;
      } else {
        return res.status(401).json({ error: 'API Key không hợp lệ.' });
      }
    }

    // 3. Nếu không có hình thức xác thực nào
    return res.status(401).json({ error: 'Vui lòng đăng nhập hoặc cấu hình API Key để tiếp tục.' });
  } catch (error) {
    console.error('Lỗi trong Auth Middleware:', error);
    return res.status(500).json({ error: 'Lỗi xác thực hệ thống.' });
  }
}


export function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Chỉ dành cho quản trị viên.' });
  }
}
