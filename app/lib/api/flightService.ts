import { RecommendationService } from './recommendationService';
import type { Flight } from '../types';

/**
 * Flight Service
 * Handles flight recommendations
 */
class FlightService extends RecommendationService<Flight> {
  protected readonly resourcePath = 'flight';

  /**
   * Get flights with specific filters
   */
  async getFlightsWithFilters(
    tripId: string,
    filters: {
      maxPrice?: number;
      maxStops?: number;
      preferredCarrier?: string;
      cabinClass?: string;
    }
  ) {
    return this.post<{ recommendations: Flight[] }>(
      `/api/trip/${tripId}/${this.resourcePath}/filter`,
      filters
    );
  }

  /**
   * Sort flights by criteria
   */
  sortFlights(
    flights: Flight[],
    sortBy: 'price' | 'duration' | 'departure'
  ): Flight[] {
    switch (sortBy) {
      case 'price':
        return [...flights].sort((a, b) =>
          (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity)
        );
      case 'duration':
        return [...flights].sort((a, b) => {
          const aDuration = this.parseDuration(a.durationISO);
          const bDuration = this.parseDuration(b.durationISO);
          return aDuration - bDuration;
        });
      case 'departure':
        return [...flights].sort((a, b) =>
          new Date(a.depart).getTime() - new Date(b.depart).getTime()
        );
      default:
        return flights;
    }
  }

  private parseDuration(iso: string): number {
    // Parse ISO 8601 duration (e.g., PT2H30M)
    const hours = iso.match(/(\d+)H/)?.[1] || '0';
    const minutes = iso.match(/(\d+)M/)?.[1] || '0';
    return parseInt(hours) * 60 + parseInt(minutes);
  }
}

// Export singleton instance
export const flightService = new FlightService();
