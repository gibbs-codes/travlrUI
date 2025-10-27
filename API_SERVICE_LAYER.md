# API Service Layer Documentation

Complete guide to the modular API service layer for the Travlr application.

## Overview

The API service layer provides a clean, type-safe interface for interacting with the backend. It uses a modular architecture with specialized services for each resource type.

## Architecture

```
app/lib/api/
├── index.ts                    # Main export file
├── baseService.ts             # Base HTTP client
├── helpers.ts                 # Utility functions ⭐ NEW
├── tripService.ts             # Trip CRUD operations
├── recommendationService.ts   # Base recommendation logic
├── flightService.ts          # Flight recommendations
├── hotelService.ts           # Hotel recommendations
├── experienceService.ts      # Activity recommendations
└── restaurantService.ts      # Restaurant recommendations
```

## Services

### TripService

Handles trip creation, status, and management.

**Methods**:

```typescript
// Create a new trip
createTrip(data: TripRequest): Promise<TripResponse>

// Get trip status (for polling)
getTripStatus(tripId: string): Promise<TripStatusResponse>

// Get full trip details
getTripDetails(tripId: string): Promise<TripResponse>

// Submit selected recommendations
selectRecommendations(tripId: string, selections: SelectionRequest): Promise<SelectionResponse>

// Get trip summary
getTripSummary(tripId: string): Promise<TripResponse>

// Delete a trip
deleteTrip(tripId: string): Promise<{ message: string }>

// Start agents for skipped agents ⭐
startAgents(tripId: string, agents: string[]): Promise<{ success: boolean; message: string }>
```

**Example**:
```typescript
import { tripService } from '@/lib/api';

// Create trip with specific agents
const trip = await tripService.createTrip({
  destination: 'Paris',
  origin: 'New York',
  departureDate: '2025-06-01',
  returnDate: '2025-06-07',
  travelers: { count: 2, adults: 2, children: 0, infants: 0 },
  preferences: { /* ... */ },
  collaboration: { createdBy: 'user123' },
});

// Start skipped agents later
await tripService.startAgents(trip.tripId, ['activity', 'restaurant']);
```

### Recommendation Services

All recommendation services extend `RecommendationService<T>` and share the same interface.

**Services**:
- `flightService` - Flight recommendations
- `hotelService` - Hotel recommendations
- `experienceService` - Activity/transit recommendations
- `restaurantService` - Restaurant recommendations

**Shared Methods**:

```typescript
// Get recommendations for this type
getRecommendations(tripId: string): Promise<RecommendationResponse<T>>

// Rerun recommendations (generate new options) ⭐
rerunRecommendations(tripId: string, request?: RerunRequest): Promise<{ success: boolean; message: string }>

// Select a specific recommendation
selectRecommendation(tripId: string, recommendationId: string, selectedBy?: string): Promise<{ success: boolean; selection: T }>

// Get recommendation by ID
getRecommendationById(tripId: string, recommendationId: string): Promise<T>
```

**Endpoints**:

| Service | Resource Path | Endpoint |
|---------|--------------|----------|
| flightService | `flight` | `/api/trip/:tripId/flight` |
| hotelService | `accommodation` | `/api/trip/:tripId/accommodation` |
| experienceService | `activity` | `/api/trip/:tripId/activity` |
| restaurantService | `restaurant` | `/api/trip/:tripId/restaurant` |

**Example**:
```typescript
import { flightService, hotelService } from '@/lib/api';

// Get flight recommendations
const flights = await flightService.getRecommendations('trip123');
console.log(`Found ${flights.count} flights`);

// Rerun to get new options
await flightService.rerunRecommendations('trip123', {
  reason: 'User requested new options',
});

// Get hotel recommendations with filters
const hotels = await hotelService.getRecommendations('trip123');
```

## Helper Functions ⭐ NEW

The `helpers.ts` module provides utility functions for working with agent types and endpoints.

### Agent Type Mapping

**agentTypeToEndpoint**
```typescript
agentTypeToEndpoint(agentType: AgentType): string

// Examples:
agentTypeToEndpoint('flight')         // Returns 'flight'
agentTypeToEndpoint('accommodation')  // Returns 'accommodation'
agentTypeToEndpoint('activity')       // Returns 'activity'
agentTypeToEndpoint('restaurant')     // Returns 'restaurant'
```

**agentTypeToPluralEndpoint** (legacy support)
```typescript
agentTypeToPluralEndpoint(agentType: AgentType): string

// Examples:
agentTypeToPluralEndpoint('flight')        // Returns 'flights'
agentTypeToPluralEndpoint('accommodation') // Returns 'hotels'
agentTypeToPluralEndpoint('activity')      // Returns 'experiences'
agentTypeToPluralEndpoint('restaurant')    // Returns 'restaurants'
```

