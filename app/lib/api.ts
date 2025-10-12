import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import {
  TripRequest,
  TripResponse,
  TripStatusResponse,
  SelectionRequest,
  SelectionResponse,
  TripAPIError,
} from './types';

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://jamess-mac-mini:3006';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
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
    // Add timestamp to requests for debugging
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
  (response: AxiosResponse) => {
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
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data as any;

    let message = 'An error occurred while processing your request';
    let code = 'UNKNOWN_ERROR';

    if (data?.message) {
      message = data.message;
    } else if (data?.error) {
      message = data.error;
    } else {
      // Default messages based on status code
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
    // Request was made but no response received
    console.error('[API Error] No response received', {
      url: error.config?.url,
      timeout: error.code === 'ECONNABORTED',
    });

    const message = error.code === 'ECONNABORTED'
      ? 'Request timed out. Please check your connection and try again.'
      : 'Unable to reach the server. Please check your connection.';

    return new TripAPIError(message, 'NETWORK_ERROR', 0);
  } else {
    // Error setting up the request
    console.error('[API Error] Request setup failed', error.message);
    return new TripAPIError(
      error.message || 'An unexpected error occurred',
      'REQUEST_SETUP_ERROR'
    );
  }
}

// ============================================================================
// API Service Functions
// ============================================================================

/**
 * Create a new trip
 */
export async function createTrip(data: TripRequest): Promise<TripResponse> {
  try {
    const response = await apiClient.post<TripResponse>('/api/trip/create', data);
    return response.data;
  } catch (error) {
    throw error instanceof TripAPIError ? error : new TripAPIError('Failed to create trip');
  }
}

/**
 * Get trip status (for polling during AI agent processing)
 */
export async function getTripStatus(tripId: string): Promise<TripStatusResponse> {
  try {
    const response = await apiClient.get<TripStatusResponse>(`/api/trip/${tripId}/status`);
    return response.data;
  } catch (error) {
    throw error instanceof TripAPIError ? error : new TripAPIError('Failed to fetch trip status');
  }
}

/**
 * Get full trip details including recommendations
 */
export async function getTripDetails(tripId: string): Promise<TripResponse> {
  try {
    const response = await apiClient.get<TripResponse>(`/api/trip/${tripId}`);
    return response.data;
  } catch (error) {
    throw error instanceof TripAPIError ? error : new TripAPIError('Failed to fetch trip details');
  }
}

/**
 * Submit user's selected recommendations
 */
export async function selectRecommendations(
  tripId: string,
  selections: SelectionRequest
): Promise<SelectionResponse> {
  try {
    const response = await apiClient.put<SelectionResponse>(
      `/api/trip/${tripId}/select`,
      selections
    );
    return response.data;
  } catch (error) {
    throw error instanceof TripAPIError
      ? error
      : new TripAPIError('Failed to save selections');
  }
}

/**
 * Delete a trip (optional - for cleanup)
 */
export async function deleteTrip(tripId: string): Promise<{ message: string }> {
  try {
    const response = await apiClient.delete<{ message: string }>(`/api/trip/${tripId}`);
    return response.data;
  } catch (error) {
    throw error instanceof TripAPIError ? error : new TripAPIError('Failed to delete trip');
  }
}

// ============================================================================
// Legacy Export (for backward compatibility with existing code)
// ============================================================================

export const api = apiClient;

export const tripAPI = {
  create: createTrip,
  getStatus: getTripStatus,
  get: getTripDetails,
  selectRecommendations: (tripId: string, data: SelectionRequest) =>
    selectRecommendations(tripId, data),
  delete: deleteTrip,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Poll trip status until completion or timeout
 * @param tripId Trip ID to poll
 * @param onUpdate Callback for status updates
 * @param interval Polling interval in milliseconds (default: 3000)
 * @param timeout Maximum polling duration in milliseconds (default: 300000 = 5 minutes)
 */
export async function pollTripStatus(
  tripId: string,
  onUpdate: (status: TripStatusResponse) => void,
  interval: number = 3000,
  timeout: number = 300000
): Promise<TripStatusResponse> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getTripStatus(tripId);
        onUpdate(status);

        // Check if complete
        if (status.status === 'recommendations_ready' || status.status === 'finalized') {
          resolve(status);
          return;
        }

        // Check if failed
        if (status.status === 'failed') {
          reject(new TripAPIError('Trip processing failed', 'PROCESSING_FAILED'));
          return;
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          reject(new TripAPIError('Trip processing timed out', 'POLLING_TIMEOUT'));
          return;
        }

        // Continue polling
        setTimeout(poll, interval);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

/**
 * Check if API is reachable
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  createTrip,
  getTripStatus,
  getTripDetails,
  selectRecommendations,
  deleteTrip,
  pollTripStatus,
  checkAPIHealth,
};
