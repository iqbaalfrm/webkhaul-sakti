import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle common error scenarios
    if (error.response?.status === 404) {
      console.warn('⚠️ Resource not found');
    } else if (error.response?.status >= 500) {
      console.error('🚨 Server error occurred');
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network error - check if server is running');
    }
    
    return Promise.reject(error);
  }
);

// Family API endpoints
export const familyAPI = {
  // Get all families with optional filters
  getAll: (params = {}) => api.get('/families', { params }),
  
  // Get single family by ID
  getById: (id) => api.get(`/families/${id}`),
  
  // Create new family
  create: (data) => api.post('/families', data),
  
  // Update family
  update: (id, data) => api.put(`/families/${id}`, data),
  
  // Delete family
  delete: (id) => api.delete(`/families/${id}`)
};

// Iuran API endpoints
export const iuranAPI = {
  // Get all iuran records with optional filters
  getAll: (params = {}) => api.get('/iuran', { params }),
  
  // Get single iuran record by ID
  getById: (id) => api.get(`/iuran/${id}`),
  
  // Create new iuran record
  create: (data) => api.post('/iuran', data),
  
  // Update iuran record
  update: (id, data) => api.put(`/iuran/${id}`, data),
  
  // Delete iuran record
  delete: (id) => api.delete(`/iuran/${id}`)
};

// Statistics API endpoints
export const statistikAPI = {
  // Get aggregated statistics
  getAll: () => api.get('/statistik')
};

// Health check
export const healthAPI = {
  check: () => api.get('/health')
};

export default api;