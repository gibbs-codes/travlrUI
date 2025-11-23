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
import { FlightCard } from './recommendations/FlightCard';
import { HotelCard } from './recommendations/HotelCard';
import { RestaurantCard } from './recommendations/RestaurantCard';
import { ExperienceCard } from './recommendations/ExperienceCard';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      console.log(`[TripAgentCard] ${agentType} just completed, fetching recommendations`);
      fetchRecommendations();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    setPrevStatus(status);
  }, [status, prevStatus, fetchRecommendations, agentType]);

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

  // Handle recommendation selection
  const handleSelectRecommendation = useCallback(async (recommendationId: string) => {
    console.log(`[TripAgentCard] Selecting ${agentType} recommendation:`, recommendationId);

    // Optimistically update UI
    setSelectedIds(prev => new Set(prev).add(recommendationId));

    try {
      const service = SERVICES[agentType];
      if (!service) {
        throw new Error('Service not available');
      }

      // Call the select API
      await service.selectRecommendation(tripId, recommendationId);

      // Show success toast
      const agentNames: Record<AgentType, string> = {
        flight: 'Flight',
        accommodation: 'Hotel',
        activity: 'Activity',
        restaurant: 'Restaurant',
        transportation: 'Transportation',
      };
      toast.success(`${agentNames[agentType]} selected!`);
    } catch (err: any) {
      console.error(`[TripAgentCard] Error selecting ${agentType}:`, err);

      // Revert optimistic update
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });

      // Show error toast
      const errorMessage = err?.message || 'Failed to select recommendation';
      toast.error(errorMessage);
    }
  }, [tripId, agentType]);

  // Handle generate - start a skipped or idle agent
  const handleGenerate = useCallback(async () => {
    console.log(`[TripAgentCard] Generating ${agentType} recommendations (was idle)`);
    setRecsError(null);

    const agentNames: Record<AgentType, string> = {
      flight: 'flight',
      accommodation: 'hotel',
      activity: 'activity',
      restaurant: 'restaurant',
      transportation: 'transportation',
    };

    const agentName = agentNames[agentType];

    try {
      toast.info(`Generating ${agentName} recommendations...`);

      // Call API to start this specific agent
      await tripService.startAgents(tripId, [agentType]);

      toast.success(`Started generating ${agentName} recommendations!`);

      // Immediately refetch to get updated status (should be 'running')
      await refetch();

    } catch (err: any) {
      let errorMessage = 'Failed to start agent, please try again';

      if (err.status === 409) {
        errorMessage = 'Agent is already running, please wait';
      } else if (err.status === 400) {
        errorMessage = 'Invalid agent request';
      }

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
        onGenerate={status === 'skipped' || status === 'idle' ? handleGenerate : undefined}
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
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} found
              </p>

              {/* Render recommendation cards (limit to first 5) */}
              {recommendations.slice(0, 5).map((rec, index) => (
                <RecommendationCard
                  key={rec.id || index}
                  recommendation={rec}
                  agentType={agentType}
                  isSelected={selectedIds.has(rec.id)}
                  onSelect={handleSelectRecommendation}
                  onRerun={handleRerunClick}
                />
              ))}

              {recommendations.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  + {recommendations.length - 5} more options available
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
 * Recommendation card component - renders the appropriate card type based on agent type
 */
interface RecommendationCardProps {
  recommendation: any;
  agentType: AgentType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRerun?: () => void;
}

function RecommendationCard({
  recommendation,
  agentType,
  isSelected,
  onSelect,
  onRerun,
}: RecommendationCardProps) {
  // Render based on agent type
  switch (agentType) {
    case 'flight':
      return (
        <FlightCard
          flight={recommendation as Flight}
          isSelected={isSelected}
          onSelect={onSelect}
          onRerun={onRerun}
        />
      );
    case 'accommodation':
      return (
        <HotelCard
          stay={recommendation as Stay}
          isSelected={isSelected}
          onSelect={onSelect}
          onRerun={onRerun}
        />
      );
    case 'activity':
    case 'transportation':
      return (
        <ExperienceCard
          transit={recommendation as Transit}
          isSelected={isSelected}
          onSelect={onSelect}
          onRerun={onRerun}
        />
      );
    case 'restaurant':
      return (
        <RestaurantCard
          restaurant={recommendation as Restaurant}
          isSelected={isSelected}
          onSelect={onSelect}
          onRerun={onRerun}
        />
      );
    default:
      return null;
  }
}
