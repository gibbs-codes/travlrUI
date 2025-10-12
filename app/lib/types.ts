// ============================================================================
// Trip Request & Response Types
// ============================================================================

export interface TripRequest {
  destination: string;
  origin: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  budget: number;
  interests: string[];
}

export interface TripResponse {
  tripId: string;
  destination: string;
  origin: string;
  departureDate: string;
  returnDate: string;
  travelers: number | { count: number };
  budget: number;
  interests: string[];
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  recommendations?: RecommendationCategories;
  selectedRecommendations?: RecommendationCategories;
}

// ============================================================================
// Trip Status Types
// ============================================================================

export type TripStatus =
  | 'created'
  | 'processing'
  | 'recommendations_ready'
  | 'finalized'
  | 'failed';

export interface TripStatusResponse {
  tripId: string;
  status: TripStatus;
  agents: AgentStatus[];
  progress: number;
  message?: string;
  estimatedTimeRemaining?: number;
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
