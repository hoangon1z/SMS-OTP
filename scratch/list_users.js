import { pool } from '../server/db.js';

async function listUsers() {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role FROM users');
    console.log('--- DANH SÁCH USER TRONG DATABASE ---');
    console.log(rows);
    console.log('------------------------------------');
  } catch (error) {
    console.error('Lỗi truy vấn users:', error);
  } finally {
    process.exit(0);
  }
}

listUsers();
