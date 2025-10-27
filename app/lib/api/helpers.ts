/**
 * API Service Helpers
 * Utility functions for mapping agent types to API endpoints
 */

import type { AgentType } from '../types';

/**
 * Map agent types to their corresponding API endpoint paths
 *
 * @example
 * agentTypeToEndpoint('flight') // Returns 'flight'
 * agentTypeToEndpoint('accommodation') // Returns 'accommodation'
 */
export function agentTypeToEndpoint(agentType: AgentType): string {
  const mapping: Record<AgentType, string> = {
    flight: 'flight',
    accommodation: 'accommodation',
    activity: 'activity',
    restaurant: 'restaurant',
    transportation: 'transportation',
  };

  return mapping[agentType] || agentType;
}

/**
 * Map agent types to their plural endpoint paths (legacy support)
 * Some endpoints may use plural forms
 *
 * @example
 * agentTypeToPluralEndpoint('flight') // Returns 'flights'
 * agentTypeToPluralEndpoint('accommodation') // Returns 'hotels'
 */
export function agentTypeToPluralEndpoint(agentType: AgentType): string {
  const mapping: Record<AgentType, string> = {
    flight: 'flights',
    accommodation: 'hotels',
    activity: 'experiences',
    restaurant: 'restaurants',
    transportation: 'transportation',
  };

  return mapping[agentType] || `${agentType}s`;
}

/**
 * Map endpoint paths back to agent types
 *
 * @example
 * endpointToAgentType('flight') // Returns 'flight'
 * endpointToAgentType('accommodation') // Returns 'accommodation'
 */
export function endpointToAgentType(endpoint: string): AgentType | null {
  const mapping: Record<string, AgentType> = {
    flight: 'flight',
    flights: 'flight',
    accommodation: 'accommodation',
    hotel: 'accommodation',
    hotels: 'accommodation',
    activity: 'activity',
    activities: 'activity',
    experience: 'activity',
    experiences: 'activity',
    restaurant: 'restaurant',
    restaurants: 'restaurant',
    transportation: 'transportation',
  };

  return mapping[endpoint] || null;
}

/**
 * Get human-readable name for agent type
 *
 * @example
 * getAgentDisplayName('flight') // Returns 'Flight'
 * getAgentDisplayName('accommodation') // Returns 'Hotel'
 */
export function getAgentDisplayName(agentType: AgentType): string {
  const mapping: Record<AgentType, string> = {
    flight: 'Flight',
    accommodation: 'Hotel',
    activity: 'Activity',
    restaurant: 'Restaurant',
    transportation: 'Transportation',
  };

  return mapping[agentType] || agentType;
}

/**
 * Get plural human-readable name for agent type
 *
 * @example
 * getAgentPluralName('flight') // Returns 'Flights'
 * getAgentPluralName('accommodation') // Returns 'Hotels'
 */
export function getAgentPluralName(agentType: AgentType): string {
  const mapping: Record<AgentType, string> = {
    flight: 'Flights',
    accommodation: 'Hotels',
    activity: 'Activities',
    restaurant: 'Restaurants',
    transportation: 'Transportation',
  };

  return mapping[agentType] || `${agentType}s`;
}

/**
 * Validate if a string is a valid agent type
 *
 * @example
 * isValidAgentType('flight') // Returns true
 * isValidAgentType('invalid') // Returns false
 */
export function isValidAgentType(value: string): value is AgentType {
  const validTypes: AgentType[] = [
    'flight',
    'accommodation',
    'activity',
    'restaurant',
    'transportation',
  ];

  return validTypes.includes(value as AgentType);
}

/**
 * Build recommendation endpoint path for a given agent type
 *
 * @example
 * buildRecommendationPath('123', 'flight') // Returns '/api/trip/123/flight'
 * buildRecommendationPath('123', 'accommodation') // Returns '/api/trip/123/accommodation'
 */
export function buildRecommendationPath(tripId: string, agentType: AgentType): string {
  const endpoint = agentTypeToEndpoint(agentType);
  return `/api/trip/${tripId}/${endpoint}`;
}

/**
 * Build rerun endpoint path for a given agent type
 *
 * @example
 * buildRerunPath('123', 'flight') // Returns '/api/trip/123/flight/rerun'
 */
export function buildRerunPath(tripId: string, agentType: AgentType): string {
  const endpoint = agentTypeToEndpoint(agentType);
  return `/api/trip/${tripId}/${endpoint}/rerun`;
}

/**
 * Build agent start endpoint path
 *
 * @example
 * buildAgentStartPath('123') // Returns '/api/trip/123/agents/start'
 */
export function buildAgentStartPath(tripId: string): string {
  return `/api/trip/${tripId}/agents/start`;
}

/**
 * Build status endpoint path
 *
 * @example
 * buildStatusPath('123') // Returns '/api/trip/123/status'
 */
export function buildStatusPath(tripId: string): string {
  return `/api/trip/${tripId}/status`;
}

/**
 * Parse filters object into query string
 *
 * @example
 * buildQueryString({ maxPrice: 500, stops: 0 })
 * // Returns '?maxPrice=500&stops=0'
 */
export function buildQueryString(filters?: Record<string, any>): string {
  if (!filters || Object.keys(filters).length === 0) {
    return '';
  }

  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Get service instance for a given agent type
 * Helper for dynamic service access
 *
 * @example
 * const service = getServiceForAgentType('flight');
 * const recommendations = await service.getRecommendations(tripId);
 */
export function getServiceForAgentType(agentType: AgentType) {
  // This would import and return the appropriate service
  // Implementation depends on how services are structured
  // For now, return the mapping
  const serviceMap = {
    flight: 'flightService',
    accommodation: 'hotelService',
    activity: 'experienceService',
    restaurant: 'restaurantService',
    transportation: 'experienceService',
  };

  return serviceMap[agentType];
}

/**
 * Batch agent types to endpoint paths
 * Useful for making multiple requests
 *
 * @example
 * batchAgentEndpoints(['flight', 'accommodation'])
 * // Returns ['flight', 'accommodation']
 */
export function batchAgentEndpoints(agentTypes: AgentType[]): string[] {
  return agentTypes.map(agentTypeToEndpoint);
}

/**
 * Type guard to check if response has recommendations
 */
export function hasRecommendations<T>(
  response: any
): response is { recommendations: T[]; count: number } {
  return (
    response &&
    typeof response === 'object' &&
    Array.isArray(response.recommendations) &&
    typeof response.count === 'number'
  );
}

/**
 * Type guard to check if response is success response
 */
export function isSuccessResponse(
  response: any
): response is { success: boolean; message: string } {
  return (
    response &&
    typeof response === 'object' &&
    typeof response.success === 'boolean' &&
    typeof response.message === 'string'
  );
}
