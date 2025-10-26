import { BaseAPIService } from './baseService';
import type {
  TripRequest,
  TripResponse,
  TripStatusResponse,
  SelectionRequest,
  SelectionResponse,
} from '../types';

/**
 * Trip Service
 * Handles trip creation, status polling, and trip details
 */
class TripService extends BaseAPIService {
  /**
   * Create a new trip
   */
  async createTrip(data: TripRequest): Promise<TripResponse> {
    return this.post<TripResponse>('/api/trip/create', data);
  }

  /**
   * Get trip status (for polling during AI agent processing)
   */
  async getTripStatus(tripId: string): Promise<TripStatusResponse> {
    return this.get<TripStatusResponse>(`/api/trip/${tripId}/status`);
  }

  /**
   * Get full trip details including all recommendations
   */
  async getTripDetails(tripId: string): Promise<TripResponse> {
    return this.get<TripResponse>(`/api/trip/${tripId}`);
  }

  /**
   * Submit user's selected recommendations
   */
  async selectRecommendations(
    tripId: string,
    selections: SelectionRequest
  ): Promise<SelectionResponse> {
    return this.put<SelectionResponse>(`/api/trip/${tripId}/select`, selections);
  }

  /**
   * Get trip summary/overview
   */
  async getTripSummary(tripId: string): Promise<TripResponse> {
    return this.getTripDetails(tripId);
  }

  /**
   * Delete a trip
   */
  async deleteTrip(tripId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/api/trip/${tripId}`);
  }
}

// Export singleton instance
export const tripService = new TripService();
