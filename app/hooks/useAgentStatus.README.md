# useAgentStatus Hook

A React hook for polling individual agent status during trip planning.

## Features

- ✅ Automatic polling every 3 seconds (configurable)
- ✅ Smart polling that stops when agent reaches terminal state
- ✅ Proper cleanup on component unmount
- ✅ Error handling with graceful degradation
- ✅ Manual refetch capability
- ✅ TypeScript support with full type safety
- ✅ Debug logging for development
- ✅ Support for "skipped" agents (not requested)

## Usage

### Basic Example

```typescript
import { useAgentStatus } from '../hooks/useAgentStatus';

function FlightStatus({ tripId }: { tripId: string }) {
  const { status, recommendationCount, error, isLoading, refetch } = useAgentStatus(
    tripId,
    'flight'
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Status: {status}</p>
      <p>Recommendations: {recommendationCount}</p>
      {status === 'completed' && (
        <button onClick={refetch}>Get More</button>
      )}
    </div>
  );
}
```

### With AgentCard Component

```typescript
import { useAgentStatus } from '../hooks/useAgentStatus';
import { AgentCard } from '../components/AgentCard';

function AgentStatusCard({ tripId, agentType }) {
  const { status, recommendationCount, error, refetch } = useAgentStatus(
    tripId,
    agentType
  );

  return (
    <AgentCard
      agentType={agentType}
      tripId={tripId}
      status={status || 'pending'}
      recommendationCount={recommendationCount}
      onRerun={status === 'completed' ? refetch : undefined}
      onGenerate={status === 'skipped' ? refetch : undefined}
    >
      {/* Your recommendation content here */}
    </AgentCard>
  );
}
```

### Multiple Agents

```typescript
function TripStatus({ tripId }: { tripId: string }) {
  const flightStatus = useAgentStatus(tripId, 'flight');
  const hotelStatus = useAgentStatus(tripId, 'accommodation');
  const activityStatus = useAgentStatus(tripId, 'activity');
  const restaurantStatus = useAgentStatus(tripId, 'restaurant');

  return (
    <div className="grid grid-cols-2 gap-4">
      <AgentCard {...flightStatus} agentType="flight" tripId={tripId} />
      <AgentCard {...hotelStatus} agentType="accommodation" tripId={tripId} />
      <AgentCard {...activityStatus} agentType="activity" tripId={tripId} />
      <AgentCard {...restaurantStatus} agentType="restaurant" tripId={tripId} />
    </div>
  );
}
```

### Custom Polling Interval

```typescript
// Poll every 5 seconds instead of default 3 seconds
const { status } = useAgentStatus(tripId, 'flight', 5000);
```

## API Reference

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tripId` | `string` | Yes | - | The trip ID to monitor |
| `agentType` | `AgentType` | Yes | - | Agent type: 'flight', 'accommodation', 'activity', 'restaurant', or 'transportation' |
| `pollingInterval` | `number` | No | 3000 | Polling interval in milliseconds |

### Return Value

```typescript
{
  status: ExtendedAgentState | null;      // Current agent status
  recommendationCount: number;             // Number of recommendations found
  error: string | null;                    // Error message if any
  isLoading: boolean;                      // Initial loading state
  refetch: () => Promise<void>;           // Manual refetch function
}
```

### Status Values

- `pending` - Agent waiting to start
- `running` - Agent currently processing
- `completed` - Agent finished successfully
- `failed` - Agent encountered an error
- `skipped` - Agent was not requested for this trip

## Polling Behavior

### When Polling Starts
- Immediately on component mount
- After calling `refetch()`

### When Polling Stops
- Agent reaches `completed` state
- Agent reaches `failed` state
- Agent is marked as `skipped`
- Component unmounts
- Error occurs during fetch

## Error Handling

The hook handles errors gracefully:

```typescript
const { status, error, refetch } = useAgentStatus(tripId, 'flight');

if (error) {
  return (
    <div>
      <p>Failed to load: {error}</p>
      <button onClick={refetch}>Retry</button>
    </div>
  );
}
```

## Debug Logging

The hook includes comprehensive debug logging:

```
[useAgentStatus] Hook mounted for flight on trip 123
[useAgentStatus] Polling status for flight agent on trip 123
[useAgentStatus] Agent flight status: { state: 'running', progress: 50 }
[useAgentStatus] Found 5 flight recommendations
[useAgentStatus] Agent flight reached terminal state: completed
[useAgentStatus] Hook unmounting for flight, cleaning up interval
```

To disable logging in production, you can wrap console.log calls with environment checks.

## TypeScript Types

```typescript
import type { AgentType, AgentState } from '../lib/types';

// Extended state includes 'skipped'
export type ExtendedAgentState = AgentState | 'skipped';

interface UseAgentStatusReturn {
  status: ExtendedAgentState | null;
  recommendationCount: number;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}
```

## Performance Considerations

1. **Polling Interval**: Default 3 seconds balances responsiveness with API load
2. **Automatic Cleanup**: Intervals are properly cleared on unmount
3. **Smart Polling**: Stops automatically when agent reaches terminal state
4. **Multiple Hooks**: Each agent type can be monitored independently

## Common Patterns

### Conditional Rendering Based on Status

```typescript
const { status, recommendationCount } = useAgentStatus(tripId, 'flight');

switch (status) {
  case 'pending':
    return <LoadingSpinner message="Waiting to start..." />;
  case 'running':
    return <LoadingSpinner message="Finding flights..." />;
  case 'completed':
    return <Recommendations count={recommendationCount} />;
  case 'failed':
    return <ErrorMessage />;
  case 'skipped':
    return <EmptyState message="Flights not requested" />;
  default:
    return null;
}
```

### Retry on Failure

```typescript
const { status, error, refetch } = useAgentStatus(tripId, 'flight');

if (status === 'failed') {
  return (
    <div>
      <p>Error: {error}</p>
      <button onClick={refetch}>Retry</button>
    </div>
  );
}
```

### Generate Skipped Agent

```typescript
const { status, refetch } = useAgentStatus(tripId, 'activity');

if (status === 'skipped') {
  return (
    <div>
      <p>Activities were not included in your trip</p>
      <button onClick={refetch}>Generate Activities</button>
    </div>
  );
}
```

## Related Components

- `AgentCard` - UI component for displaying agent status
- `AgentStatusExample` - Example integration component
- `tripService.getTripStatus()` - Underlying API call

## Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAgentStatus } from './useAgentStatus';

test('polls agent status', async () => {
  const { result } = renderHook(() => useAgentStatus('trip-123', 'flight'));

  await waitFor(() => {
    expect(result.current.status).toBe('running');
  });

  await waitFor(() => {
    expect(result.current.status).toBe('completed');
  });
});
```
