const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sms_reseller',
  port: Number(process.env.DB_PORT) || 3306,
};

async function listUsers() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT id, name, email, role FROM users');
    console.log('--- DANH SÁCH USER TRONG DATABASE ---');
    console.log(rows);
    console.log('------------------------------------');
    await connection.end();
  } catch (error) {
    console.error('Lỗi truy vấn users:', error);
  } finally {
    process.exit(0);
  }
}

listUsers();
