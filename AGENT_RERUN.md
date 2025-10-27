# Agent Re-run Functionality

This document explains how to re-run individual agents that have already completed to generate new recommendations.

## Overview

After an agent completes and shows recommendations, users can request new options by re-running that specific agent. This clears the current recommendations and generates a fresh set of options.

## User Flow

1. Agent completes and shows recommendations
2. User clicks "Get more options" button on agent card
3. **Confirmation dialog appears**: "Generate New {AgentType} Recommendations?"
4. User confirms or cancels
5. If confirmed:
   - Current recommendations cleared
   - Agent status changes to "running"
   - Real-time polling shows progress
   - New recommendations appear when complete

## Technical Implementation

### 1. Confirmation Dialog Component

**File**: `app/components/ConfirmDialog.tsx`

A reusable modal dialog for confirming destructive actions.

**Props**:
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;        // Default: "Confirm"
  cancelText?: string;         // Default: "Cancel"
  confirmVariant?: 'primary' | 'danger';  // Button styling
  onConfirm: () => void;
  onCancel: () => void;
}
```

**Features**:
- Modal overlay with backdrop blur
- Escape key to cancel
- Click outside to cancel
- Body scroll lock when open
- Smooth animations
- Keyboard accessible

**Usage**:
```typescript
import { ConfirmDialog } from './ConfirmDialog';

const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  isOpen={showConfirm}
  title="Generate New Flight Recommendations?"
  message="Your current options will be replaced with new recommendations. This cannot be undone."
  confirmText="Generate New Options"
  cancelText="Cancel"
  confirmVariant="primary"
  onConfirm={handleConfirm}
  onCancel={() => setShowConfirm(false)}
/>
```

### 2. Updated TripAgentCard Component

**File**: `app/components/TripAgentCard.tsx`

Enhanced with confirmation dialog and optimistic updates.

#### State Management

```typescript
const [showRerunConfirm, setShowRerunConfirm] = useState(false);
const [recommendations, setRecommendations] = useState<any[]>([]);
const [isLoadingRecs, setIsLoadingRecs] = useState(false);
const [recsError, setRecsError] = useState<string | null>(null);
```

#### Handler Functions

**1. Show Confirmation**:
```typescript
const handleRerunClick = useCallback(() => {
  setShowRerunConfirm(true);
}, []);
```

**2. Confirmed Rerun**:
```typescript
const handleRerunConfirmed = useCallback(async () => {
  setShowRerunConfirm(false);

  // Optimistic update - clear recommendations
  setRecommendations([]);
  setIsLoadingRecs(true);

  try {
    // Show loading toast
    toast.info(`Generating new ${agentName} recommendations...`);

    // Call API
    await service.rerunRecommendations(tripId, {
      reason: 'User requested new options',
    });

    // Success toast
    toast.success(`Started generating new ${agentName} recommendations!`);

    // Refetch status to start polling
    await refetch();

  } catch (err: any) {
    // Error handling with specific messages
    let errorMessage = 'Failed to rerun agent, please try again';

    if (err.status === 409) {
      errorMessage = 'Agents are currently running, please wait';
    }

    toast.error(errorMessage);

    // Restore recommendations on error
    if (status === 'completed') {
      fetchRecommendations();
    }
  } finally {
    setIsLoadingRecs(false);
  }
}, [tripId, agentType, refetch, status, fetchRecommendations]);
```

**3. Cancel Confirmation**:
```typescript
const handleRerunCancel = useCallback(() => {
  setShowRerunConfirm(false);
}, []);
```

### 3. API Service Method

**File**: Existing in `app/lib/api/recommendationService.ts`

```typescript
async rerunRecommendations(
  tripId: string,
  request?: RerunRequest
): Promise<{ success: boolean; message: string }>
```

**Endpoint**: `POST /api/trip/:tripId/recommendations/{agentType}/rerun`

**Request Body**:
```json
{
  "reason": "User requested new options"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Agent rerun started successfully"
}
```

### 4. Optimistic Updates

The component implements optimistic UI updates for better UX:

1. **Immediate**: Confirmation dialog closes
2. **Immediate**: Current recommendations cleared from UI
3. **Immediate**: Loading state shown in card
4. **Immediate**: Toast notification shows "Generating..."
5. **~100ms**: API call completes
6. **~100ms**: Success toast appears
7. **~200ms**: Status refetch triggers
8. **~3s**: Hook detects "running" status
9. **Ongoing**: Polling shows real-time updates
10. **On complete**: New recommendations automatically fetch

### 5. Error Recovery

If the rerun fails, the component:
1. Shows error toast with specific message
2. Displays error in card
3. **Restores previous recommendations** if still in completed state
4. Allows user to retry

This prevents loss of data on network errors.

## Confirmation Dialog Details

### Dialog Content

**Title**: "Generate New {AgentType} Recommendations?"
- Flight → "Generate New Flight Recommendations?"
- Accommodation → "Generate New Hotel Recommendations?"
- Activity → "Generate New Activity Recommendations?"
- Restaurant → "Generate New Restaurant Recommendations?"

**Message**: "Your current options will be replaced with new recommendations. This cannot be undone."

**Buttons**:
- Cancel (gray)
- Generate New Options (blue)

### User Interactions

| Action | Result |
|--------|--------|
| Click "Get more options" | Show confirmation dialog |
| Click "Cancel" | Close dialog, no changes |
| Click outside dialog | Close dialog, no changes |
| Press Escape | Close dialog, no changes |
| Click "Generate New Options" | Start rerun process |

## Error Handling

### HTTP Status Codes

| Code | Scenario | User Message |
|------|----------|--------------|
| 409 | Agents currently running | "Agents are currently running, please wait" |
| 400 | Invalid request | "Invalid agent request" |
| 500 | Server error | "Failed to rerun agent, please try again" |
| Network | Connection failure | "Failed to rerun agent, please try again" |

### Error Display

Errors shown in two places:
1. **Toast notification** - Temporary (3 seconds)
2. **Agent card error state** - Persistent until retry

### Recovery on Error

```typescript
// Restore recommendations on error
if (status === 'completed') {
  fetchRecommendations();
}
```

This ensures users don't lose their current recommendations if the rerun fails.

## State Transitions

```
completed (with recommendations)
    ↓ [User clicks "Get more options"]