**endpointToAgentType** (reverse mapping)
```typescript
endpointToAgentType(endpoint: string): AgentType | null

// Examples:
endpointToAgentType('flight')      // Returns 'flight'
endpointToAgentType('hotels')      // Returns 'accommodation'
endpointToAgentType('experiences') // Returns 'activity'
```

### Display Names

**getAgentDisplayName**
```typescript
getAgentDisplayName(agentType: AgentType): string

// Examples:
getAgentDisplayName('flight')        // Returns 'Flight'
getAgentDisplayName('accommodation') // Returns 'Hotel'
```

**getAgentPluralName**
```typescript
getAgentPluralName(agentType: AgentType): string

// Examples:
getAgentPluralName('flight')        // Returns 'Flights'
getAgentPluralName('accommodation') // Returns 'Hotels'
```

### Validation

**isValidAgentType**
```typescript
isValidAgentType(value: string): value is AgentType

// Examples:
isValidAgentType('flight')   // Returns true
isValidAgentType('invalid')  // Returns false
```

### Path Builders

**buildRecommendationPath**
```typescript
buildRecommendationPath(tripId: string, agentType: AgentType): string

// Example:
buildRecommendationPath('123', 'flight')
// Returns '/api/trip/123/flight'
```

**buildRerunPath**
```typescript
buildRerunPath(tripId: string, agentType: AgentType): string

// Example:
buildRerunPath('123', 'flight')
// Returns '/api/trip/123/flight/rerun'
```

**buildAgentStartPath**
```typescript
buildAgentStartPath(tripId: string): string

// Example:
buildAgentStartPath('123')
// Returns '/api/trip/123/agents/start'
```

**buildStatusPath**
```typescript
buildStatusPath(tripId: string): string

// Example:
buildStatusPath('123')
// Returns '/api/trip/123/status'
```

**buildQueryString**
```typescript
buildQueryString(filters?: Record<string, any>): string

// Example:
buildQueryString({ maxPrice: 500, stops: 0 })
// Returns '?maxPrice=500&stops=0'
```

### Type Guards

**hasRecommendations**
```typescript
hasRecommendations<T>(response: any): response is { recommendations: T[]; count: number }

// Example:
const response = await fetch('/api/...');
if (hasRecommendations(response)) {
  console.log(`Found ${response.count} items`);
}
```

**isSuccessResponse**
```typescript
isSuccessResponse(response: any): response is { success: boolean; message: string }

// Example:
const response = await tripService.startAgents(tripId, ['flight']);
if (isSuccessResponse(response) && response.success) {
  console.log(response.message);
}
```

## Usage Examples

### Getting Recommendations

```typescript
import { flightService, hotelService } from '@/lib/api';

async function loadRecommendations(tripId: string) {
  try {
    // Get flights
    const flights = await flightService.getRecommendations(tripId);
    console.log(`Found ${flights.count} flights`);

    // Get hotels
    const hotels = await hotelService.getRecommendations(tripId);
    console.log(`Found ${hotels.count} hotels`);

    return { flights, hotels };
  } catch (error) {
    console.error('Failed to load recommendations:', error);
    throw error;
  }
}
```

### Rerunning Agents

```typescript
import { flightService } from '@/lib/api';
import { toast } from '@/lib/toast';

async function rerunFlights(tripId: string) {
  try {
    toast.info('Generating new flight recommendations...');

    await flightService.rerunRecommendations(tripId, {
      reason: 'User requested new options',
    });

    toast.success('Started generating new flights!');
  } catch (error) {
    toast.error('Failed to rerun flights');
    throw error;
  }
}
```

### Starting Skipped Agents

```typescript
import { tripService } from '@/lib/api';
import { toast } from '@/lib/toast';

async function generateSkippedAgents(tripId: string, agentTypes: string[]) {
  try {
    const response = await tripService.startAgents(tripId, agentTypes);

    if (response.success) {
      toast.success(response.message);
    } else {
      toast.error('Failed to start agents');
    }
  } catch (error: any) {
    if (error.status === 409) {
      toast.error('Agents are currently running, please wait');
    } else {
      toast.error('Failed to start agents');
    }
  }
}
```

### Using Helper Functions

```typescript
import {
  agentTypeToEndpoint,
  getAgentDisplayName,
  buildRecommendationPath,
  isValidAgentType,
} from '@/lib/api';

function AgentComponent({ tripId, agentType }: Props) {
  // Validate agent type
  if (!isValidAgentType(agentType)) {
    return <div>Invalid agent type</div>;
  }

  // Get display name
  const displayName = getAgentDisplayName(agentType);

  // Build API path
  const apiPath = buildRecommendationPath(tripId, agentType);

  // Get endpoint
  const endpoint = agentTypeToEndpoint(agentType);

  return (
    <div>
      <h2>{displayName} Recommendations</h2>
      <p>API: {apiPath}</p>
      <p>Endpoint: {endpoint}</p>
    </div>
  );
}
```

