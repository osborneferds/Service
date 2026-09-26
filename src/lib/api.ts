// Production API Client for Backend Server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Check if backend is available
export const isBackendAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Generic fetch wrapper with error handling and fallback
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`API endpoint not found: ${endpoint}. Backend may not be running.`);
        throw new Error('Backend server not available');
      }
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    // Don't log 404 errors repeatedly
    if (!(error instanceof Error && error.message === 'Backend server not available')) {
      console.error('API Error:', error);
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  
  getMe: () => apiRequest<any>('/auth/me'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),
  
  logout: () => apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST'
  })
};

// Projects API
export const projectsAPI = {
  getAll: (params?: { status?: string; category?: string; priority?: string; search?: string; limit?: number; offset?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<{ projects: any[]; pagination: any }>(`/projects${queryString}`);
  },
  
  getById: (id: string) => apiRequest<any>(`/projects/${id}`),
  
  create: (project: any) => 
    apiRequest<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    }),
  
  update: (id: string, updates: any) => 
    apiRequest<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  
  delete: (id: string) => 
    apiRequest<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE'
    }),
  
  getStats: () => apiRequest<any>('/projects/stats/overview')
};

// Leads API
export const leadsAPI = {
  getAll: () => apiRequest<any[]>('/leads'),
  
  getById: (id: string) => apiRequest<any>(`/leads/${id}`),
  
  create: (lead: any) => 
    apiRequest<any>('/leads', {
      method: 'POST',
      body: JSON.stringify(lead)
    }),
  
  update: (id: string, updates: any) => 
    apiRequest<any>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  
  delete: (id: string) => 
    apiRequest<{ message: string }>(`/leads/${id}`, {
      method: 'DELETE'
    })
};

// Portfolio API
export const portfolioAPI = {
  getAll: () => apiRequest<any[]>('/portfolio'),
  
  getById: (id: string) => apiRequest<any>(`/portfolio/${id}`),
  
  create: (item: any) => 
    apiRequest<any>('/portfolio', {
      method: 'POST',
      body: JSON.stringify(item)
    }),
  
  update: (id: string, updates: any) => 
    apiRequest<any>(`/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  
  delete: (id: string) => 
    apiRequest<{ message: string }>(`/portfolio/${id}`, {
      method: 'DELETE'
    })
};

// Invoices API
export const invoicesAPI = {
  getAll: () => apiRequest<any[]>('/invoices'),
  
  getById: (id: string) => apiRequest<any>(`/invoices/${id}`),
  
  create: (invoice: any) => 
    apiRequest<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice)
    }),
  
  update: (id: string, updates: any) => 
    apiRequest<any>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  
  markAsPaid: (id: string) => 
    apiRequest<any>(`/invoices/${id}/mark-paid`, {
      method: 'POST'
    }),
  
  delete: (id: string) => 
    apiRequest<{ message: string }>(`/invoices/${id}`, {
      method: 'DELETE'
    }),
  
  getStats: () => apiRequest<any>('/invoices/stats/revenue')
};

// Messages API
export const messagesAPI = {
  getConversations: () => apiRequest<any[]>('/messages'),
  
  getConversation: (conversationId: string) => 
    apiRequest<{ conversation: any; messages: any[] }>(`/messages/${conversationId}`),
  
  sendMessage: (data: { conversation_id?: string; recipient_id: string; content: string }) => 
    apiRequest<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  markAsRead: (messageId: string) => 
    apiRequest<{ message: string }>(`/messages/${messageId}/read`, {
      method: 'PUT'
    }),
  
  getUnreadCount: () => apiRequest<{ count: number }>('/messages/unread/count')
};

// Notifications API
export const notificationsAPI = {
  getAll: (params?: { limit?: number; offset?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<{ notifications: any[]; pagination: any }>(`/notifications${queryString}`);
  },
  
  getUnreadCount: () => apiRequest<{ count: number }>('/notifications/unread/count'),
  
  markAsRead: (id: string) => 
    apiRequest<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT'
    }),
  
  markAllAsRead: () => 
    apiRequest<{ message: string }>('/notifications/read-all', {
      method: 'PUT'
    }),
  
  delete: (id: string) => 
    apiRequest<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE'
    }),
  
  create: (notification: any) => 
    apiRequest<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification)
    })
};

// Client Accounts API
export const clientAccountsAPI = {
  getAll: () => apiRequest<any[]>('/client-accounts'),
  
  getById: (id: string) => apiRequest<any>(`/client-accounts/${id}`),
  
  create: (account: any) => 
    apiRequest<any>('/client-accounts', {
      method: 'POST',
      body: JSON.stringify(account)
    }),
  
  update: (id: string, updates: any) => 
    apiRequest<any>(`/client-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  
  delete: (id: string) => 
    apiRequest<{ message: string }>(`/client-accounts/${id}`, {
      method: 'DELETE'
    }),
  
  resetPassword: (id: string, newPassword: string) => 
    apiRequest<{ message: string }>(`/client-accounts/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    })
};

// Users API
export const usersAPI = {
  getAll: () => apiRequest<any[]>('/users'),
  
  getById: (id: string) => apiRequest<any>(`/users/${id}`),
  
  update: (id: string, updates: any) => 
    apiRequest<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  
  updateStatus: (id: string, status: 'active' | 'inactive') => 
    apiRequest<any>(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  
  getMyProjects: () => apiRequest<any[]>('/users/me/projects'),
  
  getMyInvoices: () => apiRequest<any[]>('/users/me/invoices')
};

// Uploads API
export const uploadsAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    return await response.json();
  },
  
  uploadMultiple: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/uploads/multiple`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    return await response.json();
  },
  
  delete: (filename: string) => 
    apiRequest<{ message: string }>(`/uploads/${filename}`, {
      method: 'DELETE'
    })
};

// Health Check
export const healthAPI = {
  check: async () => {\n    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);\n    if (!response.ok) throw new Error('Backend health check failed');\n    return response.json() as Promise<{ status: string; timestamp: string; uptime: number }>;\n  }
};