confirmation dialog
    ↓ [User confirms]
loading (recommendations cleared)
    ↓ [API call success]
running (polling active)
    ↓ [Agent completes]
completed (new recommendations)
```

**Error path**:
```
loading (recommendations cleared)
    ↓ [API call fails]
error + restored recommendations
    ↓ [User can retry]
```

## Code Example

### Complete Integration

```typescript
import { TripAgentCard } from '../components/TripAgentCard';

function TripStatusPage({ tripId }: { tripId: string }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Each card automatically handles rerun with confirmation */}
      <TripAgentCard tripId={tripId} agentType="flight" />
      <TripAgentCard tripId={tripId} agentType="accommodation" />
      <TripAgentCard tripId={tripId} agentType="activity" />
      <TripAgentCard tripId={tripId} agentType="restaurant" />
    </div>
  );
}
```

All rerun functionality is built into `TripAgentCard`. No additional setup needed.

### Manual Usage

If you need to call the rerun API directly:

```typescript
import { flightService } from '../lib/api';
import { toast } from '../lib/toast';

async function rerunFlights(tripId: string) {
  try {
    await flightService.rerunRecommendations(tripId, {
      reason: 'User requested new options',
    });
    toast.success('Started generating new flight recommendations!');
  } catch (err: any) {
    if (err.status === 409) {
      toast.error('Agents are currently running, please wait');
    } else {
      toast.error('Failed to rerun agent');
    }
  }
}
```

## Backend Requirements

Your backend must implement:

**Endpoint**: `POST /api/trip/:tripId/recommendations/{agentType}/rerun`

Where `{agentType}` is one of:
- `flight`
- `accommodation`
- `activity`
- `restaurant`

**Expected Behavior**:
1. Validate tripId exists
2. Validate agent type is valid
3. Check if agents are currently running (return 409 if yes)
4. Clear current recommendations for that agent
5. Queue agent for re-run
6. Return success response

**Response Format**:
```typescript
{
  success: boolean;
  message: string;
}
```

## Testing Checklist

### Happy Path
- ✅ Click "Get more options" on completed agent
- ✅ Verify confirmation dialog appears
- ✅ Click "Generate New Options"
- ✅ Verify dialog closes
- ✅ Verify recommendations disappear
- ✅ Verify loading state shows
- ✅ Verify toast shows "Generating..."
- ✅ Verify success toast appears
- ✅ Verify agent status changes to "running"
- ✅ Wait for completion
- ✅ Verify new recommendations appear

### Dialog Interactions
- ✅ Click "Cancel" closes dialog
- ✅ Click outside dialog closes it
- ✅ Press Escape closes dialog
- ✅ No changes made when dialog cancelled

### Error Cases
- ✅ Test 409 error (agents running)
- ✅ Verify error message in toast
- ✅ Verify error message in card
- ✅ Verify previous recommendations restored
- ✅ Test network error
- ✅ Verify can retry after error

### Multiple Agents
- ✅ Rerun one agent doesn't affect others
- ✅ Can rerun multiple agents sequentially
- ✅ Cannot rerun while another is running (409)

## Performance Considerations

1. **Optimistic Updates** - UI responds immediately
2. **Error Recovery** - Recommendations restored on failure
3. **Independent Agents** - Each agent operates independently
4. **Automatic Polling** - No manual refresh needed
5. **Clean Transitions** - Smooth state changes

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

Dialog uses standard CSS and React - no special polyfills needed.

## Related Documentation

- [AGENT_GENERATION.md](AGENT_GENERATION.md) - Generating skipped agents
- [useAgentStatus.README.md](app/hooks/useAgentStatus.README.md) - Status polling hook

## Related Files

- `app/components/ConfirmDialog.tsx` - Confirmation dialog
- `app/components/TripAgentCard.tsx` - Agent card with rerun
- `app/lib/api/recommendationService.ts` - API service
- `app/lib/toast.ts` - Toast notifications
- `app/hooks/useAgentStatus.ts` - Status polling
