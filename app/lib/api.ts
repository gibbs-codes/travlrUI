/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * New code should use the modular services in app/lib/api/
 *
 * Import like this:
 * import { tripService, flightService } from '@/app/lib/api';
 */

import { tripService } from './api/tripService';
import { flightService } from './api/flightService';
import { hotelService } from './api/hotelService';
import { experienceService } from './api/experienceService';
import { restaurantService } from './api/restaurantService';
import { apiClient } from './api/baseService';
import type {
  TripRequest,
  TripResponse,
  TripStatusResponse,
  SelectionRequest,
  SelectionResponse,
} from './types';

// Re-export all services for easy access
export { tripService, flightService, hotelService, experienceService, restaurantService };

// ============================================================================
// Backward Compatibility - Delegate to new services
// ============================================================================

/**
 * Create a new trip
 * @deprecated Use tripService.createTrip() instead
 */
export async function createTrip(data: TripRequest): Promise<TripResponse> {
  return tripService.createTrip(data);
}

/**
 * Get trip status (for polling during AI agent processing)
 * @deprecated Use tripService.getTripStatus() instead
 */
export async function getTripStatus(tripId: string): Promise<TripStatusResponse> {
  return tripService.getTripStatus(tripId);
}

/**
 * Get full trip details including recommendations
 * @deprecated Use tripService.getTripDetails() instead
 */
export async function getTripDetails(tripId: string): Promise<TripResponse> {
  return tripService.getTripDetails(tripId);
}

/**
 * Submit user's selected recommendations
 * @deprecated Use tripService.selectRecommendations() instead
 */
export async function selectRecommendations(
  tripId: string,
  selections: SelectionRequest
): Promise<SelectionResponse> {
  return tripService.selectRecommendations(tripId, selections);
}

/**
 * Delete a trip (optional - for cleanup)
 * @deprecated Use tripService.deleteTrip() instead
 */
export async function deleteTrip(tripId: string): Promise<{ message: string }> {
  return tripService.deleteTrip(tripId);
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
          reject(new Error('Trip processing failed'));
          return;
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          reject(new Error('Trip processing timed out'));
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
