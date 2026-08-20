import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode?: number;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const token = await SecureStore.getItemAsync('paynova_access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'bypass-tunnel-reminder': 'true',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const body = await response.json();

    if (!response.ok) {
      return {
        error: body.message || 'Request failed',
        statusCode: response.status,
      };
    }

    return { data: body };
  } catch {
    return { error: 'Network error. Is the backend running?' };
  }
}

// ==================== AUTH ====================

export async function register(phone: string, pin: string) {
  return request<{
    exists?: boolean;
    message: string;
    userId?: string;
    phone: string;
    role?: string;
    profileComplete?: boolean;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, pin }),
  });
}

export async function login(phone: string, pin: string) {
  return request<{
    message: string;
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      phone: string;
      name: string | null;
      role: string;
      profileComplete: boolean;
    };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, pin }),
  });
}

export async function refresh(refreshToken: string) {
  return request<{
    accessToken: string;
    refreshToken: string;
  }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getMe() {
  return request<{
    id: string;
    phone: string;
    role: string;
  }>('/auth/me');
}

export async function completeProfile(
  phone: string,
  name: string,
  dateOfBirth: string,
) {
  return request<{
    message: string;
    userId: string;
    phone: string;
    name: string;
    profileComplete: boolean;
  }>('/auth/complete-profile', {
    method: 'POST',
    body: JSON.stringify({ phone, name, dateOfBirth }),
  });
}

export async function verifyOtp(phone: string, code: string) {
  return request<{
    message: string;
    userId: string;
    phone: string;
    role: string;
  }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export async function resendOtp(phone: string) {
  return request<{ message: string }>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function setPin(phone: string, pin: string) {
  return request<{ message: string; userId: string; phone: string }>(
    '/auth/set-pin',
    {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
    },
  );
}

export async function verifyPin(phone: string, pin: string) {
  return request<{
    message: string;
    userId: string;
    phone: string;
    role: string;
  }>('/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ phone, pin }),
  });
}

export async function changePin(
  phone: string,
  currentPin: string,
  newPin: string,
) {
  return request<{ message: string; userId: string; phone: string }>(
    '/auth/change-pin',
    {
      method: 'PUT',
      body: JSON.stringify({ phone, currentPin, newPin }),
    },
  );
}

export async function validateAccount(phone: string, code: string) {
  return request<{
    message: string;
    userId: string;
    phone: string;
    accountValidated: boolean;
  }>('/auth/validate-account', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

// ==================== AGENT ====================

export async function identifyClient(phone: string) {
  return request<{
    id: string;
    phone: string;
    name: string;
    balance: number;
    phoneVerified: boolean;
    profileComplete: boolean;
  }>(`/agent/identify/${encodeURIComponent(phone)}`);
}

export async function agentDeposit(data: {
  clientPhone: string;
  amount: number;
  description?: string;
}) {
  return request<{
    transaction: {
      id: string;
      type: string;
      amount: number;
      fees: number;
      commission: number;
      netAmount: number;
      status: string;
      description: string;
      createdAt: string;
    };
    client: {
      id: string;
      name: string | null;
      phone: string;
      newBalance: number;
    };
  }>('/agent/deposit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function agentWithdrawal(data: {
  clientPhone: string;
  amount: number;
  description?: string;
}) {
  return request<{
    transaction: {
      id: string;
      type: string;
      amount: number;
      fees: number;
      commission: number;
      netAmount: number;
      status: string;
      description: string;
      createdAt: string;
    };
    client: {
      id: string;
      name: string | null;
      phone: string;
      newBalance: number;
    };
  }>('/agent/withdrawal', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAgentHistory(params?: {
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return request<{
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      fees: number;
      commission: number;
      netAmount: number;
      status: string;
      description: string;
      client: { id: string; name: string | null; phone: string };
      createdAt: string;
    }>;
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/agent/history${qs ? `?${qs}` : ''}`);
}

export async function getAgentCommissions(params?: {
  from?: string;
  to?: string;
}) {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);

  const qs = query.toString();
  return request<{
    commissions: Array<{
      id: string;
      amount: number;
      transaction: {
        id: string;
        type: string;
        amount: number;
        status: string;
      };
      calculatedAt: string;
    }>;
    total: number;
  }>(`/agent/commissions${qs ? `?${qs}` : ''}`);
}

export async function getAgentStats(period?: string) {
  const qs = period ? `?period=${period}` : '';
  return request<{
    period: string;
    startDate: string;
    endDate: string;
    deposits: { count: number; total: number };
    withdrawals: { count: number; total: number };
    commissions: { total: number };
    totalOperations: number;
  }>(`/agent/stats${qs}`);
}

export async function getNotifications(params?: { unread?: boolean }) {
  const qs = params?.unread ? '?unread=true' : '';
  return request<Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>>(`/notifications${qs}`);
}

export async function markNotificationRead(id: string) {
  return request<{ id: string; read: boolean }>(`/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export async function reportSuspect(data: {
  transactionId: string;
  reason: string;
  description?: string;
}) {
  return request<{
    id: string;
    agentId: string;
    transactionId: string;
    reason: string;
    description: string | null;
    status: string;
    createdAt: string;
  }>('/agent/report-suspect', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== TRANSFER ====================

export async function createTransfer(data: {
  recipientPhone: string;
  amount: number;
  description?: string;
}) {
  return request<{
    transaction: {
      id: string;
      type: string;
      amount: number;
      fees: number;
      netAmount: number;
      status: string;
      reference: string;
      description: string;
      createdAt: string;
    };
    recipient: {
      id: string;
      name: string | null;
      phone: string;
    };
  }>('/transfer', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== COMMISSION RULES (Admin) ====================

export async function getCommissionRules() {
  return request<Array<{
    id: string;
    type: string;
    minAmount: number;
    maxAmount: number;
    rate: number;
    fixedAmount: number;
    isActive: boolean;
    createdAt: string;
  }>>('/commissions/rules');
}

export async function createCommissionRule(data: {
  type: string;
  minAmount: number;
  maxAmount: number;
  rate: number;
  fixedAmount?: number;
}) {
  return request<{
    id: string;
    type: string;
    minAmount: number;
    maxAmount: number;
    rate: number;
    fixedAmount: number;
    isActive: boolean;
  }>('/commissions/rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCommissionRule(
  id: string,
  data: {
    type?: string;
    minAmount?: number;
    maxAmount?: number;
    rate?: number;
    fixedAmount?: number;
    isActive?: boolean;
  },
) {
  return request<{
    id: string;
    type: string;
    minAmount: number;
    maxAmount: number;
    rate: number;
    fixedAmount: number;
    isActive: boolean;
  }>(`/commissions/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCommissionRule(id: string) {
  return request<{ id: string }>(`/commissions/rules/${id}`, {
    method: 'DELETE',
  });
}

// ==================== HELPERS ====================

export async function saveToken(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

export async function getToken(key: string) {
  return SecureStore.getItemAsync(key);
}

// ==================== ADMIN ====================

export async function getAdminDashboard() {
  return request<{
    totalUsers: number;
    totalAgents: number;
    totalMerchants: number;
    totalTransactions: number;
    pendingReports: number;
    todayStats: { count: number; totalAmount: number; deposits: number; withdrawals: number };
    recentTransactions: any[];
  }>('/admin/dashboard');
}

export async function getAdminUsers(params?: {
  q?: string; role?: string; status?: string; page?: number; limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.role) q.set('role', params.role);
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{
    users: Array<{
      id: string; phone: string; name: string | null; role: string;
      status: string; phoneVerified: boolean; accountValidated: boolean;
      createdAt: string; balance: number;
    }>;
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export async function getAdminUserDetail(id: string) {
  return request<any>(`/admin/users/${id}`);
}

export async function getAdminUserTransactions(
  id: string,
  params?: { page?: number; limit?: number; type?: string; status?: string },
) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.type) q.set('type', params.type);
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return request<{
    transactions: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/users/${id}/transactions${qs ? `?${qs}` : ''}`);
}

export async function suspendUser(id: string) {
  return request<any>(`/admin/users/${id}/suspend`, { method: 'PUT' });
}

export async function reactivateUser(id: string) {
  return request<any>(`/admin/users/${id}/reactivate`, { method: 'PUT' });
}

export async function getAdminTransactions(params?: {
  q?: string; type?: string; status?: string; from?: string; to?: string; page?: number; limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.type) q.set('type', params.type);
  if (params?.status) q.set('status', params.status);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{
    transactions: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/transactions${qs ? `?${qs}` : ''}`);
}

export async function getAdminTransactionDetail(id: string) {
  return request<any>(`/admin/transactions/${id}`);
}

export async function flagTransaction(id: string, reason: string, description?: string) {
  return request<any>(`/admin/transactions/${id}/flag`, {
    method: 'PUT',
    body: JSON.stringify({ reason, description }),
  });
}

export async function getAdminAgents(params?: {
  q?: string; status?: string; page?: number; limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{
    agents: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/agents${qs ? `?${qs}` : ''}`);
}

export async function validateAgent(userId: string, notes?: string) {
  return request<any>('/admin/agents/validate', {
    method: 'POST',
    body: JSON.stringify({ userId, notes }),
  });
}

export async function suspendAgent(id: string) {
  return request<any>(`/admin/agents/${id}/suspend`, { method: 'PUT' });
}

export async function reactivateAgent(id: string) {
  return request<any>(`/admin/agents/${id}/reactivate`, { method: 'PUT' });
}

export async function updateAgentProfile(id: string, data: { trainingComplete?: boolean; notes?: string }) {
  return request<any>(`/admin/agents/${id}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getAdminAgentCommissions(
  id: string,
  params?: { from?: string; to?: string; page?: number; limit?: number },
) {
  const q = new URLSearchParams();
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{
    commissions: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/agents/${id}/commissions${qs ? `?${qs}` : ''}`);
}

export async function getAdminMerchants(params?: {
  q?: string; status?: string; page?: number; limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{
    merchants: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/merchants${qs ? `?${qs}` : ''}`);
}

export async function validateMerchant(userId: string, data?: { businessName?: string; businessType?: string; notes?: string }) {
  return request<any>('/admin/merchants/validate', {
    method: 'POST',
    body: JSON.stringify({ userId, ...data }),
  });
}

export async function suspendMerchant(id: string) {
  return request<any>(`/admin/merchants/${id}/suspend`, { method: 'PUT' });
}

export async function reactivateMerchant(id: string) {
  return request<any>(`/admin/merchants/${id}/reactivate`, { method: 'PUT' });
}

export async function getAdminMerchantPayments(id: string, params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{
    transactions: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/merchants/${id}/payments${qs ? `?${qs}` : ''}`);
}

export async function getAdminReports(params?: { status?: string; page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{
    reports: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/reports${qs ? `?${qs}` : ''}`);
}

export async function reviewReport(reportId: string, status: string) {
  return request<any>(`/admin/reports/${reportId}/review`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getAuditLogs(params?: {
  actorId?: string; action?: string; from?: string; to?: string; page?: number; limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.actorId) q.set('actorId', params.actorId);
  if (params?.action) q.set('action', params.action);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{
    logs: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/admin/audit${qs ? `?${qs}` : ''}`);
}

export async function getSettings() {
  return request<Record<string, any>>('/settings');
}

export async function getSettingsGroup(group: string) {
  return request<Record<string, any>>(`/settings/${group}`);
}

export async function updateSettings(updates: Record<string, any>) {
  return request<{ message: string; updated: string[] }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// ==================== SUPER ADMIN ====================

export async function getSuperAdminDashboard() {
  return request<any>('/superadmin/dashboard');
}

export async function getSuperAdmins(params?: { q?: string; role?: string; status?: string; page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.role) q.set('role', params.role);
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{ admins: any[]; pagination: any }>(`/superadmin/admins${qs ? `?${qs}` : ''}`);
}

export async function getSuperAdminDetail(id: string) {
  return request<any>(`/superadmin/admins/${id}`);
}

export async function createSuperAdmin(data: { phone: string; name?: string; pin: string; role?: string }) {
  return request<any>('/superadmin/admins', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSuperAdmin(id: string, data: { name?: string; phone?: string; role?: string; status?: string }) {
  return request<any>(`/superadmin/admins/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function suspendSuperAdmin(id: string) {
  return request<any>(`/superadmin/admins/${id}/suspend`, { method: 'PUT' });
}

export async function reactivateSuperAdmin(id: string) {
  return request<any>(`/superadmin/admins/${id}/reactivate`, { method: 'PUT' });
}

export async function getSuperApiConfigs(params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{ configs: any[]; pagination: any }>(`/superadmin/api${qs ? `?${qs}` : ''}`);
}

export async function createSuperApiConfig(data: { name: string; permissions?: string[] }) {
  return request<any>('/superadmin/api', { method: 'POST', body: JSON.stringify(data) });
}

export async function revokeSuperApiConfig(id: string) {
  return request<any>(`/superadmin/api/${id}/revoke`, { method: 'PUT' });
}

export async function getSuperDocuments(params?: { userId?: string; page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.userId) q.set('userId', params.userId);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{ documents: any[]; pagination: any }>(`/superadmin/documents${qs ? `?${qs}` : ''}`);
}

export async function deleteSuperDocument(id: string) {
  return request<any>(`/superadmin/documents/${id}`, { method: 'DELETE' });
}

export async function getSuperStats(params?: { from?: string; to?: string }) {
  const q = new URLSearchParams();
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  const qs = q.toString();
  return request<any>(`/superadmin/stats${qs ? `?${qs}` : ''}`);
}

export async function getSuperSecurityEvents(params?: {
  severity?: string; userId?: string; from?: string; to?: string; page?: number; limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.severity) q.set('severity', params.severity);
  if (params?.userId) q.set('userId', params.userId);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{ events: any[]; pagination: any }>(`/superadmin/security/events${qs ? `?${qs}` : ''}`);
}

export async function getSuperActiveSessions(params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<{ sessions: any[]; pagination: any }>(`/superadmin/security/sessions${qs ? `?${qs}` : ''}`);
}

export async function revokeSuperSession(id: string) {
  return request<any>(`/superadmin/security/sessions/${id}/revoke`, { method: 'PUT' });
}

export async function getSuperUserDevices(userId: string) {
  return request<any[]>(`/superadmin/security/devices/${userId}`);
}

export async function getSuperAdminUsers(params?: { q?: string; role?: string; status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.role) query.set('role', params.role);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return request<any>(`/superadmin/users?${query.toString()}`);
}

export async function getSuperAdminTransactions(params?: { q?: string; type?: string; status?: string; from?: string; to?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return request<any>(`/superadmin/transactions?${query.toString()}`);
}

export async function getSuperAdminAgents(params?: { q?: string; status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return request<any>(`/superadmin/agents?${query.toString()}`);
}

export async function getSuperAdminMerchants(params?: { q?: string; status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return request<any>(`/superadmin/merchants?${query.toString()}`);
}

// ==================== MERCHANT ====================

export async function getMerchantProfile() {
  return request<any>('/merchant/profile');
}

export async function updateMerchantProfile(data: { businessName?: string; businessType?: string; businessAddress?: string }) {
  return request<any>('/merchant/profile', { method: 'PUT', body: JSON.stringify(data) });
}

export async function getMerchantQr() {
  return request<any>('/merchant/qr');
}

export async function getMerchantSales(params?: { from?: string; to?: string; page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<any>(`/merchant/sales${qs ? '?' + qs : ''}`);
}

export async function getMerchantHistory(params?: { type?: string; page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.type) q.set('type', params.type);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<any>(`/merchant/history${qs ? '?' + qs : ''}`);
}

export async function getMerchantStats(period?: string) {
  return request<any>(`/merchant/stats${period ? '?period=' + period : ''}`);
}

export async function getMerchantBalance() {
  return request<any>('/merchant/balance');
}

export async function requestMerchantWithdrawal(amount: number, note?: string) {
  return request<any>('/merchant/withdrawal', {
    method: 'POST',
    body: JSON.stringify({ amount, note }),
  });
}

export async function getMerchantWithdrawals(params?: { status?: string; page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<any>(`/merchant/withdrawals${qs ? '?' + qs : ''}`);
}

export async function getMerchantWithdrawalsAdmin(params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return request<any>(`/admin/withdrawals${qs ? '?' + qs : ''}`);
}

export async function processMerchantWithdrawal(id: string, data: { status: string; note?: string }) {
  return request<any>(`/admin/withdrawals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==================== REFUNDS ====================
export async function searchTransactionsForRefund(q: string) {
  return request<any>(`/admin/refunds/search-transaction?q=${encodeURIComponent(q)}`);
}

export async function getRefundStats() {
  return request<any>('/admin/refunds/stats');
}

export async function getRefunds(params?: { status?: string; q?: string; page?: number; limit?: number }) {
  const qu = new URLSearchParams();
  if (params?.status) qu.set('status', params.status);
  if (params?.q) qu.set('q', params.q);
  if (params?.page) qu.set('page', String(params.page));
  if (params?.limit) qu.set('limit', String(params.limit));
  const qs = qu.toString();
  return request<any>(`/admin/refunds${qs ? '?' + qs : ''}`);
}

export async function getRefundDetail(id: string) {
  return request<any>(`/admin/refunds/${id}`);
}

export async function createRefund(data: {
  transactionId: string;
  refundAmount: number;
  reason: string;
  debitUserId: string;
  creditUserId: string;
  note?: string;
}) {
  return request<any>('/admin/refunds', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function approveRefund(id: string, note?: string) {
  return request<any>(`/admin/refunds/${id}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ note }),
  });
}

export async function refuseRefund(id: string, note?: string) {
  return request<any>(`/admin/refunds/${id}/refuse`, {
    method: 'PUT',
    body: JSON.stringify({ note }),
  });
}

export async function executeRefund(id: string) {
  return request<any>(`/admin/refunds/${id}/execute`, {
    method: 'PUT',
  });
}

export async function logout() {
  await SecureStore.deleteItemAsync('paynova_access_token');
  await SecureStore.deleteItemAsync('paynova_refresh_token');
}
