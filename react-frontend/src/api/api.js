import axios from 'axios';

const API_BASE_URL = '/api';
const AUTH_BASE_URL = 'https://auth.tubik-corp.ru';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    config.credentials = 'include';
    return config;
  });
  
export const productsApi = {
  getAll: () => api.get('/products/').then(res => res.data),
  getCategories: () => api.get('/products/categories/').then(res => res.data),
  getExpiring: () => api.get('/products/expiring/').then(res => res.data),
  getAllWithDeleted: () => api.get('/products/all').then(res => res.data),
  add: (productData) => api.post('/products/', productData).then(res => res.data),
  remove: (id) => api.delete(`/products/${id}`),
  search: (term) => api.get(`/products/search?term=${encodeURIComponent(term)}`).then(res => res.data),
  getAnalytics: (startDate, endDate) => 
    api.get(`/analytics/consumption?start_date=${startDate}&end_date=${endDate}`).then(res => res.data),
};

export const shoppingApi = {
  getList: () => api.get('/shopping/').then(res => res.data),
  addItem: (item) => api.post('/shopping/', item).then(res => res.data),
  removeItem: (id) => api.delete(`/shopping/${id}`),
  markAsBought: (id) => api.post(`/shopping/${id}/bought`),
  updateItem: (id, itemData) => api.put(`/shopping/${id}`, itemData).then(res => res.data),
};

export const authApi = {
  login: () => {
    const params = new URLSearchParams({
      client_id: 'tubik_fridge',
      redirect_uri: `${window.location.origin}/auth/callback`,
      state: Math.random().toString(36).substring(7),
      response_type: 'code'
    });
    window.location.href = `${AUTH_BASE_URL}/login?${params}`;
  },

  logout: () => {
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/auth/login';
  },

  handleCallback: async (code) => {
    const response = await fetch(`${API_BASE_URL}/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code }),
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Auth callback failed');
    }
  
    const { token } = await response.json();
    document.cookie = `jwt=${token}; path=/; max-age=${24 * 60 * 60}; secure=${process.env.NODE_ENV === 'production'}; samesite=lax`;
    localStorage.setItem('jwt', token);
    window.location.href = '/';
  },
  
  checkAuth: async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1];
      
      const response = await fetch(`${API_BASE_URL}/auth/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Cookie': `jwt=${token}` }) 
        },
        credentials: 'include'
      });
      
      if(response.ok) localStorage.setItem('jwt', token);
      return response.ok;
    } catch (error) {
      console.error('Check auth error:', error);
      return false;
    }
  }
};

export const userApi = {
  generateCode: () => api.post('/telegram/generate-code').then(res => res.data),
  getMe: () => api.get('/telegram/me').then(res => res.data),
};
