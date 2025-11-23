import { useState, useEffect, useRef, useCallback } from 'react';
import { tripService } from '../lib/api';
import type { AgentType, AgentState } from '../lib/types';

/**
 * Extended agent state to include 'skipped' for agents not requested
 */
export type ExtendedAgentState = AgentState | 'skipped';

interface UseAgentStatusReturn {
  status: ExtendedAgentState | null;
  recommendationCount: number;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for polling individual agent status
 *
 * @param tripId - The trip ID to poll status for
 * @param agentType - The specific agent type to track
 * @param pollingInterval - Polling interval in milliseconds (default: 3000)
 * @returns Agent status, recommendation count, error state, and refetch function
 *
 * @example
 * const { status, recommendationCount, error, refetch } = useAgentStatus(tripId, 'flight');
 */
export function useAgentStatus(
  tripId: string,
  agentType: AgentType,
  pollingInterval: number = 3000
): UseAgentStatusReturn {
  const [status, setStatus] = useState<ExtendedAgentState | null>(null);
  const [recommendationCount, setRecommendationCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Check if polling should stop based on current status
  const shouldStopPolling = (currentStatus: ExtendedAgentState | null): boolean => {
    if (!currentStatus) return false;
    return currentStatus === 'completed' || currentStatus === 'failed' || currentStatus === 'skipped' || currentStatus === 'idle';
  };

  // Fetch agent status
  const fetchAgentStatus = useCallback(async () => {
    if (!tripId || !agentType) {
      console.warn('[useAgentStatus] Missing tripId or agentType');
      return;
    }

    try {
      console.log(`[useAgentStatus] Polling status for ${agentType} agent on trip ${tripId}`);

      const response = await tripService.getTripStatus(tripId);

      if (!isMountedRef.current) {
        console.log('[useAgentStatus] Component unmounted, ignoring response');
        return;
      }

      // Find the specific agent in the response
      const agent = response.agents?.find((a) => a.type === agentType);

      if (!agent) {
        // Agent not found - it might have been skipped/not requested
        console.log(`[useAgentStatus] Agent ${agentType} not found in response - marking as skipped`);
        setStatus('skipped');
        setRecommendationCount(0);
        setError(null);
        setIsLoading(false);
        return;
      }

      console.log(`[useAgentStatus] Agent ${agentType} status:`, {
        state: agent.state,
        progress: agent.progress,
        message: agent.message,
      });

      // Update state
      setStatus(agent.state);
      setError(agent.error || null);
      setIsLoading(false);

      // Get recommendation count from trip data if available
      // The recommendation count is in the trip's recommendations object
      if (response.trip?.recommendations) {
        const recommendations = response.trip.recommendations[agentType];
        const count = Array.isArray(recommendations) ? recommendations.length : 0;
        setRecommendationCount(count);
        console.log(`[useAgentStatus] Found ${count} ${agentType} recommendations`);
      }

      // Stop polling if agent reached terminal state
      if (shouldStopPolling(agent.state)) {
        console.log(`[useAgentStatus] Agent ${agentType} reached terminal state: ${agent.state}`);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agent status';
      console.error(`[useAgentStatus] Error fetching status for ${agentType}:`, err);

      setError(errorMessage);
      setIsLoading(false);

      // Stop polling on error
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [tripId, agentType]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    console.log(`[useAgentStatus] Manual refetch triggered for ${agentType}`);
    setIsLoading(true);
    setError(null);
    await fetchAgentStatus();
  }, [fetchAgentStatus, agentType]);

  // Start polling on mount and manage polling based on status
  useEffect(() => {
    console.log(`[useAgentStatus] Hook mounted for ${agentType} on trip ${tripId}`);
    isMountedRef.current = true;

    // Initial fetch
    fetchAgentStatus();

    // Only start polling interval if status is 'running'
    if (status === 'running') {
      console.log(`[useAgentStatus] Starting polling for ${agentType} (status: ${status})`);
      intervalRef.current = setInterval(() => {
        fetchAgentStatus();
      }, pollingInterval);
    } else {
      // Clear any existing interval if status is not running
      if (intervalRef.current) {
        console.log(`[useAgentStatus] Stopping polling for ${agentType} (status: ${status})`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      console.log(`[useAgentStatus] Hook unmounting for ${agentType}, cleaning up interval`);
      isMountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tripId, agentType, pollingInterval, fetchAgentStatus, status]);

  return {
    status,
    recommendationCount,
    error,
    isLoading,
    refetch,
  };
}
