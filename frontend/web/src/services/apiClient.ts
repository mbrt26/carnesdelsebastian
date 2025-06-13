import axios, { AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '../types';

// Configuración base de Axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug logging en desarrollo
const isDebugEnabled = process.env.REACT_APP_ENABLE_DEBUG === 'true' && process.env.NODE_ENV === 'development';

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging
    if (isDebugEnabled) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
        headers: config.headers,
      });
    }
    
    return config;
  },
  (error) => {
    if (isDebugEnabled) {
      console.error('❌ API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Interceptor para manejo de respuestas y errores
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Debug logging para respuestas exitosas
    if (isDebugEnabled) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Debug logging para errores
    if (isDebugEnabled) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Manejo de errores de conexión
    if (!error.response) {
      const connectionError: ApiError = {
        error: 'No se pudo conectar con el servidor. Verifique que el backend esté ejecutándose.',
        details: ['El servidor backend no está disponible en ' + apiClient.defaults.baseURL],
      };
      return Promise.reject(connectionError);
    }

    // Manejo de errores de autenticación
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Manejo de errores del servidor
    const apiError: ApiError = {
      error: error.response?.data?.error || `Error ${error.response?.status}: ${error.response?.statusText}`,
      details: error.response?.data?.details,
    };

    return Promise.reject(apiError);
  }
);

export default apiClient;