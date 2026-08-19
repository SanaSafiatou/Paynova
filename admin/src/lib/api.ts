const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode?: number;
}

function getTokenSync(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

function getRefreshTokenSync(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_refresh_token');
}

async function doFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getTokenSync();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${endpoint}`, { ...options, headers });
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshTokenSync();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('admin_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('admin_refresh_token', data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let res = await doFetch(endpoint, options);

  if (res.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await doFetch(endpoint, options);
    }
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
      }
    }
    const body = await res.json().catch(() => ({ message: 'Erreur réseau' }));
    throw new Error(body.message || `Erreur HTTP ${res.status}`);
  }
  return res.json();
}

export function setToken(token: string, refreshToken?: string) {
  localStorage.setItem('admin_token', token);
  if (refreshToken) localStorage.setItem('admin_refresh_token', refreshToken);
}
export function clearToken() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
}
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('admin_user');
  return u ? JSON.parse(u) : null;
}
export function setStoredUser(user: any) {
  localStorage.setItem('admin_user', JSON.stringify(user));
}

// Auth
export const authApi = {
  login: (phone: string, pin: string) =>
    api<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
    }),
  me: () => api<any>('/auth/me'),
};

// Admin
export const adminApi = {
  dashboard: () => api<any>('/admin/dashboard'),
  users: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/users${qs}`);
  },
  userDetail: (id: string) => api<any>(`/admin/users/${id}`),
  userTransactions: (id: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/users/${id}/transactions${qs}`);
  },
  suspendUser: (id: string) => api<any>(`/admin/users/${id}/suspend`, { method: 'PUT' }),
  reactivateUser: (id: string) => api<any>(`/admin/users/${id}/reactivate`, { method: 'PUT' }),

  transactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/transactions${qs}`);
  },
  transactionDetail: (id: string) => api<any>(`/admin/transactions/${id}`),
  flagTransaction: (id: string, reason: string, description?: string) =>
    api<any>(`/admin/transactions/${id}/flag`, {
      method: 'PUT',
      body: JSON.stringify({ reason, description }),
    }),

  agents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/agents${qs}`);
  },
  agentDetail: (id: string) => api<any>(`/admin/agents/${id}`),
  agentCommissions: (id: string) => api<any>(`/admin/agents/${id}/commissions`),
  validateAgent: (id: string) => api<any>(`/admin/agents/${id}/validate`, { method: 'PUT' }),
  suspendAgent: (id: string) => api<any>(`/admin/agents/${id}/suspend`, { method: 'PUT' }),
  reactivateAgent: (id: string) => api<any>(`/admin/agents/${id}/reactivate`, { method: 'PUT' }),
  updateAgentProfile: (id: string, data: any) =>
    api<any>(`/admin/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  merchants: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/merchants${qs}`);
  },
  merchantDetail: (id: string) => api<any>(`/admin/merchants/${id}`),
  merchantPayments: (id: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/merchants/${id}/payments${qs}`);
  },
  validateMerchant: (id: string) => api<any>(`/admin/merchants/${id}/validate`, { method: 'PUT' }),
  suspendMerchant: (id: string) => api<any>(`/admin/merchants/${id}/suspend`, { method: 'PUT' }),
  reactivateMerchant: (id: string) => api<any>(`/admin/merchants/${id}/reactivate`, { method: 'PUT' }),

  withdrawals: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/withdrawals${qs}`);
  },
  processWithdrawal: (id: string, data: { status: string; note?: string }) =>
    api<any>(`/admin/withdrawals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  audit: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/audit${qs}`);
  },

  reports: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/reports${qs}`);
  },
  reviewReport: (id: string, status: string) =>
    api<any>(`/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Refunds
  refundStats: () => api<any>('/admin/refunds/stats'),
  refunds: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<any>(`/admin/refunds${qs}`);
  },
  refundDetail: (id: string) => api<any>(`/admin/refunds/${id}`),
  searchTransactionsForRefund: (q: string) =>
    api<any>(`/admin/refunds/search-transaction?q=${encodeURIComponent(q)}`),
  createRefund: (data: any) =>
    api<any>('/admin/refunds', { method: 'POST', body: JSON.stringify(data) }),
  approveRefund: (id: string, note?: string) =>
    api<any>(`/admin/refunds/${id}/approve`, { method: 'PUT', body: JSON.stringify({ note }) }),
  refuseRefund: (id: string, note?: string) =>
    api<any>(`/admin/refunds/${id}/refuse`, { method: 'PUT', body: JSON.stringify({ note }) }),
  executeRefund: (id: string) =>
    api<any>(`/admin/refunds/${id}/execute`, { method: 'PUT' }),
};

// Settings
export const settingsApi = {
  getAll: () => api<Record<string, any>>('/settings'),
  getGroup: (group: string) => api<Record<string, any>>(`/settings/${group}`),
  update: (updates: Record<string, any>) =>
    api<any>('/settings', { method: 'PUT', body: JSON.stringify(updates) }),
};
