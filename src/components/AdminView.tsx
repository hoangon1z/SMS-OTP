import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  ShieldAlert,
  Users,
  Settings,
  DollarSign,
  Search,
  RefreshCw,
  Coins,
  Shield,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface AdminViewProps {
  userProfile: UserProfile;
  addToast: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

interface AdminStats {
  totalUsers: number;
  totalUserBalance: number;
  totalRentals: number;
  successRentals: number;
  totalProfit: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  balance: number;
  apiKey: string;
  is2FAEnabled: boolean;
  role: string;
}

interface AdminService {
  id: string;
  name: string;
  price: number;
  priceOriginal: number;
  code: string;
  logoUrl: string;
  isCustomPrice: boolean;
  parentServiceId: string | null;
  isActive: boolean;
}

export default function AdminView({ userProfile, addToast }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'services' | 'gateways' | 'usdt_deposits'>('users');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalUserBalance: 0,
    totalRentals: 0,
    successRentals: 0,
    totalProfit: 0,
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // Modals state
  const [balanceModalUser, setBalanceModalUser] = useState<AdminUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  
  const [priceModalService, setPriceModalService] = useState<AdminService | null>(null);
  const [customPrice, setCustomPrice] = useState('');

  // Global price markup states
  const [globalFlat, setGlobalFlat] = useState('200');
  const [globalPercent, setGlobalPercent] = useState('1.15');
  const [globalApplyToCustom, setGlobalApplyToCustom] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Bulk pricing states
  const [bulkAction, setBulkAction] = useState('increase_flat');
  const [bulkValue, setBulkValue] = useState('');
  const [bulkApplyToCustom, setBulkApplyToCustom] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Gateway Settings states
  const [payosClientId, setPayosClientId] = useState('');
  const [payosApiKey, setPayosApiKey] = useState('');
  const [payosChecksumKey, setPayosChecksumKey] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState('TRC20');
  const [usdtRate, setUsdtRate] = useState('25000');
  const [gatewaysLoading, setGatewaysLoading] = useState(false);
  const [gatewaysSaving, setGatewaysSaving] = useState(false);

  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankOwner, setBankOwner] = useState('');
  const [bankQrTemplate, setBankQrTemplate] = useState('compact');
  const [supportLink, setSupportLink] = useState('');

  // USDT deposits state
  const [usdtDeposits, setUsdtDeposits] = useState<any[]>([]);
  const [usdtDepositsLoading, setUsdtDepositsLoading] = useState(false);
  const [usdtActionLoading, setUsdtActionLoading] = useState<string | null>(null);

  // Advanced User Management states
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);
  const [inspectLogsTab, setInspectLogsTab] = useState<'transactions' | 'rentals'>('transactions');
  const [inspectTransactions, setInspectTransactions] = useState<any[]>([]);
  const [inspectRentals, setInspectRentals] = useState<any[]>([]);

  // States cho quản lý và thêm/sửa dịch vụ tùy chỉnh
  const [parentServices, setParentServices] = useState<any[]>([]);
  const [syncingLoading, setSyncingLoading] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [formDataName, setFormDataName] = useState('');
  const [formDataCode, setFormDataCode] = useState('');
  const [formDataLogoUrl, setFormDataLogoUrl] = useState('');
  const [formDataParentId, setFormDataParentId] = useState('');
  const [formDataIsCustomPrice, setFormDataIsCustomPrice] = useState(false);
  const [formDataPrice, setFormDataPrice] = useState('');
  const [serviceModalSubmitting, setServiceModalSubmitting] = useState(false);
  const [inspectLoading, setInspectLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMarkupSettings = async () => {
    try {
      const res = await fetch('/api/admin/markup-settings');
      if (res.ok) {
        const data = await res.json();
        setGlobalFlat(String(data.markupFlat));
        setGlobalPercent(String(data.markupPercent));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGatewaySettings = async () => {
    setGatewaysLoading(true);
    try {
      const res = await fetch('/api/admin/gateway-settings');
      if (res.ok) {
        const data = await res.json();
        setPayosClientId(data.payosClientId || '');
        setPayosApiKey(data.payosApiKey || '');
        setPayosChecksumKey(data.payosChecksumKey || '');
        setUsdtAddress(data.usdtAddress || '');
        setUsdtNetwork(data.usdtNetwork || 'TRC20');
        setUsdtRate(String(data.usdtRate || '25000'));
        setBankName(data.bankName || 'MB Bank');
        setBankAccount(data.bankAccount || '9999999999');
        setBankOwner(data.bankOwner || 'NGUYEN VAN A');
        setBankQrTemplate(data.bankQrTemplate || 'compact');
        setSupportLink(data.supportLink || 'https://t.me/your_telegram_support');
      }
    } catch (err) {
      console.error(err);
      addToast('Không thể tải cấu hình cổng thanh toán.', 'warn');
    } finally {
      setGatewaysLoading(false);
    }
  };

  const fetchUsdtDeposits = async () => {
    setUsdtDepositsLoading(true);
    try {
      const res = await fetch('/api/admin/pending-deposits');
      if (res.ok) {
        const data = await res.json();
        setUsdtDeposits(data);
      }
    } catch (err) {
      console.error(err);
      addToast('Không thể tải danh sách nạp tiền chờ duyệt.', 'warn');
    } finally {
      setUsdtDepositsLoading(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    const promises: Promise<any>[] = [fetchStats(), fetchUsers(), fetchServices(), fetchMarkupSettings()];
    if (activeTab === 'gateways') {
      promises.push(fetchGatewaySettings());
    } else if (activeTab === 'usdt_deposits') {
      promises.push(fetchUsdtDeposits());
    }
    await Promise.all(promises);
    setLoading(false);
  };

  const fetchParentServices = async () => {
    try {
      const res = await fetch('/api/admin/parent-services');
      if (res.ok) {
        const data = await res.json();
        setParentServices(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dịch vụ web cha:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'gateways') {
      fetchGatewaySettings();
    } else if (activeTab === 'usdt_deposits') {
      fetchUsdtDeposits();
    } else if (activeTab === 'services') {
      fetchParentServices();
    }
  }, [activeTab]);

  useEffect(() => {
    if (inspectUser) {
      const fetchInspectData = async () => {
        setInspectLoading(true);
        try {
          const [txsRes, rentalsRes] = await Promise.all([
            fetch(`/api/admin/users/${inspectUser.id}/transactions`),
            fetch(`/api/admin/users/${inspectUser.id}/rentals`),
          ]);

          if (txsRes.ok) {
            const txs = await txsRes.json();
            setInspectTransactions(txs);
          }
          if (rentalsRes.ok) {
            const rentals = await rentalsRes.json();
            setInspectRentals(rentals);
          }
        } catch (err) {
          console.error(err);
          addToast('Lỗi khi tải nhật ký hoạt động thành viên.', 'warn');
        } finally {
          setInspectLoading(false);
        }
      };
      fetchInspectData();
    } else {
      setInspectTransactions([]);
      setInspectRentals([]);
    }
  }, [inspectUser]);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser) return;
    const amount = Number(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      addToast('Vui lòng nhập số tiền điều chỉnh hợp lệ (khác 0).', 'warn');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${balanceModalUser.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustAmount: amount, note: adjustNote }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Điều chỉnh số dư thành công!', 'success');
        setBalanceModalUser(null);
        setAdjustAmount('');
        setAdjustNote('');
        loadAllData();
      } else {
        addToast(data.error || 'Điều chỉnh số dư thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    if (user.email === userProfile.email) {
      addToast('Bạn không thể tự hạ cấp vai trò quản trị của chính mình.', 'warn');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn chuyển đổi quyền của ${user.name} thành ${nextRole.toUpperCase()}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Thay đổi quyền thành công!', 'success');
        loadAllData();
      } else {
        addToast(data.error || 'Thay đổi quyền thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    }
  };

  const handleToggleBlock = async (user: AdminUser) => {
    if (user.email === userProfile.email) {
      addToast('Bạn không thể tự khóa tài khoản của chính mình.', 'warn');
      return;
    }

    const isBlocked = user.role === 'blocked';
    const nextRole = isBlocked ? 'user' : 'blocked';
    const confirmMessage = isBlocked
      ? `Bạn có chắc muốn MỞ KHÓA tài khoản của ${user.name}?`
      : `Bạn có chắc muốn KHÓA tài khoản của ${user.name}? Thành viên này sẽ không thể gọi API hoặc truy cập bảng điều khiển.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Cập nhật trạng thái tài khoản thành công!', 'success');
        loadAllData();
      } else {
        addToast(data.error || 'Thao tác thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (newPassword.length < 6) {
      addToast('Mật khẩu phải chứa ít nhất 6 ký tự.', 'warn');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetPasswordUser.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Đặt lại mật khẩu thành công!', 'success');
        setResetPasswordUser(null);
        setNewPassword('');
      } else {
        addToast(data.error || 'Đặt lại mật khẩu thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleSaveGatewaySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewaysSaving(true);
    try {
      const res = await fetch('/api/admin/gateway-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payosClientId: payosClientId.trim(),
          payosApiKey: payosApiKey.trim(),
          payosChecksumKey: payosChecksumKey.trim(),
          usdtAddress: usdtAddress.trim(),
          usdtNetwork: usdtNetwork.trim(),
          usdtRate: Number(usdtRate),
          bankName: bankName.trim(),
          bankAccount: bankAccount.trim(),
          bankOwner: bankOwner.trim(),
          bankQrTemplate: bankQrTemplate,
          supportLink: supportLink.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Cập nhật cấu hình cổng thanh toán thành công!', 'success');
      } else {
        addToast(data.error || 'Cập nhật thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    } finally {
      setGatewaysSaving(false);
    }
  };

  const handleUsdtAction = async (id: string, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'Phê duyệt' : 'Từ chối';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} yêu cầu nạp tiền này không?`)) {
      return;
    }

    setUsdtActionLoading(id);
    try {
      const res = await fetch(`/api/admin/pending-deposits/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || `${actionText} yêu cầu thành công!`, 'success');
        fetchUsdtDeposits();
        fetchStats();
      } else {
        addToast(data.error || 'Thao tác thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    } finally {
      setUsdtActionLoading(null);
    }
  };

  const openServiceModal = (service: AdminService | null) => {
    if (service) {
      setEditingService(service);
      setFormDataName(service.name);
      setFormDataCode(service.code);
      setFormDataLogoUrl(service.logoUrl);
      setFormDataParentId(service.parentServiceId || '');
      setFormDataIsCustomPrice(service.isCustomPrice);
      setFormDataPrice(String(service.price));
    } else {
      setEditingService(null);
      setFormDataName('');
      setFormDataCode('');
      setFormDataLogoUrl('');
      setFormDataParentId('');
      setFormDataIsCustomPrice(false);
      setFormDataPrice('');
    }
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDataName || !formDataCode) {
      addToast('Vui lòng điền đầy đủ Tên và Mã code dịch vụ.', 'warn');
      return;
    }

    setServiceModalSubmitting(true);
    try {
      const url = editingService 
        ? `/api/admin/services/${editingService.id}/edit`
        : '/api/admin/services/add';
      const method = editingService ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formDataName,
          code: formDataCode,
          logoUrl: formDataLogoUrl,
          parentServiceId: formDataParentId || null,
          price: Number(formDataPrice) || 0,
          isCustomPrice: formDataIsCustomPrice,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Lưu dịch vụ thành công!', 'success');
        setServiceModalOpen(false);
        loadAllData();
      } else {
        addToast(data.error || 'Lưu thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    } finally {
      setServiceModalSubmitting(false);
    }
  };

  const handleToggleService = async (service: AdminService) => {
    try {
      const nextActive = !service.isActive;
      const res = await fetch(`/api/admin/services/${service.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });

      if (res.ok) {
        addToast(`Đã ${nextActive ? 'bật hiển thị' : 'tắt hiển thị'} dịch vụ thành công!`, 'success');
        loadAllData();
      } else {
        const data = await res.json();
        addToast(data.error || 'Cập nhật trạng thái thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này không?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        addToast('Xóa dịch vụ thành công!', 'success');
        loadAllData();
      } else {
        const data = await res.json();
        addToast(data.error || 'Xóa thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    }
  };

  const handleSyncServices = async () => {
    setSyncingLoading(true);
    try {
      const res = await fetch('/api/admin/services/sync', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Đồng bộ dịch vụ thành công!', 'success');
        loadAllData();
      } else {
        addToast(data.error || 'Đồng bộ thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    } finally {
      setSyncingLoading(false);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalService) return;
    const priceVal = Number(customPrice);
    
    if (isNaN(priceVal) || priceVal < priceModalService.priceOriginal) {
      addToast(`Giá mới không được thấp hơn giá gốc nhập từ cổng đối tác (${priceModalService.priceOriginal}đ).`, 'warn');
      return;
    }

    try {
      const res = await fetch(`/api/admin/services/${priceModalService.id}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: priceVal, isCustom: true }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Cấu hình giá bán dịch vụ thành công!', 'success');
        setPriceModalService(null);
        setCustomPrice('');
        loadAllData();
      } else {
        addToast(data.error || 'Thay đổi giá thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    }
  };

  const handleResetPrice = async (service: AdminService) => {
    if (!window.confirm(`Bạn muốn khôi phục giá của dịch vụ ${service.name} về tính toán tự động?`)) {
      return;
    }

    try {
      // Gọi API với giá gốc hoặc mặc định, isCustom = false để chuyển về chế độ tự động
      const res = await fetch(`/api/admin/services/${service.id}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: service.priceOriginal, isCustom: false }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast('Đã khôi phục giá bán tự động thành công!', 'success');
        loadAllData();
      } else {
        addToast(data.error || 'Khôi phục giá thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    }
  };

  const handleSaveGlobalMarkup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/admin/markup-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markupFlat: Number(globalFlat),
          markupPercent: Number(globalPercent),
          applyToCustom: globalApplyToCustom
        })
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Cập nhật cấu hình giá bán chung thành công!', 'success');
        loadAllData();
      } else {
        addToast(data.error || 'Cập nhật cấu hình thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(bulkValue);
    if (bulkAction !== 'reset_auto' && (isNaN(val) || val <= 0)) {
      addToast('Vui lòng nhập giá trị điều chỉnh hợp lệ (> 0).', 'warn');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn thực hiện thay đổi giá bán hàng loạt này?')) {
      return;
    }

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/services/bulk-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          value: bulkAction === 'reset_auto' ? 0 : val,
          applyToCustom: bulkApplyToCustom
        })
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Điều chỉnh giá hàng loạt thành công!', 'success');
        setBulkValue('');
        loadAllData();
      } else {
        addToast(data.error || 'Điều chỉnh giá thất bại.', 'warn');
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi kết nối máy chủ.', 'warn');
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-[#0047ab]" />
            Quản trị Hệ thống (Admin)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý dòng tiền thành viên, cấu hình bảng giá bán dịch vụ và theo dõi hiệu suất reseller.
          </p>
        </div>
        <button
          onClick={loadAllData}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 self-start bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-[0.98]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat item 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0047ab] flex-shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng thành viên</p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.totalUsers}</p>
          </div>
        </div>

        {/* Stat item 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-700 flex-shrink-0">
            <Coins size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số dư thành viên</p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.totalUserBalance.toLocaleString('vi-VN')}đ</p>
          </div>
        </div>

        {/* Stat item 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 flex-shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng đơn thuê SIM</p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.totalRentals} SIM</p>
          </div>
        </div>

        {/* Stat item 4 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-700 flex-shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lợi nhuận chênh lệch</p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.totalProfit.toLocaleString('vi-VN')}đ</p>
          </div>
        </div>
      </div>

      {/* Tab select controller */}
      <div className="bg-white border border-slate-200 p-1.5 rounded-xl flex flex-wrap gap-1 shadow-sm w-full md:max-w-xl">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[120px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'users' ? 'bg-[#d5e3fd] text-[#00327d]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Quản lý Thành viên
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 min-w-[120px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'services' ? 'bg-[#d5e3fd] text-[#00327d]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Cấu hình Giá Dịch vụ
        </button>
        <button
          onClick={() => setActiveTab('gateways')}
          className={`flex-1 min-w-[120px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'gateways' ? 'bg-[#d5e3fd] text-[#00327d]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Cấu hình Cổng
        </button>
        <button
          onClick={() => setActiveTab('usdt_deposits')}
          className={`flex-1 min-w-[120px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'usdt_deposits' ? 'bg-[#d5e3fd] text-[#00327d]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Duyệt nạp tiền
        </button>
      </div>

      {/* Main admin panels */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {activeTab === 'users' ? (
          /* USERS MANAGEMENT VIEW PANEL */
          <div className="divide-y divide-slate-100">
            {/* Filter */}
            <div className="p-5 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-slate-800">Danh sách tài khoản hệ thống</h3>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm thành viên, email..."
                  className="w-full bg-white border border-slate-200 text-xs font-semibold pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-[#0047ab] placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">ID</th>
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Địa chỉ email</th>
                    <th className="p-4 text-right">Số dư ví</th>
                    <th className="p-4 text-center">Vai trò</th>
                    <th className="p-4 pr-6 text-center">Thao tác quản lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">Không tìm thấy tài khoản phù hợp.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 pl-6 font-mono text-slate-400">#{u.id}</td>
                        <td className="p-4 font-bold text-slate-800">{u.name}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4 text-right font-bold text-slate-800">{u.balance.toLocaleString('vi-VN')} VNĐ</td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : u.role === 'blocked'
                                ? 'bg-slate-100 text-slate-500 border border-slate-200 line-through'
                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}
                          >
                            {u.role === 'blocked' ? 'Đã Khóa' : u.role}
                          </span>
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <button
                              onClick={() => setBalanceModalUser(u)}
                              className="inline-flex items-center gap-1 bg-[#0047ab] hover:bg-[#00327d] text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              title="Cộng/Trừ tiền ví"
                            >
                              <Coins size={10} />
                              Ví tiền
                            </button>
                            <button
                              onClick={() => handleToggleRole(u)}
                              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              title="Chuyển quyền Admin / User"
                            >
                              <Shield size={10} />
                              Quyền
                            </button>
                            <button
                              onClick={() => handleToggleBlock(u)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                u.role === 'blocked'
                                  ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                                  : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                              }`}
                              title={u.role === 'blocked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            >
                              <ShieldAlert size={10} />
                              {u.role === 'blocked' ? 'Mở Khóa' : 'Khóa'}
                            </button>
                            <button
                              onClick={() => {
                                setResetPasswordUser(u);
                                setNewPassword('');
                              }}
                              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              title="Đặt lại mật khẩu mới"
                            >
                              Mật khẩu
                            </button>
                            <button
                              onClick={() => {
                                setInspectUser(u);
                                setInspectLogsTab('transactions');
                              }}
                              className="inline-flex items-center gap-1 bg-[#d5e3fd] hover:bg-[#b0ccfc] text-[#00327d] px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              title="Xem lịch sử giao dịch và thuê SIM"
                            >
                              Nhật ký
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'services' ? (
          /* SERVICES PRICE OVERRIDES MANAGEMENT PANEL */
          <div className="divide-y divide-slate-100">
            {/* Global Settings & Bulk Adjust Forms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/30 border-b border-slate-100">
              {/* Form 1: Global Markup */}
              <form onSubmit={handleSaveGlobalMarkup} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#0047ab] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Settings size={14} />
                    Cấu hình tỷ lệ giá chung (Global Markup Rules)
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Giá bán tự động = <code>Giá gốc đối tác * Tỷ lệ + Phụ phí</code>.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tỷ lệ (Ví dụ: 1.15 = +15%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={globalPercent}
                        onChange={(e) => setGlobalPercent(e.target.value)}
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cộng thêm (+ VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={globalFlat}
                        onChange={(e) => setGlobalFlat(e.target.value)}
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="globalApplyToCustom"
                      checked={globalApplyToCustom}
                      onChange={(e) => setGlobalApplyToCustom(e.target.checked)}
                      className="h-4 w-4 accent-[#0047ab] cursor-pointer"
                    />
                    <label htmlFor="globalApplyToCustom" className="text-[10px] font-bold text-slate-500 cursor-pointer select-none">
                      Ghi đè và hủy bỏ toàn bộ giá tự đặt thủ công (Reset Locks)
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={globalLoading}
                  className="w-full mt-4 bg-[#0047ab] hover:bg-[#00327d] text-white py-2.5 px-4 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {globalLoading ? 'Đang cập nhật...' : 'Lưu & tính toán lại bảng giá'}
                </button>
              </form>

              {/* Form 2: Bulk Pricing Actions */}
              <form onSubmit={handleBulkAdjust} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <RefreshCw size={14} className="text-[#0047ab]" />
                    Thay đổi giá đồng loạt (Bulk Actions)
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Áp dụng tăng, giảm, khôi phục giá hàng loạt cho toàn bộ dịch vụ.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chọn thao tác</label>
                      <select
                        value={bulkAction}
                        onChange={(e) => {
                          setBulkAction(e.target.value);
                          if (e.target.value === 'reset_auto') setBulkValue('0');
                        }}
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-2.5 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      >
                        <option value="increase_flat">Cộng thêm số tiền (+đ)</option>
                        <option value="decrease_flat">Trừ bớt số tiền (-đ)</option>
                        <option value="increase_percent">Tăng theo phần trăm (+%)</option>
                        <option value="decrease_percent">Giảm theo phần trăm (-%)</option>
                        <option value="reset_auto">Khôi phục về Auto (Reset)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Giá trị điều chỉnh {bulkAction.includes('percent') ? '(%)' : '(VNĐ)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        disabled={bulkAction === 'reset_auto'}
                        placeholder={bulkAction === 'reset_auto' ? 'Không yêu cầu' : 'Ví dụ: 500 hoặc 10'}
                        value={bulkValue}
                        onChange={(e) => setBulkValue(e.target.value)}
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#0047ab] disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="bulkApplyToCustom"
                      checked={bulkApplyToCustom}
                      disabled={bulkAction === 'reset_auto'}
                      onChange={(e) => setBulkApplyToCustom(e.target.checked)}
                      className="h-4 w-4 accent-[#0047ab] cursor-pointer disabled:opacity-50"
                    />
                    <label htmlFor="bulkApplyToCustom" className="text-[10px] font-bold text-slate-500 cursor-pointer select-none disabled:opacity-50">
                      Áp dụng thay đổi cho cả các dịch vụ tự cấu hình
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {bulkLoading ? 'Đang thực thi...' : 'Xác nhận thực hiện thay đổi'}
                </button>
              </form>
            </div>

            {/* Filter and custom actions */}
            <div className="p-5 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <button
                  onClick={handleSyncServices}
                  disabled={syncingLoading}
                  className="inline-flex items-center gap-1.5 bg-[#0047ab] hover:bg-[#00327d] text-white px-3 py-2 rounded-lg font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm text-xs"
                >
                  <RefreshCw size={14} className={syncingLoading ? "animate-spin" : ""} />
                  {syncingLoading ? 'Đang đồng bộ...' : 'Đồng bộ từ web cha'}
                </button>
                <button
                  onClick={() => openServiceModal(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
                >
                  + Thêm dịch vụ tùy chỉnh
                </button>
              </div>
              
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Tìm dịch vụ..."
                  className="w-full bg-white border border-slate-200 text-xs font-semibold pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-[#0047ab] placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Dịch vụ</th>
                    <th className="p-4">Mã Code</th>
                    <th className="p-4">Ánh xạ nguồn</th>
                    <th className="p-4 text-right">Giá gốc (Nguồn)</th>
                    <th className="p-4 text-right">Giá bán</th>
                    <th className="p-4 text-center">Hiển thị</th>
                    <th className="p-4 text-center">Cấu hình</th>
                    <th className="p-4 pr-6 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">Không tìm thấy dịch vụ phù hợp.</td>
                    </tr>
                  ) : (
                    filteredServices.map((s) => {
                      const parentName = parentServices.find(p => String(p.id) === String(s.parentServiceId))?.name || s.parentServiceId || 'Tự động';
                      return (
                        <tr key={s.id} className={`hover:bg-slate-50/30 transition-colors ${!s.isActive ? 'opacity-60 bg-slate-50/40' : ''}`}>
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <img 
                                src={s.logoUrl} 
                                alt={s.name} 
                                className="w-6 h-6 object-contain rounded-md" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/846/846480.png';
                                }}
                              />
                              <span className="font-bold text-slate-800">{s.name}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono uppercase text-slate-400">{s.code}</td>
                          <td className="p-4">
                            <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                              {parentName}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-500">{s.priceOriginal.toLocaleString('vi-VN')}đ</td>
                          <td className="p-4 text-right font-bold text-[#0047ab]">{s.price.toLocaleString('vi-VN')}đ</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleService(s)}
                              className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                                s.isActive
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {s.isActive ? 'Đang hiện' : 'Đang ẩn'}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            {s.isCustomPrice ? (
                              <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-yellow-50 border border-yellow-100 text-yellow-700">
                                Cố định (Custom)
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-green-50 border border-green-100 text-green-700">
                                Tự Động (Auto)
                              </span>
                            )}
                          </td>
                          <td className="p-4 pr-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openServiceModal(s)}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded font-bold cursor-pointer transition-colors"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteService(s.id)}
                                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-2.5 py-1 rounded font-bold cursor-pointer transition-colors"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'gateways' ? (
          /* GATEWAY CONFIGURATION VIEW PANEL */
          <div className="p-6 bg-white space-y-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Settings size={16} className="text-[#0047ab]" />
              Cấu hình Cổng Thanh toán Ngân hàng & USDT
            </h3>
            {gatewaysLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="animate-spin text-[#0047ab]" size={24} />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang tải cấu hình...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveGatewaySettings} className="space-y-6 max-w-2xl">
                {/* PayOS Config section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    Cổng nạp VietQR (PayOS Parameters)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PayOS Client ID</label>
                      <input
                        type="text"
                        value={payosClientId}
                        onChange={(e) => setPayosClientId(e.target.value)}
                        placeholder="Nhập Client ID..."
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PayOS API Key</label>
                      <input
                        type="password"
                        value={payosApiKey}
                        onChange={(e) => setPayosApiKey(e.target.value)}
                        placeholder="Nhập API Key..."
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PayOS Checksum Key</label>
                    <input
                      type="password"
                      value={payosChecksumKey}
                      onChange={(e) => setPayosChecksumKey(e.target.value)}
                      placeholder="Nhập Checksum Key..."
                      className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                    />
                  </div>
                </div>

                {/* USDT Config section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Cổng nạp Crypto (USDT Gateway)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mạng lưới USDT</label>
                      <select
                        value={usdtNetwork}
                        onChange={(e) => setUsdtNetwork(e.target.value)}
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-2.5 py-2.5 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      >
                        <option value="TRC20">TRON Network (TRC20)</option>
                        <option value="ERC20">Ethereum Network (ERC20)</option>
                        <option value="BEP20">BNB Smart Chain (BEP20)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tỷ giá nạp (VNĐ / 1 USDT)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={usdtRate}
                        onChange={(e) => setUsdtRate(e.target.value)}
                        placeholder="Ví dụ: 25000"
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Địa chỉ ví nhận tiền</label>
                    <input
                      type="text"
                      required
                      value={usdtAddress}
                      onChange={(e) => setUsdtAddress(e.target.value)}
                      placeholder="Nhập địa chỉ ví nhận USDT..."
                      className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab] font-mono"
                    />
                  </div>
                </div>

                {/* VietQR Manual Config section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Cấu hình chuyển khoản VietQR thủ công (Fallback)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tên ngân hàng (Bank ID, ví dụ: MB, VCB, ACB)</label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="MB, Vietcombank, Techcombank..."
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Số tài khoản nhận</label>
                      <input
                        type="text"
                        required
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="Nhập số tài khoản..."
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab] font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chủ tài khoản (Tên viết hoa không dấu)</label>
                      <input
                        type="text"
                        required
                        value={bankOwner}
                        onChange={(e) => setBankOwner(e.target.value)}
                        placeholder="NGUYEN VAN A..."
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mẫu hiển thị VietQR (Template)</label>
                      <select
                        value={bankQrTemplate}
                        onChange={(e) => setBankQrTemplate(e.target.value)}
                        className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-2.5 py-2.5 rounded-lg focus:outline-none focus:border-[#0047ab]"
                      >
                        <option value="compact">Nhỏ gọn kèm chi tiết chuyển khoản (compact)</option>
                        <option value="qr_only">Chỉ hiển thị QR (qr_only)</option>
                        <option value="print">Bản in chất lượng cao (print)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hỗ trợ khách hàng section */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#0047ab] rounded-full"></span>
                    Cấu hình Kênh Hỗ trợ Khách hàng (Support Link Widget)
                  </h4>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Đường dẫn liên kết hỗ trợ (Telegram / Zalo / Facebook Chat Link)</label>
                    <input
                      type="url"
                      required
                      value={supportLink}
                      onChange={(e) => setSupportLink(e.target.value)}
                      placeholder="https://t.me/ten_username_hoac_link_chat"
                      className="w-full bg-[#f8fafc] border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={gatewaysSaving}
                  className="w-full sm:w-auto bg-[#0047ab] hover:bg-[#00327d] text-white py-2.5 px-6 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {gatewaysSaving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình cổng'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* PENDING DEPOSITS APPROVAL PANEL */
          <div className="divide-y divide-slate-100">
            <div className="p-5 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-slate-800">Yêu cầu nạp tiền chờ duyệt (USDT &amp; VietQR)</h3>
              <button
                onClick={fetchUsdtDeposits}
                disabled={usdtDepositsLoading}
                className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer"
              >
                <RefreshCw size={12} className={usdtDepositsLoading ? 'animate-spin' : ''} />
                Làm mới danh sách
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Mã Giao Dịch</th>
                    <th className="p-4">Thành viên</th>
                    <th className="p-4 text-center">Cổng nạp</th>
                    <th className="p-4 text-right">Số tiền VNĐ</th>
                    <th className="p-4">Nội dung / TxID</th>
                    <th className="p-4">Thời gian gửi</th>
                    <th className="p-4 pr-6 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                  {usdtDepositsLoading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                        <RefreshCw className="animate-spin text-[#0047ab] inline-block mr-2" size={16} />
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : usdtDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">Không có yêu cầu nạp tiền nào đang chờ duyệt.</td>
                    </tr>
                  ) : (
                    usdtDeposits.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 pl-6 font-mono text-slate-400">{tx.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{tx.userName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{tx.userEmail}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            tx.method === 'USDT'
                              ? 'bg-green-50 border-green-100 text-green-700'
                              : 'bg-blue-50 border-blue-100 text-blue-700'
                          }`}>
                            {tx.method || 'VietQR'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-800">{tx.amount.toLocaleString('vi-VN')} VNĐ</td>
                        <td className="p-4 font-mono text-slate-500 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                        <td className="p-4 text-slate-400">{tx.timestamp}</td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleUsdtAction(tx.id, 'approve')}
                              disabled={usdtActionLoading !== null}
                              className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-50"
                            >
                              Phê Duyệt
                            </button>
                            <button
                              onClick={() => handleUsdtAction(tx.id, 'reject')}
                              disabled={usdtActionLoading !== null}
                              className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-50"
                            >
                              Từ Chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Adjust User Balance Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustBalance}
            className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-scale-up"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Coins className="text-[#0047ab]" size={20} />
              <div>
                <h3 className="text-base font-bold text-slate-800">Điều chỉnh số dư</h3>
                <p className="text-[10px] text-slate-400 font-semibold">{balanceModalUser.name} ({balanceModalUser.email})</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Số dư hiện tại
                </label>
                <div className="w-full bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-extrabold rounded-lg text-slate-700">
                  {balanceModalUser.balance.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Số tiền thay đổi (Cộng/Trừ)
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Ví dụ: +50000 hoặc -30000"
                  className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  Nhập số dương để cộng tiền, số âm để trừ tiền từ tài khoản.
                </span>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Lý do điều chỉnh (Note)
                </label>
                <input
                  type="text"
                  required
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Ví dụ: Hoàn tiền nạp thủ công VietQR..."
                  className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setBalanceModalUser(null);
                  setAdjustAmount('');
                  setAdjustNote('');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bg-[#0047ab] hover:bg-[#00327d] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust Service Price Modal */}
      {priceModalService && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdatePrice}
            className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-scale-up"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Settings className="text-[#0047ab]" size={20} />
              <div>
                <h3 className="text-base font-bold text-slate-800">Cấu hình giá bán</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Dịch vụ: {priceModalService.name}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold">Giá gốc đối tác</p>
                  <p className="font-extrabold text-slate-700 mt-0.5">{priceModalService.priceOriginal.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Giá bán hiện tại</p>
                  <p className="font-extrabold text-[#0047ab] mt-0.5">{priceModalService.price.toLocaleString('vi-VN')} VNĐ</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Giá bán chênh lệch mới (Markup)
                </label>
                <input
                  type="number"
                  required
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder={`Phải lớn hơn hoặc bằng ${priceModalService.priceOriginal}`}
                  className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                />
                <span className="text-[9px] text-slate-400 font-medium block mt-1 flex items-start gap-1">
                  <AlertTriangle size={10} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  Bạn phải đặt giá bán cao hơn hoặc bằng giá gốc mua vào để tránh bán lỗ!
                </span>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setPriceModalService(null);
                  setCustomPrice('');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bg-[#0047ab] hover:bg-[#00327d] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Cập nhật giá
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPassword}
            className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-scale-up"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <ShieldAlert className="text-red-600" size={20} />
              <div>
                <h3 className="text-base font-bold text-slate-800">Đặt lại mật khẩu</h3>
                <p className="text-[10px] text-slate-400 font-semibold">{resetPasswordUser.name} ({resetPasswordUser.email})</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập tối thiểu 6 ký tự..."
                  className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setResetPasswordUser(null);
                  setNewPassword('');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Xác nhận đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inspect User Logs Modal */}
      {inspectUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl animate-scale-up flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Users className="text-[#0047ab]" size={20} />
                <div>
                  <h3 className="text-base font-bold text-slate-800">Nhật ký hoạt động thành viên</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{inspectUser.name} ({inspectUser.email})</p>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-100 px-2 py-1 rounded-md cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Logs Tab Selection */}
            <div className="flex border-b border-slate-100 text-xs font-bold text-slate-500 gap-4 flex-shrink-0">
              <button
                onClick={() => setInspectLogsTab('transactions')}
                className={`pb-2 border-b-2 px-1 transition-all cursor-pointer ${
                  inspectLogsTab === 'transactions' ? 'border-[#0047ab] text-[#0047ab]' : 'border-transparent hover:text-slate-800'
                }`}
              >
                Lịch sử Ví tiền (Transactions)
              </button>
              <button
                onClick={() => setInspectLogsTab('rentals')}
                className={`pb-2 border-b-2 px-1 transition-all cursor-pointer ${
                  inspectLogsTab === 'rentals' ? 'border-[#0047ab] text-[#0047ab]' : 'border-transparent hover:text-slate-800'
                }`}
              >
                Lịch sử thuê SIM (Rentals)
              </button>
            </div>

            {/* Logs content container */}
            <div className="flex-1 overflow-y-auto text-xs space-y-2 pr-1 min-h-[250px]">
              {inspectLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-[#0047ab]" size={20} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang tải nhật ký...</p>
                </div>
              ) : inspectLogsTab === 'transactions' ? (
                /* TRANSACTIONS LOGS TABLE */
                inspectTransactions.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 font-medium">Không tìm thấy giao dịch nào của thành viên này.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="p-2">Mã GD</th>
                        <th className="p-2">Thể loại</th>
                        <th className="p-2 text-right">Số tiền</th>
                        <th className="p-2 text-right">Số dư sau</th>
                        <th className="p-2">Chi tiết / Nội dung</th>
                        <th className="p-2">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                      {inspectTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="p-2 font-mono text-slate-400">#{tx.id}</td>
                          <td className="p-2">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                tx.type === 'deposit'
                                  ? 'bg-green-50 text-green-700 border border-green-100'
                                  : 'bg-red-50 text-red-700 border border-red-100'
                              }`}
                            >
                              {tx.type === 'deposit' ? 'Nạp tiền' : 'Chi tiêu'}
                            </span>
                          </td>
                          <td className={`p-2 text-right font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-2 text-right font-bold text-slate-700">{tx.balanceAfter.toLocaleString('vi-VN')}đ</td>
                          <td className="p-2 text-slate-500 max-w-[150px] truncate" title={tx.description}>{tx.description}</td>
                          <td className="p-2 text-slate-400">{tx.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                /* RENTALS LOGS TABLE */
                inspectRentals.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 font-medium">Không tìm thấy yêu cầu thuê SIM nào của thành viên này.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="p-2">Mã Thuê</th>
                        <th className="p-2">Dịch vụ</th>
                        <th className="p-2">Số điện thoại</th>
                        <th className="p-2 text-right">Phí bán</th>
                        <th className="p-2">Trạng thái</th>
                        <th className="p-2">SMS Code</th>
                        <th className="p-2">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                      {inspectRentals.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-2 font-mono text-slate-400">#{r.id}</td>
                          <td className="p-2 font-bold text-slate-800">{r.serviceName}</td>
                          <td className="p-2 font-mono text-slate-700">{r.phone || 'Chờ SIM...'}</td>
                          <td className="p-2 text-right font-bold text-slate-800">{r.price.toLocaleString('vi-VN')}đ</td>
                          <td className="p-2">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                r.status === 'completed'
                                  ? 'bg-green-50 text-green-700 border border-green-100'
                                  : r.status === 'canceled'
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                  : 'bg-yellow-50 text-yellow-700 border border-yellow-100 animate-pulse'
                              }`}
                            >
                              {r.status === 'completed' ? 'Thành công' : r.status === 'canceled' ? 'Hoàn tiền/Hủy' : 'Đang đợi'}
                            </span>
                          </td>
                          <td className="p-2 font-mono font-bold text-red-600">{r.smsCode || '-'}</td>
                          <td className="p-2 text-slate-400">{r.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service Modal (Add/Edit Custom Service) */}
      {serviceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveService}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-scale-up"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <h3 className="text-base font-bold text-slate-800">
                {editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ tùy chỉnh'}
              </h3>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 px-2 py-1 rounded-md cursor-pointer"
              >
                Đóng
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Tên dịch vụ
                </label>
                <input
                  type="text"
                  required
                  value={formDataName}
                  onChange={(e) => setFormDataName(e.target.value)}
                  placeholder="Ví dụ: ChatGPT VIP, Telegram Premium..."
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Mã Code (Nhận diện API)
                </label>
                <input
                  type="text"
                  required
                  value={formDataCode}
                  onChange={(e) => setFormDataCode(e.target.value)}
                  placeholder="Ví dụ: chatgpt_vip, telegram..."
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab] font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  URL ảnh logo
                </label>
                <input
                  type="url"
                  value={formDataLogoUrl}
                  onChange={(e) => setFormDataLogoUrl(e.target.value)}
                  placeholder="Ví dụ: https://logo-domain.com/image.png"
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Ánh xạ dịch vụ web cha (CodeSim)
                </label>
                <select
                  value={formDataParentId}
                  onChange={(e) => setFormDataParentId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-semibold px-2.5 py-2 rounded-lg focus:outline-none focus:border-[#0047ab]"
                >
                  <option value="">-- Tự động (Không ánh xạ, dùng mã Code gốc) --</option>
                  {parentServices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Gốc: {p.priceOriginal.toLocaleString('vi-VN')}đ)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Chọn dịch vụ tương ứng bên web cha để hệ thống gọi API thuê số chính xác.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                  Chế độ giá bán
                </label>
                <div className="flex gap-4 mt-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                    <input
                      type="radio"
                      name="isCustomPriceModal"
                      checked={!formDataIsCustomPrice}
                      onChange={() => setFormDataIsCustomPrice(false)}
                      className="accent-[#0047ab]"
                    />
                    Tự động (Theo Markup)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                    <input
                      type="radio"
                      name="isCustomPriceModal"
                      checked={formDataIsCustomPrice}
                      onChange={() => setFormDataIsCustomPrice(true)}
                      className="accent-[#0047ab]"
                    />
                    Cố định (Tự đặt giá)
                  </label>
                </div>
              </div>

              {formDataIsCustomPrice && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    Giá bán cố định (VNĐ)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formDataPrice}
                    onChange={(e) => setFormDataPrice(e.target.value)}
                    placeholder="Ví dụ: 5000"
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0047ab]"
                  />
                  <span className="text-[9px] text-slate-400 font-medium block mt-1">
                    Đặt giá bán cố định cho người dùng. Hãy đảm bảo lớn hơn giá gốc đối tác để tránh bán lỗ.
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={serviceModalSubmitting}
                className="bg-[#0047ab] hover:bg-[#00327d] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {serviceModalSubmitting ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
