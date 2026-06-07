export interface UserProfile {
  name: string;
  email: string;
  balance: number;
  apiKey: string;
  is2FAEnabled: boolean;
  role?: string;
}

export type RentalStatus = 'waiting' | 'received' | 'expired' | 'completed';

export interface Rental {
  id: string; // ID hệ thống Reseller của bạn
  userId: number; // ID của tài khoản thuê
  otpId: number; // OTP ID từ đối tác CodeSim
  simId: number; // SIM ID từ đối tác CodeSim
  serviceId: string;
  serviceName: string;
  logoUrl: string;
  phoneNumber: string;
  otpCode: string | null;
  timeLeft: number; // Tính bằng giây
  maxTime: number; // Thời gian sống tối đa
  status: RentalStatus;
  timestamp: string;
  networkName: string;
  price: number; // Giá thuê thực tế tại thời điểm thuê
}

export type TransactionType = 'deposit' | 'rent' | 'refund';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  userId: number; // ID của tài khoản thực hiện giao dịch
  type: TransactionType;
  amount: number;
  description: string;
  timestamp: string;
  status: TransactionStatus;
  method?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number; // Giá bán đại lý (giá gốc + markup)
  priceOriginal: number; // Giá gốc từ nguồn
  code: string;
  logoUrl: string;
  isCustomPrice?: number | boolean;
  parentServiceId?: string | null;
  isActive?: number | boolean;
}

export interface Network {
  id: string;
  name: string;
  code: string;
}
