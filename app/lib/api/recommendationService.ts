import { BaseAPIService } from './baseService';

export interface RecommendationResponse<T> {
  recommendations: T[];
  count: number;
  tripId: string;
}

export interface RerunRequest {
  reason?: string;
  filters?: Record<string, any>;
}

export interface SelectionRequest {
  recommendationId: string;
  selectedBy?: string;
}

/**
 * Base Recommendation Service
 * Shared logic for all recommendation types (flights, hotels, etc.)
 */
export abstract class RecommendationService<T> extends BaseAPIService {
  protected abstract readonly resourcePath: string;

  /**
   * Get all recommendations for a specific type
   */
  async getRecommendations(tripId: string): Promise<RecommendationResponse<T>> {
    return this.get<RecommendationResponse<T>>(
      `/api/trip/${tripId}/${this.resourcePath}`
    );
  }

  /**
   * Trigger re-run of recommendations
   */
  async rerunRecommendations(
    tripId: string,
    request?: RerunRequest
  ): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(
      `/api/trip/${tripId}/${this.resourcePath}/rerun`,
      request
    );
  }

  /**
   * Select a specific recommendation
   */
  async selectRecommendation(
    tripId: string,
    recommendationId: string,
    selectedBy?: string
  ): Promise<{ success: boolean; selection: T }> {
    return this.post<{ success: boolean; selection: T }>(
      `/api/trip/${tripId}/${this.resourcePath}/select`,
      { recommendationId, selectedBy }
    );
  }

  /**
   * Get a single recommendation by ID
   */
  async getRecommendationById(
    tripId: string,
    recommendationId: string
  ): Promise<T> {
    return this.get<T>(
      `/api/trip/${tripId}/${this.resourcePath}/${recommendationId}`
    );
  }
}
