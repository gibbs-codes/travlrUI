/**
 * Modular API Service Layer
 *
 * Centralized exports for all API services
 */

// Base services
export { apiClient, BaseAPIService } from './baseService';
export { RecommendationService } from './recommendationService';
export type { RecommendationResponse, RerunRequest, SelectionRequest } from './recommendationService';

// Specific services
import { tripService } from './tripService';
import { flightService } from './flightService';
import { hotelService } from './hotelService';
import { experienceService } from './experienceService';
import { restaurantService } from './restaurantService';

// Re-export services
export { tripService, flightService, hotelService, experienceService, restaurantService };

// Convenience object for accessing all services
export const api = {
  trip: tripService,
  flight: flightService,
  hotel: hotelService,
  experience: experienceService,
  restaurant: restaurantService,
};

// Default export
export default api;
