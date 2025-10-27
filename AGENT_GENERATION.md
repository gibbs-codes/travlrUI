# Agent Generation for Skipped Agents

This document explains how to generate recommendations for agents that were not included during initial trip creation.

## Overview

When creating a trip, users can choose which agents to run (flights, hotels, activities, restaurants). If an agent is skipped during creation, users can later generate recommendations for that agent from the trip status page.

## User Flow

1. User creates trip with only some agents selected (e.g., flights and hotels only)
2. On the trip status page, skipped agents show with status "skipped"
3. User clicks "Generate Now" button on a skipped agent card
4. Agent starts running and user sees real-time status updates
5. When complete, recommendations appear in the card

## Technical Implementation

### 1. API Service Method

**File**: `app/lib/api/tripService.ts`

```typescript
async startAgents(
  tripId: string,
  agents: string[]
): Promise<{ success: boolean; message: string }>
```

**Endpoint**: `POST /api/trip/:tripId/agents/start`

**Request Body**:
```json
{
  "agents": ["activity", "restaurant"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Started 2 agents successfully"
}
```

### 2. Toast Notifications

**File**: `app/lib/toast.ts`

Simple utility for showing user feedback:

```typescript
import { toast } from '../lib/toast';

// Show success
toast.success('Started generating activity recommendations!');

// Show error
toast.error('Agents are currently running, please wait');

// Show info
toast.info('Generating hotel recommendations...');

// Show warning
toast.warning('Please wait for current agents to complete');
```

**Toast Types**:
- `success` - Green, checkmark icon
- `error` - Red, X icon
- `info` - Blue, info icon
- `warning` - Orange, warning icon

**Features**:
- Auto-dismiss after 3 seconds (configurable)
- Slide-in animation from right
- Fixed position (top-right corner)
- Mobile responsive
- No dependencies required

### 3. TripAgentCard Component

**File**: `app/components/TripAgentCard.tsx`

The `handleGenerate` function:

```typescript
const handleGenerate = useCallback(async () => {
  try {
    // Show loading toast
    toast.info(`Generating ${agentName} recommendations...`);

    // Call API to start agent
    await tripService.startAgents(tripId, [agentType]);

    // Show success
    toast.success(`Started generating ${agentName} recommendations!`);

    // Refetch status to see agent starting
    await refetch();
  } catch (err: any) {
    // Handle errors with specific messages
    let errorMessage = 'Failed to start agent, please try again';

    if (err.status === 409) {
      errorMessage = 'Agents are currently running, please wait';
    } else if (err.status === 400) {
      errorMessage = 'Invalid agent request';
    }

    toast.error(errorMessage);
    setRecsError(errorMessage);
  }
}, [tripId, agentType, refetch]);
```

**Features**:
- Immediate user feedback with toast notifications
- Automatic status polling starts after API call
- Error handling with user-friendly messages
- No page reload required

### 4. Status Updates

After calling `startAgents`:

1. **Immediate**: Toast notification shows "Generating..."
2. **~100ms**: `refetch()` triggers new status poll
3. **~3s**: `useAgentStatus` hook detects agent is "running"
4. **Ongoing**: Hook polls every 3 seconds showing progress
5. **On complete**: Recommendations automatically fetch and display

## Error Handling

### HTTP Status Codes

| Code | Error | User Message |
|------|-------|--------------|
| 400 | Bad Request | "Invalid agent request" |
| 409 | Conflict | "Agents are currently running, please wait" |
| 500 | Server Error | "Failed to start agent, please try again" |
| Network | Connection | "Failed to start agent, please try again" |

### Error Display

Errors are shown in two places:
1. **Toast notification** - Temporary notification (3s)
2. **Agent card** - Persistent error message in card content

### Retry Behavior

Users can retry by clicking "Generate Now" again after an error.

## Code Example

### Complete Integration

```typescript
// In your component
import { TripAgentCard } from '../components/TripAgentCard';

function TripStatusPage({ tripId }: { tripId: string }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <TripAgentCard tripId={tripId} agentType="flight" />
      <TripAgentCard tripId={tripId} agentType="accommodation" />
      <TripAgentCard tripId={tripId} agentType="activity" />
      <TripAgentCard tripId={tripId} agentType="restaurant" />
    </div>
  );
}
```

The `TripAgentCard` automatically:
- Detects if agent is skipped
- Shows "Generate Now" button
- Handles generation with proper error handling
- Shows toast notifications
- Starts polling when agent begins running

### Manual Usage

If you need to call the API directly:

```typescript
import { tripService } from '../lib/api';
import { toast } from '../lib/toast';

async function generateAgents(tripId: string, agentTypes: string[]) {
  try {
    await tripService.startAgents(tripId, agentTypes);
    toast.success(`Started generating ${agentTypes.join(', ')} recommendations!`);
  } catch (err: any) {
    if (err.status === 409) {
      toast.error('Agents are currently running, please wait');
    } else {
      toast.error('Failed to start agents');
    }
  }
}
```

## Backend Requirements

Your backend must implement:

**Endpoint**: `POST /api/trip/:tripId/agents/start`

**Expected behavior**:
1. Validate tripId exists
2. Check if agents are currently running (return 409 if yes)
3. Validate agent names (return 400 if invalid)
4. Start requested agents
5. Return success response

**Response format**:
```typescript
{
  success: boolean;
  message: string;
}
```

## Testing

### Test Skipped Agent Flow

1. Create trip with only flights and hotels
2. Navigate to status page
3. Verify activity and restaurant cards show "skipped" status
4. Click "Generate Now" on activity card
5. Verify toast shows "Generating activity recommendations..."
6. Verify card status changes to "pending" or "running"
7. Wait for completion
8. Verify recommendations appear in card

### Test Error Cases

**409 Conflict**:
```typescript
// Simulate by starting agent while another is running
// Should show: "Agents are currently running, please wait"
```

**400 Bad Request**:
```typescript
// Simulate by passing invalid agent type
// Should show: "Invalid agent request"
```

**Network Error**:
```typescript
// Simulate by disconnecting network
// Should show: "Failed to start agent, please try again"
```

## Performance Considerations

1. **No polling overhead** - Only active when agent is running
2. **Independent cards** - Each agent polls separately
3. **Automatic cleanup** - Polling stops when agent completes
4. **Toast auto-dismiss** - Cleans up DOM after 3 seconds
5. **Optimized re-renders** - useCallback prevents unnecessary renders

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

Toast notifications use vanilla JavaScript and CSS, no framework dependencies.

## Related Files

- `app/lib/api/tripService.ts` - API service method
- `app/lib/toast.ts` - Toast notification utility
- `app/components/TripAgentCard.tsx` - Agent card with generation
- `app/hooks/useAgentStatus.ts` - Status polling hook
- `app/components/AgentCard.tsx` - Base agent card UI
