import {
  TripRequest,
  TravelerDetails,
  BudgetPreferences,
  BudgetBreakdown,
  AccommodationPreferences,
  TransportationPreferences,
  DiningPreferences,
  CollaborationDetails,
} from './types';

const DEFAULT_BUDGET_BREAKDOWN: BudgetBreakdown = {
  flight: 500,
  accommodation: 700,
  food: 200,
  activities: 100,
};

const DEFAULT_BUDGET: BudgetPreferences = {
  total: 1500,
  currency: 'USD',
  breakdown: DEFAULT_BUDGET_BREAKDOWN,
};

const DEFAULT_BUDGET_TOTAL = DEFAULT_BUDGET.total;

const DEFAULT_ACCOMMODATION: AccommodationPreferences = {
  type: 'hotel',
  minRating: 3,
};

const DEFAULT_TRANSPORTATION: TransportationPreferences = {
  flightClass: 'economy',
  preferNonStop: true,
};

const DEFAULT_DINING: DiningPreferences = {
  priceRange: 'mid_range',
};

const DEFAULT_COLLABORATION: CollaborationDetails = {
  createdBy: 'user@example.com',
};

function toNumber(value: any, fallback: number): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: any, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (lowered === 'true') return true;
    if (lowered === 'false') return false;
  }
  return fallback;
}

function buildTravelerDetails(input: any): TravelerDetails {
  const adults = toNumber(
    input?.adults ?? input?.count ?? input ?? 1,
    1
  );

  return {
    adults,
    count: toNumber(input?.count ?? adults, adults),
    children: toNumber(input?.children, 0),
    infants: toNumber(input?.infants, 0),
  };
}

function buildBudget(input: any, rootBudget: any): BudgetPreferences {
  const rawBudget = input ?? (rootBudget ? { total: rootBudget } : undefined);

  const total = toNumber(rawBudget?.total, DEFAULT_BUDGET.total);
  const currency = rawBudget?.currency ?? DEFAULT_BUDGET.currency;

  if (!rawBudget?.breakdown) {
    const ratio = total / DEFAULT_BUDGET_TOTAL;
    const scaledEntries = Object.entries(DEFAULT_BUDGET_BREAKDOWN).map(([key, value]) => {
      const scaled = Number((value * ratio).toFixed(2));
      return [key, scaled] as [string, number];
    });

    const scaledBreakdown = scaledEntries.reduce<BudgetBreakdown>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as BudgetBreakdown);

    const scaledTotal = scaledEntries.reduce((sum, [, value]) => sum + value, 0);
    const difference = Number((total - scaledTotal).toFixed(2));

    if (difference !== 0) {
      const adjustKey: keyof BudgetBreakdown = 'accommodation';
      scaledBreakdown[adjustKey] = Number(
        ((scaledBreakdown[adjustKey] ?? 0) + difference).toFixed(2)
      );
    }

    return { total, currency, breakdown: scaledBreakdown };
  }

  const breakdownInput = rawBudget.breakdown;

  const breakdown: BudgetBreakdown = {
    flight: toNumber(breakdownInput.flight, DEFAULT_BUDGET_BREAKDOWN.flight),
    accommodation: toNumber(breakdownInput.accommodation, DEFAULT_BUDGET_BREAKDOWN.accommodation),
    food: toNumber(breakdownInput.food, DEFAULT_BUDGET_BREAKDOWN.food),
    activities: toNumber(breakdownInput.activities, DEFAULT_BUDGET_BREAKDOWN.activities),
  };

  return { total, currency, breakdown };
}

function buildAccommodation(input: any): AccommodationPreferences {
  return {
    type: input?.type ?? DEFAULT_ACCOMMODATION.type,
    minRating: toNumber(input?.minRating, DEFAULT_ACCOMMODATION.minRating),
  };
}

function buildTransportation(input: any): TransportationPreferences {
  return {
    flightClass: input?.flightClass ?? DEFAULT_TRANSPORTATION.flightClass,
    preferNonStop: toBoolean(input?.preferNonStop, DEFAULT_TRANSPORTATION.preferNonStop),
  };
}

function buildDining(input: any): DiningPreferences {
  return {
    priceRange: input?.priceRange ?? DEFAULT_DINING.priceRange,
  };
}

export function buildCreateTripPayload(input: any): TripRequest {
  const destination = input.destination || '';

  const travelersInput = input.travelers ?? input;

  const preferencesInput = input.preferences || {};

  const rawInterests = preferencesInput.interests ?? input.interests;

  const interests = Array.isArray(rawInterests) && rawInterests.length > 0
    ? [...rawInterests]
    : ['food', 'cultural', 'adventure', 'nightlife'];

  // Build agentsToRun array from selectedAgents object
  let agentsToRun: string[] | undefined;
  if (input.selectedAgents) {
    agentsToRun = Object.keys(input.selectedAgents).filter(
      (key) => input.selectedAgents[key] === true
    );
  }

  const payload: TripRequest = {
    title: input.title || (destination ? `Trip to ${destination}` : 'Untitled Trip'),
    destination,
    origin: input.origin || '',
    departureDate: input.departureDate || '',
    returnDate: input.returnDate || '',
    travelers: buildTravelerDetails(travelersInput),
    preferences: {
      interests,
      budget: buildBudget(preferencesInput.budget, input.budget),
      accommodation: buildAccommodation(preferencesInput.accommodation),
      transportation: buildTransportation(preferencesInput.transportation),
      dining: buildDining(preferencesInput.dining),
    },
    collaboration: {
      ...DEFAULT_COLLABORATION,
      ...(input.collaboration || {}),
    },
    ...(agentsToRun && agentsToRun.length > 0 ? { agentsToRun } : {}),
  };

  return payload;
}
