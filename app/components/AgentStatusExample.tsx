/**
 * Example component demonstrating useAgentStatus hook usage with AgentCard
 *
 * This file shows how to integrate the useAgentStatus hook with the AgentCard component
 * to display real-time agent status updates.
 *
 * @example
 * // Usage in a trip status page
 * <AgentStatusExample tripId="123" agentType="flight" />
 */

'use client';

import { useAgentStatus } from '../hooks/useAgentStatus';
import { AgentCard } from './AgentCard';
import type { AgentType } from '../lib/types';

interface AgentStatusExampleProps {
  tripId: string;
  agentType: AgentType;
}

export function AgentStatusExample({ tripId, agentType }: AgentStatusExampleProps) {
  const { status, recommendationCount, error, refetch } = useAgentStatus(tripId, agentType);

  // Map extended agent state to AgentCard status
  // AgentCard expects: "pending" | "running" | "completed" | "failed" | "skipped"
  const cardStatus = status || 'pending';

  return (
    <AgentCard
      agentType={agentType}
      tripId={tripId}
      status={cardStatus}
      recommendationCount={recommendationCount}
      onRerun={status === 'completed' ? refetch : undefined}
      onGenerate={status === 'skipped' ? refetch : undefined}
    >
      {/* Render recommendations here when status is completed */}
      {status === 'completed' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Found {recommendationCount} recommendations
          </p>
          {/* Add actual recommendation cards here */}
        </div>
      )}

      {/* Show error details if needed */}
      {error && (
        <div className="text-sm text-red-600">
          <p>Error: {error}</p>
        </div>
      )}
    </AgentCard>
  );
}

/**
 * Example: Using multiple agent cards together
 */
export function TripAgentStatusGrid({ tripId }: { tripId: string }) {
  const agents: AgentType[] = ['flight', 'accommodation', 'activity', 'restaurant'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {agents.map((agentType) => (
        <AgentStatusExample key={agentType} tripId={tripId} agentType={agentType} />
      ))}
    </div>
  );
}
