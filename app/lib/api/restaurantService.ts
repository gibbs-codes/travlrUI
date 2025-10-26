import { RecommendationService } from './recommendationService';
import type { Restaurant } from '../types';

/**
 * Restaurant Service
 * Handles restaurant recommendations
 */
class RestaurantService extends RecommendationService<Restaurant> {
  protected readonly resourcePath = 'restaurants';

  /**
   * Get restaurants with specific filters
   */
  async getRestaurantsWithFilters(
    tripId: string,
    filters: {
      cuisine?: string[];
      priceLevel?: number[];
      maxDistance?: number;
      minRating?: number;
      openNow?: boolean;
    }
  ) {
    return this.post<{ recommendations: Restaurant[] }>(
      `/api/trip/${tripId}/${this.resourcePath}/filter`,
      filters
    );
  }

  /**
   * Get restaurants by cuisine type
   */
  async getRestaurantsByCuisine(tripId: string, cuisine: string) {
    return this.get<{ recommendations: Restaurant[] }>(
      `/api/trip/${tripId}/${this.resourcePath}/cuisine/${cuisine}`
    );
  }

  /**
   * Get restaurants near a location
   */
  async getRestaurantsNearLocation(
    tripId: string,
    latitude: number,
    longitude: number,
    radiusMiles?: number
  ) {
    return this.post<{ recommendations: Restaurant[] }>(
      `/api/trip/${tripId}/${this.resourcePath}/nearby`,
      { latitude, longitude, radiusMiles: radiusMiles || 5 }
    );
  }

  /**
   * Sort restaurants by criteria
   */
  sortRestaurants(
    restaurants: Restaurant[],
    sortBy: 'price' | 'rating' | 'distance'
  ): Restaurant[] {
    switch (sortBy) {
      case 'price':
        return [...restaurants].sort((a, b) =>
          (a.priceLevel ?? 0) - (b.priceLevel ?? 0)
        );
      case 'rating':
        return [...restaurants].sort((a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0)
        );
      case 'distance':
        return [...restaurants].sort((a, b) =>
          (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity)
        );
      default:
        return restaurants;
    }
  }

  /**
   * Filter restaurants by open status
   */
  filterByOpenStatus(restaurants: Restaurant[], openNow: boolean): Restaurant[] {
    return restaurants.filter((restaurant) => restaurant.openNow === openNow);
  }

  /**
   * Get restaurants by price level
   */
  filterByPriceLevel(
    restaurants: Restaurant[],
    minLevel: number,
    maxLevel: number
  ): Restaurant[] {
    return restaurants.filter((restaurant) => {
      const level = restaurant.priceLevel ?? 0;
      return level >= minLevel && level <= maxLevel;
    });
  }
}

// Export singleton instance
export const restaurantService = new RestaurantService();
