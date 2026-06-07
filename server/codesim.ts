import dotenv from 'dotenv';
import { getCachedSetting } from './db';
import { getLogoForService } from './logoUtils';

dotenv.config();

const API_KEY = process.env.CODESIM_API_KEY || '';
const BASE_URL = 'https://apisim.codesim.net';

// Hàm tính toán giá bán đại lý (Reseller Price)
export function calculateResellPrice(originalPrice: number): number {
  const flatMarkup = Number(getCachedSetting('markup_flat', '200'));
  const percentMarkup = Number(getCachedSetting('markup_percent', '1.15'));
  
  let resellPrice = originalPrice * percentMarkup + flatMarkup;
  
  // Làm tròn lên hàng trăm đồng cho đẹp (ví dụ: 1250đ -> 1300đ)
  return Math.ceil(resellPrice / 100) * 100;
}

export class CodeSimService {
  private static getApiKey(): string {
    if (!API_KEY || API_KEY.includes('YOUR_CODESIM_API_KEY')) {
      console.warn('Cảnh báo: CODESIM_API_KEY chưa được cấu hình chính xác trong file .env');
    }
    return API_KEY;
  }

  // 1. Lấy thông tin tài khoản nguồn
  static async getAccountInfo() {
    const key = this.getApiKey();
    const res = await fetch(`${BASE_URL}/yourself/information-by-api-key?api_key=${key}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  // 2. Lấy danh sách dịch vụ
  static async getServices() {
    const key = this.getApiKey();
    const res = await fetch(`${BASE_URL}/service/get_service_by_api_key?api_key=${key}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const result = await res.json();
    if (result.status === 200 && Array.isArray(result.data)) {
      return result.data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        code: item.code,
        priceOriginal: item.price,
        price: calculateResellPrice(item.price),
        logoUrl: getLogoForService(item.name),
      }));
    }
    return [];
  }

  // 3. Lấy danh sách nhà mạng
  static async getNetworks() {
    const key = this.getApiKey();
    const res = await fetch(`${BASE_URL}/network/get-network-by-api-key?api_key=${key}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const result = await res.json();
    if (result.status === 200 && Array.isArray(result.data)) {
      return result.data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        code: item.code,
      }));
    }
    return [];
  }

  // 4. Thuê số điện thoại
  static async rentSIM(serviceId: string, networkId?: string, phonePrefix?: string) {
    const key = this.getApiKey();
    let url = `${BASE_URL}/sim/get_sim?service_id=${serviceId}&api_key=${key}`;
    if (networkId) {
      url += `&network_id=${networkId}`;
    }
    if (phonePrefix) {
      url += `&phone=${phonePrefix}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  // 5. Kiểm tra trạng thái OTP
  static async checkOTP(otpId: number) {
    const key = this.getApiKey();
    const res = await fetch(`${BASE_URL}/otp/get_otp_by_phone_api_key?otp_id=${otpId}&api_key=${key}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  // 6. Hủy số đang thuê
  static async cancelSIM(simId: number) {
    const key = this.getApiKey();
    const res = await fetch(`${BASE_URL}/sim/cancel_api_key/${simId}?api_key=${key}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  // 7. Thuê lại số điện thoại
  static async reuseSIM(phone: string, serviceId: string) {
    const key = this.getApiKey();
    const res = await fetch(`${BASE_URL}/sim/reuse_by_phone_api_key?phone=${phone}&service_id=${serviceId}&api_key=${key}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

}
