import axios, { AxiosError, AxiosInstance } from 'axios';
import { TripAPIError } from '../types';

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://jamess-mac-mini:3006';
const API_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Axios Instance
// ============================================================================

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Request Interceptor
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor
// ============================================================================

apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    return Promise.reject(handleAPIError(error));
  }
);

// ============================================================================
// Error Handler
// ============================================================================

function handleAPIError(error: AxiosError): TripAPIError {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data as any;

    let message = 'An error occurred while processing your request';
    let code = 'UNKNOWN_ERROR';

    if (data?.message) {
      message = data.message;
    } else if (data?.error) {
      message = data.error;
    } else {
      switch (status) {
        case 400:
          message = 'Invalid request. Please check your input.';
          code = 'BAD_REQUEST';
          break;
        case 401:
          message = 'Authentication required.';
          code = 'UNAUTHORIZED';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          code = 'FORBIDDEN';
          break;
        case 404:
          message = 'The requested resource was not found.';
          code = 'NOT_FOUND';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          code = 'INTERNAL_SERVER_ERROR';
          break;
        case 503:
          message = 'Service temporarily unavailable. Please try again later.';
          code = 'SERVICE_UNAVAILABLE';
          break;
      }
    }

    if (data?.code) {
      code = data.code;
    }

    console.error(`[API Error] ${status} - ${message}`, {
      code,
      url: error.config?.url,
      data: error.response.data,
    });

    return new TripAPIError(message, code, status, data);
  } else if (error.request) {
    console.error('[API Error] No response received', {
      url: error.config?.url,
      timeout: error.code === 'ECONNABORTED',
    });

    const message =
      error.code === 'ECONNABORTED'
        ? 'Request timed out. Please check your connection and try again.'
        : 'Unable to reach the server. Please check your connection.';

    return new TripAPIError(message, 'NETWORK_ERROR', 0);
  } else {
    console.error('[API Error] Request setup failed', error.message);
    return new TripAPIError(
      error.message || 'An unexpected error occurred',
      'REQUEST_SETUP_ERROR'
    );
  }
}

// ============================================================================
// Base Service Class
// ============================================================================

export abstract class BaseAPIService {
  protected async get<T>(url: string): Promise<T> {
    try {
      const response = await apiClient.get<T>(url);
      return response.data;
    } catch (error) {
      throw error instanceof TripAPIError ? error : new TripAPIError('Request failed');
    }
  }

  protected async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await apiClient.post<T>(url, data);
      return response.data;
    } catch (error) {
      throw error instanceof TripAPIError ? error : new TripAPIError('Request failed');
    }
  }

  protected async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await apiClient.put<T>(url, data);
      return response.data;
    } catch (error) {
      throw error instanceof TripAPIError ? error : new TripAPIError('Request failed');
    }
  }

  protected async delete<T>(url: string): Promise<T> {
    try {
      const response = await apiClient.delete<T>(url);
      return response.data;
    } catch (error) {
      throw error instanceof TripAPIError ? error : new TripAPIError('Request failed');
    }
  }
}
