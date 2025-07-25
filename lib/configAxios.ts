import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Lấy base URL từ environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://soometa-be.onrender.com';

// Tạo axios instance với cấu hình mặc định
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Hàm lấy token từ nhiều nguồn
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Thử lấy từ localStorage trước
  let token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // Nếu không có, thử lấy từ authStore (nếu có)
  if (!token) {
    try {
      // Dynamic import để tránh circular dependency
      const authStore = require('../app/store/authStore');
      if (authStore && authStore.useAuthStore) {
        // Lấy token từ store nếu có
        const store = authStore.useAuthStore.getState();
        token = store.token;
      }
    } catch (error) {
      // Ignore error if store is not available
    }
  }

  return token;
};

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Luôn thêm token vào header nếu có
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi chung
    if (error.response) {
      // Server trả về response với status code lỗi
      const { status, data } = error.response;
      
      console.error('❌ API Error:', {
        status,
        url: error.config?.url,
        message: data?.message || data?.error || 'Unknown error',
        data,
      });
      
      // Xử lý các status code cụ thể
      switch (status) {
        case 401:
          // Unauthorized - xóa token và redirect về login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            
            // Thử clear token từ authStore
            try {
              const authStore = require('../app/store/authStore');
              if (authStore && authStore.useAuthStore) {
                const store = authStore.useAuthStore.getState();
                if (store.logout) {
                  store.logout();
                }
              }
            } catch (error) {
              // Ignore error if store is not available
            }
            
            // Có thể thêm redirect logic ở đây
            console.warn('Token expired or invalid. Please login again.');
          }
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden - insufficient permissions');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Internal server error');
          break;
        default:
          console.error(`HTTP Error: ${status}`);
      }
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.error('❌ Network Error:', error.message);
    } else {
      // Lỗi khác
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions
export const api = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then(response => response.data),
  
  // POST request
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then(response => response.data),
  
  // PUT request
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then(response => response.data),
  
  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then(response => response.data),
  
  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then(response => response.data),
};

// Export axios instance để sử dụng trực tiếp nếu cần
export default apiClient;

// Export base URL và helper function để sử dụng ở nơi khác
export { API_BASE_URL, getAuthToken }; 