/**
 * Trip Agent Card - Wrapper component that combines AgentCard with data fetching
 *
 * This component:
 * - Uses useAgentStatus hook for polling agent status
 * - Fetches recommendations when agent completes
 * - Handles rerun and generate actions
 * - Renders appropriate recommendation cards based on agent type
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAgentStatus } from '../hooks/useAgentStatus';
import { AgentCard } from './AgentCard';
import { ConfirmDialog } from './ConfirmDialog';
import { Celebration } from './Celebration';
import { flightService, hotelService, experienceService, restaurantService, tripService } from '../lib/api';
import { toast } from '../lib/toast';
import type { AgentType } from '../lib/types';
import type { Flight, Stay, Transit, Restaurant } from '../lib/types';

interface TripAgentCardProps {
  tripId: string;
  agentType: AgentType;
}

// Service mapping
const SERVICES = {
  flight: flightService,
  accommodation: hotelService,
  activity: experienceService,
  restaurant: restaurantService,
  transportation: experienceService, // Use experience service for transportation
} as const;

export const TripAgentCard = React.memo(function TripAgentCard({ tripId, agentType }: TripAgentCardProps) {
  const { status, recommendationCount, error, refetch } = useAgentStatus(tripId, agentType);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  // Fetch recommendations when status becomes completed
  const fetchRecommendations = useCallback(async () => {
    if (status !== 'completed' || !tripId) return;

    console.log(`[TripAgentCard] Fetching recommendations for ${agentType}`);
    setIsLoadingRecs(true);
    setRecsError(null);

    try {
      const service = SERVICES[agentType];
      if (!service) {
        console.error(`[TripAgentCard] No service found for agent type: ${agentType}`);
        return;
      }

      const response = await service.getRecommendations(tripId);
      console.log(`[TripAgentCard] Fetched ${response.recommendations?.length || 0} recommendations for ${agentType}`);

      setRecommendations(response.recommendations || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
      console.error(`[TripAgentCard] Error fetching recommendations for ${agentType}:`, err);
      setRecsError(errorMessage);
    } finally {
      setIsLoadingRecs(false);
    }
  }, [status, tripId, agentType]);

  // Fetch recommendations and show celebration when status changes to completed
  useEffect(() => {
    if (status === 'completed' && prevStatus !== 'completed') {
      fetchRecommendations();
      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    setPrevStatus(status);
  }, [status, prevStatus, fetchRecommendations]);

  // Get human-readable agent names
  const getAgentName = (type: AgentType): string => {
    const names: Record<AgentType, string> = {
      flight: 'flight',
      accommodation: 'hotel',
      activity: 'activity',
      restaurant: 'restaurant',
      transportation: 'transportation',
    };
    return names[type] || type;
  };

  // Show confirmation dialog for rerun
  const handleRerunClick = useCallback(() => {
    setShowRerunConfirm(true);
  }, []);

  // Handle confirmed rerun - trigger agent to generate more recommendations
  const handleRerunConfirmed = useCallback(async () => {
    setShowRerunConfirm(false);

    const agentName = getAgentName(agentType);
    console.log(`[TripAgentCard] Rerunning ${agentType} recommendations`);

    // Clear current recommendations optimistically
    setRecommendations([]);
    setIsLoadingRecs(true);
    setRecsError(null);

    try {
      const service = SERVICES[agentType];
      if (!service) {
        throw new Error('Service not available');
      }

      // Show loading toast
      toast.info(`Generating new ${agentName} recommendations...`);

      // Call rerun endpoint
      await service.rerunRecommendations(tripId, {
        reason: 'User requested new options',
      });

      // Show success toast
      toast.success(`Started generating new ${agentName} recommendations!`);

      // Refetch status to see the agent running again
      await refetch();

      // Recommendations will be fetched automatically when status becomes completed
    } catch (err: any) {
      console.error(`[TripAgentCard] Error rerunning ${agentType}:`, err);

      // Handle specific error codes
      let errorMessage = 'Failed to rerun agent, please try again';

      if (err.status === 409) {
        errorMessage = 'Agents are currently running, please wait';
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Show error toast
      toast.error(errorMessage);
      setRecsError(errorMessage);

      // Restore recommendations on error (refetch them)
      if (status === 'completed') {
        fetchRecommendations();
      }
    } finally {
      setIsLoadingRecs(false);
    }
  }, [tripId, agentType, refetch, status, fetchRecommendations]);

  // Handle cancel confirmation
  const handleRerunCancel = useCallback(() => {
    setShowRerunConfirm(false);
  }, []);

  // Handle generate - start a skipped agent
  const handleGenerate = useCallback(async () => {
    console.log(`[TripAgentCard] Generating ${agentType} recommendations (was skipped)`);
    setRecsError(null);

    // Get human-readable agent name
    const agentNames: Record<AgentType, string> = {
      flight: 'flight',
      accommodation: 'hotel',
      activity: 'activity',
      restaurant: 'restaurant',
      transportation: 'transportation',
    };
    const agentName = agentNames[agentType] || agentType;

    try {
      // Show loading toast
      toast.info(`Generating ${agentName} recommendations...`);

      // Call the backend to start the agent
      await tripService.startAgents(tripId, [agentType]);

      // Show success toast
      toast.success(`Started generating ${agentName} recommendations!`);

      // Refetch status to see the agent starting
      await refetch();
    } catch (err: any) {
      console.error(`[TripAgentCard] Error starting ${agentType}:`, err);

      // Handle specific error codes
      let errorMessage = 'Failed to start agent, please try again';

      if (err.status === 409) {
        errorMessage = 'Agents are currently running, please wait';
      } else if (err.status === 400) {
        errorMessage = 'Invalid agent request';
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Show error toast
      toast.error(errorMessage);
      setRecsError(errorMessage);
    }
  }, [tripId, agentType, refetch]);

  // Map agent status to card status
  const cardStatus = status || 'pending';
  const agentName = getAgentName(agentType);

  return (
    <>
      {/* Celebration Animation */}
      <Celebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        message={`Found ${recommendationCount} great ${agentName} options!`}
      />

      <AgentCard
        agentType={agentType}
        tripId={tripId}
        status={cardStatus}
        recommendationCount={recommendationCount}
        onRerun={status === 'completed' ? handleRerunClick : undefined}
        onGenerate={status === 'skipped' ? handleGenerate : undefined}
      >
      {/* Show recommendations when completed */}
      {status === 'completed' && (
        <div className="space-y-3">
          {isLoadingRecs && (
            <p className="text-sm text-gray-500 text-center">Loading recommendations...</p>
          )}

          {recsError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <p className="font-medium">Error loading recommendations</p>
              <p>{recsError}</p>
            </div>
          )}

          {!isLoadingRecs && !recsError && recommendations.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              No recommendations found. Try getting more options.
            </p>
          )}

          {!isLoadingRecs && !recsError && recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} found
              </p>

              {/* Render recommendation preview cards */}
              {recommendations.slice(0, 3).map((rec, index) => (
                <RecommendationPreview
                  key={rec.id || index}
                  recommendation={rec}
                  agentType={agentType}
                />
              ))}

              {recommendations.length > 3 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  + {recommendations.length - 3} more options
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Show error from hook if any */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <p className="font-medium">Status Error</p>
          <p>{error}</p>
        </div>
      )}
      </AgentCard>

      {/* Confirmation Dialog for Rerun */}
      <ConfirmDialog
        isOpen={showRerunConfirm}
        title={`Generate New ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} Recommendations?`}
        message="Your current options will be replaced with new recommendations. This cannot be undone."
        confirmText="Generate New Options"
        cancelText="Cancel"
        confirmVariant="primary"
        onConfirm={handleRerunConfirmed}
        onCancel={handleRerunCancel}
      />
    </>
  );
});

