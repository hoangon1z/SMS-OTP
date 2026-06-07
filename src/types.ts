export interface Service {
  id: string;
  name: string;
  price: number;
  logoUrl: string;
  successRate?: number;
  defaultAvgResponseTime?: string;
  priceOriginal?: number;
  code?: string;
  isCustomPrice?: boolean;
  parentServiceId?: string | null;
  isActive?: boolean;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flagCode: string; // flag indicator
}

export type RentalStatus = 'waiting' | 'received' | 'expired' | 'completed';

export interface Rental {
  id: string;
  serviceId: string;
  serviceName: string;
  logoUrl: string;
  phoneNumber: string;
  otpCode: string | null;
  timeLeft: number; // in seconds
  maxTime: number; // in seconds (e.g. 900 for 15 minutes)
  status: RentalStatus;
  timestamp: string;
  countryName: string;
  price: number; // actual price charged
}

export type TransactionType = 'deposit' | 'rent' | 'refund';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  timestamp: string;
  status: TransactionStatus;
  method?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  balance: number;
  level: string;
  apiKey: string;
  is2FAEnabled: boolean;
  role?: string;
}