### Dynamic Service Selection

```typescript
import { api } from '@/lib/api';
import type { AgentType } from '@/lib/types';

async function getRecommendationsForAgent(
  tripId: string,
  agentType: AgentType
) {
  const serviceMap = {
    flight: api.flight,
    accommodation: api.hotel,
    activity: api.experience,
    restaurant: api.restaurant,
    transportation: api.experience,
  };

  const service = serviceMap[agentType];
  return service.getRecommendations(tripId);
}
```

## Error Handling

All service methods throw errors that should be caught and handled:

```typescript
import { flightService } from '@/lib/api';
import { toast } from '@/lib/toast';

async function loadFlights(tripId: string) {
  try {
    const flights = await flightService.getRecommendations(tripId);
    return flights;
  } catch (error: any) {
    // Handle specific HTTP status codes
    if (error.status === 404) {
      toast.error('Trip not found');
    } else if (error.status === 409) {
      toast.error('Agents are currently running');
    } else if (error.status === 500) {
      toast.error('Server error, please try again');
    } else {
      toast.error('Failed to load flights');
    }

    throw error;
  }
}
```

## TypeScript Types

All services are fully typed:

```typescript
import type {
  TripRequest,
  TripResponse,
  TripStatusResponse,
  SelectionRequest,
  SelectionResponse,
  Flight,
  Stay,
  Transit,
  Restaurant,
  AgentType,
  AgentStatus,
} from '@/lib/types';

import type {
  RecommendationResponse,
  RerunRequest,
  SelectionRequest,
} from '@/lib/api';
```

## API Endpoints Reference

| Method | Endpoint | Service Method |
|--------|----------|----------------|
| **Trip Operations** |
| POST | `/api/trip/create` | `tripService.createTrip()` |
| GET | `/api/trip/:tripId` | `tripService.getTripDetails()` |
| GET | `/api/trip/:tripId/status` | `tripService.getTripStatus()` |
| PUT | `/api/trip/:tripId/select` | `tripService.selectRecommendations()` |
| DELETE | `/api/trip/:tripId` | `tripService.deleteTrip()` |
| POST | `/api/trip/:tripId/agents/start` | `tripService.startAgents()` ⭐ |
| **Flight Recommendations** |
| GET | `/api/trip/:tripId/flight` | `flightService.getRecommendations()` |
| POST | `/api/trip/:tripId/flight/rerun` | `flightService.rerunRecommendations()` ⭐ |
| POST | `/api/trip/:tripId/flight/select` | `flightService.selectRecommendation()` |
| **Hotel Recommendations** |
| GET | `/api/trip/:tripId/accommodation` | `hotelService.getRecommendations()` |
| POST | `/api/trip/:tripId/accommodation/rerun` | `hotelService.rerunRecommendations()` ⭐ |
| POST | `/api/trip/:tripId/accommodation/select` | `hotelService.selectRecommendation()` |
| **Activity Recommendations** |
| GET | `/api/trip/:tripId/activity` | `experienceService.getRecommendations()` |
| POST | `/api/trip/:tripId/activity/rerun` | `experienceService.rerunRecommendations()` ⭐ |
| POST | `/api/trip/:tripId/activity/select` | `experienceService.selectRecommendation()` |
| **Restaurant Recommendations** |
| GET | `/api/trip/:tripId/restaurant` | `restaurantService.getRecommendations()` |
| POST | `/api/trip/:tripId/restaurant/rerun` | `restaurantService.rerunRecommendations()` ⭐ |
| POST | `/api/trip/:tripId/restaurant/select` | `restaurantService.selectRecommendation()` |

⭐ = New or updated endpoint

## Best Practices

1. **Always use services, never fetch directly**:
   ```typescript
   // ❌ Don't do this
   const response = await fetch(`/api/trip/${tripId}/flight`);

   // ✅ Do this
   const flights = await flightService.getRecommendations(tripId);
   ```

2. **Use helper functions for consistency**:
   ```typescript
   // ❌ Don't hardcode mappings
   const endpoint = agentType === 'flight' ? 'flights' : 'hotels';

   // ✅ Use helpers
   const endpoint = agentTypeToPluralEndpoint(agentType);
   ```

3. **Handle errors appropriately**:
   ```typescript
   try {
     await service.method();
   } catch (error: any) {
     // Handle specific status codes
     // Show user-friendly messages
   }
   ```

4. **Use type guards for safety**:
   ```typescript
   if (isValidAgentType(userInput)) {
     // Safe to use as AgentType
   }
   ```

## Related Files

- `app/lib/api/index.ts` - Main exports
- `app/lib/api/helpers.ts` - Utility functions
- `app/lib/api/tripService.ts` - Trip service
- `app/lib/api/recommendationService.ts` - Base recommendation service
- `app/lib/types.ts` - Type definitions