/**
 * Recommendation preview component - shows a compact preview of a recommendation
 */
function RecommendationPreview({ recommendation, agentType }: { recommendation: any; agentType: AgentType }) {
  // Render based on agent type
  switch (agentType) {
    case 'flight':
      return <FlightPreview flight={recommendation as Flight} />;
    case 'accommodation':
      return <HotelPreview hotel={recommendation as Stay} />;
    case 'activity':
    case 'transportation':
      return <ExperiencePreview experience={recommendation as Transit} />;
    case 'restaurant':
      return <RestaurantPreview restaurant={recommendation as Restaurant} />;
    default:
      return <GenericPreview item={recommendation} />;
  }
}

function FlightPreview({ flight }: { flight: Flight }) {
  return (
    <div className="p-3 bg-white/50 rounded-lg border border-gray-200 text-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-gray-900">{flight.carrier} {flight.flightNo}</p>
          <p className="text-xs text-gray-600">
            {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </p>
        </div>
        <p className="font-semibold text-gray-900">${flight.price.amount}</p>
      </div>
    </div>
  );
}

function HotelPreview({ hotel }: { hotel: Stay }) {
  return (
    <div className="p-3 bg-white/50 rounded-lg border border-gray-200 text-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{hotel.name}</p>
          {hotel.neighborhood && (
            <p className="text-xs text-gray-600">{hotel.neighborhood}</p>
          )}
          {hotel.rating && (
            <p className="text-xs text-gray-600">★ {hotel.rating.toFixed(1)}</p>
          )}
        </div>
        <p className="font-semibold text-gray-900">${hotel.total.amount}</p>
      </div>
    </div>
  );
}

function ExperiencePreview({ experience }: { experience: Transit }) {
  return (
    <div className="p-3 bg-white/50 rounded-lg border border-gray-200 text-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {experience.chain.join(' → ')}
          </p>
          <p className="text-xs text-gray-600">Duration: {experience.durationISO}</p>
        </div>
        {experience.fare && (
          <p className="font-semibold text-gray-900">${experience.fare.amount}</p>
        )}
      </div>
    </div>
  );
}

function RestaurantPreview({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="p-3 bg-white/50 rounded-lg border border-gray-200 text-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{restaurant.name}</p>
          {restaurant.cuisine && (
            <p className="text-xs text-gray-600">{restaurant.cuisine}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {restaurant.rating && (
              <p className="text-xs text-gray-600">★ {restaurant.rating.toFixed(1)}</p>
            )}
            {restaurant.priceLevel && (
              <p className="text-xs text-gray-600">
                {'$'.repeat(restaurant.priceLevel)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericPreview({ item }: { item: any }) {
  return (
    <div className="p-3 bg-white/50 rounded-lg border border-gray-200 text-sm">
      <p className="font-medium text-gray-900">{item.name || item.title || 'Recommendation'}</p>
      {item.description && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
      )}
    </div>
  );
}
