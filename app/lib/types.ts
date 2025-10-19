// ============================================================================
// Trip Request & Response Types
// ============================================================================

export interface TravelerDetails {
  count: number;
  adults: number;
  children: number;
  infants: number;
}

export interface BudgetBreakdown {
  flight: number;
  accommodation: number;
  food: number;
  activities: number;
  [key: string]: number;
}

export interface BudgetPreferences {
  total: number;
  currency: string;
  breakdown: BudgetBreakdown;
}

export interface AccommodationPreferences {
  type: string;
  minRating: number;
}

export interface TransportationPreferences {
  flightClass: string;
  preferNonStop: boolean;
}

export interface DiningPreferences {
  priceRange: string;
}

export interface TripPreferences {
  interests: string[];
  budget: BudgetPreferences;
  accommodation: AccommodationPreferences;
  transportation: TransportationPreferences;
  dining: DiningPreferences;
}

export interface CollaborationDetails {
  createdBy: string;
  [key: string]: any;
}

export interface TripRequest {
  title: string;
  destination: string;
  origin: string;
  departureDate: string;
  returnDate?: string;
  travelers: TravelerDetails;
  preferences: TripPreferences;
  collaboration: CollaborationDetails;
}

export interface TripResponse {
  tripId: string;
  title?: string;
  destination: string;
  origin: string;
  departureDate: string;
  returnDate?: string;
  travelers: TravelerDetails | number;
  preferences?: Partial<TripPreferences>;
  collaboration?: CollaborationDetails;
  status: TripStatus;
  recommendations_ready?: boolean;
  createdAt?: string;
  updatedAt?: string;
  recommendations?: RecommendationCategories;
  selectedRecommendations?: RecommendationCategories;
}

// ============================================================================
// Trip Status Types
// ============================================================================

export type TripStatus =
  | 'created'
  | 'processing'
  | 'completed'
  | 'recommendations_ready'
  | 'finalized'
  | 'failed';

export interface TripStatusResponse {
  tripId: string;
  status: TripStatus;
  recommendations_ready?: boolean;
  agents: AgentStatus[];
  progress: number;
  message?: string;
  estimatedTimeRemaining?: number;
  trip?: TripResponse;
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentState = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentStatus {
  id: string;
  name: string;
  type: AgentType;
  state: AgentState;
  progress: number;
  message?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export type AgentType =
  | 'flight'
  | 'accommodation'
  | 'activity'
  | 'restaurant'
  | 'transportation';

// ============================================================================
// Recommendation Types
// ============================================================================

export interface Recommendation {
  id: string;
  name: string;
  description?: string;
  price?: number;
  rating?: number;
  reviews?: number;
  imageUrl?: string;
  image?: string;
  duration?: string;
  location?: string;
  time?: string;
  category: AgentType;
  metadata?: Record<string, any>;
}

export interface RecommendationCategories {
  flight?: Recommendation[];
  accommodation?: Recommendation[];
  activity?: Recommendation[];
  restaurant?: Recommendation[];
  transportation?: Recommendation[];
}

// ============================================================================
// Selection Types
// ============================================================================

export interface SelectionRequest {
  selections: {
    flight?: string[];
    accommodation?: string[];
    activity?: string[];
    restaurant?: string[];
    transportation?: string[];
  };
  selectedBy: string;
}

export interface SelectionResponse {
  tripId: string;
  status: TripStatus;
  selectedRecommendations: RecommendationCategories;
  totalCost: number;
  message: string;
}

// ============================================================================
// API Error Types
// ============================================================================

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class TripAPIError extends Error {
  public code?: string;
  public status?: number;
  public details?: any;

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = 'TripAPIError';
    this.code = code;
    this.status = status;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TripAPIError);
    }
  }
}

// ============================================================================
// UI Data Model Types
// ============================================================================

export interface Money {
  amount: number;
  currency: 'USD';
}

export interface Flight {
  id: string;
  carrier: string;
  flightNo: string;
  depart: string;
  arrive: string;
  durationISO: string;
  stops: number;
  price: Money;
  baggage?: {
    personal: boolean;
    carryOn: boolean;
    checked?: number;
  };
}

export interface Stay {
  id: string;
  name: string;
  neighborhood?: string;
  nights: number;
  rating?: number;
  freeCancel?: boolean;
  total: Money;
  distanceMi?: number;
}

export interface Transit {
  id: string;
  chain: string[];
  durationISO: string;
  fare?: Money;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
  priceLevel?: 1 | 2 | 3 | 4;
  openNow?: boolean;
  distanceMi?: number;
}

export interface TripSelections {
  flight?: Flight;
  stay?: Stay;
  transit?: Transit;
  restaurants: Restaurant[];
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  start: string;
  end: string;
  travelers: number;
  currency: 'USD';
  selections: TripSelections;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}
