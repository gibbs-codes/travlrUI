import { RecommendationService } from './recommendationService';
import type { Transit } from '../types';

/**
 * Experience Service
 * Handles activities and transit recommendations
 */
class ExperienceService extends RecommendationService<Transit> {
  protected readonly resourcePath = 'experiences';

  /**
   * Get experiences with specific filters
   */
  async getExperiencesWithFilters(
    tripId: string,
    filters: {
      category?: string[];
      maxPrice?: number;
      duration?: string;
      indoor?: boolean;
    }
  ) {
    return this.post<{ recommendations: Transit[] }>(
      `/api/trip/${tripId}/${this.resourcePath}/filter`,
      filters
    );
  }

  /**
   * Get activities by category
   */
  async getActivitiesByCategory(
    tripId: string,
    category: 'cultural' | 'adventure' | 'food' | 'relaxation'
  ) {
    return this.get<{ recommendations: Transit[] }>(
      `/api/trip/${tripId}/${this.resourcePath}/category/${category}`
    );
  }

  /**
   * Get transit options (transportation)
   */
  async getTransitOptions(tripId: string) {
    return this.get<{ recommendations: Transit[] }>(
      `/api/trip/${tripId}/transit`
    );
  }

  /**
   * Sort experiences by criteria
   */
  sortExperiences(
    experiences: Transit[],
    sortBy: 'price' | 'duration' | 'popularity'
  ): Transit[] {
    switch (sortBy) {
      case 'price':
        return [...experiences].sort((a, b) =>
          (a.fare?.amount ?? Infinity) - (b.fare?.amount ?? Infinity)
        );
      case 'duration':
        return [...experiences].sort((a, b) => {
          const aDuration = this.parseDuration(a.durationISO);
          const bDuration = this.parseDuration(b.durationISO);
          return aDuration - bDuration;
        });
      default:
        return experiences;
    }
  }

  private parseDuration(iso: string): number {
    const hours = iso.match(/(\d+)H/)?.[1] || '0';
    const minutes = iso.match(/(\d+)M/)?.[1] || '0';
    return parseInt(hours) * 60 + parseInt(minutes);
  }
}

// Export singleton instance
export const experienceService = new ExperienceService();
