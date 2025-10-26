import { RecommendationService } from './recommendationService';
import type { Stay } from '../types';

/**
 * Hotel Service
 * Handles accommodation recommendations
 */
class HotelService extends RecommendationService<Stay> {
  protected readonly resourcePath = 'hotels';

  /**
   * Get hotels with specific filters
   */
  async getHotelsWithFilters(
    tripId: string,
    filters: {
      maxPrice?: number;
      minRating?: number;
      amenities?: string[];
      location?: string;
    }
  ) {
    return this.post<{ recommendations: Stay[] }>(
      `/api/trip/${tripId}/${this.resourcePath}/filter`,
      filters
    );
  }

  /**
   * Sort hotels by criteria
   */
  sortHotels(
    hotels: Stay[],
    sortBy: 'price' | 'rating' | 'distance'
  ): Stay[] {
    switch (sortBy) {
      case 'price':
        return [...hotels].sort((a, b) =>
          (a.total?.amount ?? Infinity) - (b.total?.amount ?? Infinity)
        );
      case 'rating':
        return [...hotels].sort((a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0)
        );
      case 'distance':
        return [...hotels].sort((a, b) =>
          (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity)
        );
      default:
        return hotels;
    }
  }

  /**
   * Check hotel availability for specific dates
   */
  async checkAvailability(
    tripId: string,
    hotelId: string,
    checkIn: string,
    checkOut: string
  ) {
    return this.post<{ available: boolean; price?: number }>(
      `/api/trip/${tripId}/${this.resourcePath}/${hotelId}/availability`,
      { checkIn, checkOut }
    );
  }
}

// Export singleton instance
export const hotelService = new HotelService();
