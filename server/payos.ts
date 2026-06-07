import { PayOS } from '@payos/node';
import dotenv from 'dotenv';
import { getCachedSetting } from './db';

dotenv.config();

export function getPayOSInstance() {
  let clientId = (process.env.PAYOS_CLIENT_ID || '').trim();
  let apiKey = (process.env.PAYOS_API_KEY || '').trim();
  let checksumKey = (process.env.PAYOS_CHECKSUM_KEY || '').trim();

  const isEnvValid = (
    clientId && clientId !== 'YOUR_PAYOS_CLIENT_ID_HERE' &&
    apiKey && apiKey !== 'YOUR_PAYOS_API_KEY_HERE' &&
    checksumKey && checksumKey !== 'YOUR_PAYOS_CHECKSUM_KEY_HERE'
  );

  if (!isEnvValid) {
    clientId = getCachedSetting('payos_client_id', '');
    apiKey = getCachedSetting('payos_api_key', '');
    checksumKey = getCachedSetting('payos_checksum_key', '');
  }
  
  if (!clientId || !apiKey || !checksumKey) {
    throw new Error('Cổng thanh toán VietQR (PayOS) chưa được quản trị viên cấu hình API.');
  }
  
  return new PayOS({
    clientId,
    apiKey,
    checksumKey
  });
}

