import type { Flight, Money, Restaurant, Stay, Transit, Trip } from './types';

// This adapter centralizes “API-ish” shapes into UI-friendly models without mutating responses.
type Json = Record<string, unknown>;

type NormalizedRecommendations = {
  flights: Flight[];
  stays: Stay[];
  transit: Transit[];
  restaurants: Restaurant[];
};

export type NormalizedTrip = NormalizedRecommendations & {
  trip: Trip;
};

const DEFAULT_TRIP: Trip = {
  id: '',
  origin: 'Origin TBD',
  destination: 'Destination TBD',
  start: '',
  end: '',
  travelers: 1,
  currency: 'USD',
  selections: { flight: undefined, stay: undefined, transit: undefined, restaurants: [] },
};

export function normalizeTripResponse(raw: unknown): NormalizedTrip {
  const source = toRecord(raw);
  const currency = detectCurrency(source);
  const selections = toRecord(source.selectedRecommendations);
  const recommendations = toRecord(source.recommendations);

  const flights = dedupeFlights(
    toRecords(recommendations.flight)
      .map((item) => mapFlight(item, currency))
      .filter((flight): flight is Flight => Boolean(flight))
  );

  const stays = toRecords(recommendations.accommodation)
    .map((item) => mapStay(item, currency))
    .filter((stay): stay is Stay => Boolean(stay));

  const transit = toRecords(recommendations.transportation)
    .map((item) => mapTransit(item, currency))
    .filter((option): option is Transit => Boolean(option));

  const restaurants = toRecords(recommendations.restaurant)
    .map((item) => mapRestaurant(item))
    .filter((restaurant): restaurant is Restaurant => Boolean(restaurant));

  const trip: Trip = {
    ...DEFAULT_TRIP,
    id: asString(source.tripId) ?? asString(source.id) ?? DEFAULT_TRIP.id,
    origin: stringifyLocation(source.origin) ?? DEFAULT_TRIP.origin,
    destination: stringifyLocation(source.destination) ?? DEFAULT_TRIP.destination,
    start: asString(source.departureDate) ?? asString(source.start) ?? DEFAULT_TRIP.start,
    end: asString(source.returnDate) ?? asString(source.end) ?? DEFAULT_TRIP.end,
    travelers: extractTravelers(source.travelers),
    currency,
    selections: {
      flight: pickFirst(selections.flight, (item) => mapFlight(item, currency)),
      stay: pickFirst(selections.accommodation, (item) => mapStay(item, currency)),
      transit: pickFirst(selections.transportation, (item) => mapTransit(item, currency)),
      restaurants: Array.isArray(selections.restaurant)
        ? selections.restaurant
            .filter(isRecord)
            .map((item) => mapRestaurant(item))
            .filter((restaurant): restaurant is Restaurant => Boolean(restaurant))
        : [],
    },
  };

  return {
    trip: ensureSelectionsDefaults(trip),
    flights,
    stays,
    transit,
    restaurants,
  };
}

export function estimateTripTotal(trip: Trip): Money {
  const amount =
    (trip.selections.flight?.price?.amount ?? 0) +
    (trip.selections.stay?.total?.amount ?? 0) +
    (trip.selections.transit?.fare?.amount ?? 0);

  return {
    amount,
    currency: trip.currency,
  };
}

function mapFlight(raw: Json, currency: Money['currency']): Flight | null {
  const metadata = toRecord(raw.metadata);
  const segments = Array.isArray(metadata.segments)
    ? metadata.segments.filter(isRecord)
    : [];

  const firstSegment = segments[0] as Json | undefined;
  const lastSegment = segments[segments.length - 1] as Json | undefined;

  const carrier =
    asString(metadata.carrier) ??
    asString(raw.carrier) ??
    firstToken(asString(raw.name)) ??
    'Carrier TBD';

  const flightNo =
    asString(metadata.flightNo) ??
    asString(metadata.flightNumber) ??
    asString(raw.flightNo) ??
    asString(raw.flightNumber) ??
    lastToken(asString(raw.name)) ??
    '—';

  const depart =
    asString(metadata.depart) ??
    asString(metadata.departure) ??
    asString(metadata.departureTime) ??
    asString(raw.departure) ??
    asString(raw.departureTime) ??
    asString(raw.depart) ??
    asString(firstSegment?.departureTime) ??
    '';

  const arrive =
    asString(metadata.arrive) ??
    asString(metadata.arrival) ??
    asString(metadata.arrivalTime) ??
    asString(raw.arrival) ??
    asString(raw.arrivalTime) ??
    asString(raw.arrive) ??
    asString(lastSegment?.arrivalTime) ??
    '';

  const durationISO =
    asString(metadata.durationISO) ??
    asString(metadata.duration) ??
    asString(raw.durationISO) ??
    asString(raw.duration) ??
    estimateDurationISO(depart, arrive);

  const stopsCandidate =
    asNumber(metadata.stops) ??
    asNumber(metadata.numStops) ??
    asNumber(raw.stops) ??
    (segments.length ? segments.length - 1 : undefined);

  const baggageRaw = {
    ...toRecord(raw.baggage),
    ...toRecord(metadata.baggage),
  };

  const price = ensureMoney(metadata.price ?? raw.price, currency) ?? {
    amount: 0,
    currency,
  };

  const bookingUrl =
    asString(raw.bookingUrl) ??
    asString(raw.booking_url) ??
    asString(metadata.bookingUrl) ??
    asString(metadata.booking_url) ??
    asString(raw.url) ??
    asString(metadata.url) ??
    undefined;

  return {
    id: String(asString(raw.id) ?? `${carrier}-${flightNo}`),
    carrier,
    flightNo: String(flightNo),
    depart,
    arrive,
    durationISO,
    stops: stopsCandidate != null ? Math.max(0, Math.round(stopsCandidate)) : 0,
    price,
    baggage: {
      personal: coerceBoolean(
        baggageRaw.personal ??
          metadata.personalItem ??
          baggageRaw.personalItem ??
          baggageRaw.personal_item
      ) || false,
      carryOn: coerceBoolean(
        baggageRaw.carryOn ??
          baggageRaw.carry_on ??
          metadata.carryOn ??
          baggageRaw.handLuggage ??
          baggageRaw.hand_luggage
      ) || false,
      checked:
        asNumber(baggageRaw.checked) ??
        asNumber(baggageRaw.checkedBags) ??
        asNumber(baggageRaw.checked_bags) ??
        asNumber(metadata.checked) ??
        undefined,
    },
    bookingUrl,
  };
}

function mapStay(raw: Json, currency: Money['currency']): Stay | null {
  const metadata = toRecord(raw.metadata);
  const price = ensureMoney(
    metadata.total ?? metadata.price ?? raw.total ?? raw.price,
    currency
  );

  const nightsCandidate =
    asNumber(metadata.nights) ??
    asNumber(raw.nights) ??
    asNumber(metadata.duration);

  const bookingUrl =
    asString(raw.bookingUrl) ??
    asString(raw.booking_url) ??
    asString(metadata.bookingUrl) ??
    asString(metadata.booking_url) ??
    asString(raw.url) ??
    asString(metadata.url) ??
    undefined;

  // Extract images
  const agentMetadata = toRecord(raw.agentMetadata);
  const imagesRaw = raw.images ?? agentMetadata.images ?? metadata.images;
  const images = Array.isArray(imagesRaw)
    ? imagesRaw.map(img => asString(img)).filter((img): img is string => Boolean(img))
    : undefined;

  return {
    id: String(asString(raw.id) ?? asString(raw.name) ?? cryptoRandomId()),
    name: asString(raw.name) ?? 'Stay TBD',
    neighborhood:
      asString(metadata.neighborhood) ??
      asString(raw.neighborhood) ??
      asString(raw.location),
    nights: nightsCandidate != null
      ? Math.max(1, Math.round(nightsCandidate))
      : 1,
    rating: asNumber(metadata.rating) ?? asNumber(raw.rating),
    freeCancel: coerceBoolean(metadata.freeCancel ?? raw.freeCancel ?? raw.freeCancellation) ?? false,
    total: price ?? { amount: 0, currency },
    distanceMi:
      asNumber(metadata.distanceMi) ??
      asNumber(raw.distanceMi) ??
      asNumber(metadata.distance_mi) ??
      asNumber(raw.distance_mi) ??
      undefined,
    bookingUrl,
    images: images && images.length > 0 ? images : undefined,
  };
}

function mapTransit(raw: Json, currency: Money['currency']): Transit | null {
  const metadata = toRecord(raw.metadata);
  const chain = toStringArray(
    metadata.chain ?? metadata.route ?? raw.chain ?? raw.route ?? asString(raw.name)
  );

  const durationISO =
    asString(metadata.durationISO) ??
    asString(metadata.duration) ??
    asString(raw.durationISO) ??
    asString(raw.duration) ??
    '';

  const fare = ensureMoney(metadata.fare ?? raw.fare ?? raw.price, currency);

  const bookingUrl =
    asString(raw.bookingUrl) ??
    asString(raw.booking_url) ??
    asString(metadata.bookingUrl) ??
    asString(metadata.booking_url) ??
    asString(raw.url) ??
    asString(metadata.url) ??
    undefined;

  return {
    id: String((asString(raw.id) ?? chain.join('-')) || cryptoRandomId()),
    chain,
    durationISO,
    fare: fare ?? undefined,
    bookingUrl,
  };
}

function mapRestaurant(raw: Json): Restaurant | null {
  const metadata = toRecord(raw.metadata);
  const agentMetadata = toRecord(raw.agentMetadata);
  const location = toRecord(raw.location);
  const rating = toRecord(raw.rating);
  const externalIds = toRecord(raw.externalIds);

  const priceLevelCandidate =
    asNumber(metadata.priceLevel) ??
    asNumber(raw.priceLevel) ??
    asNumber(metadata.price_level) ??
    asNumber(raw.price_level) ??
    asNumber(agentMetadata.priceLevel) ??
    asNumber(agentMetadata.price_level);

  const validPriceLevel =
    priceLevelCandidate && [1, 2, 3, 4].includes(priceLevelCandidate)
      ? (priceLevelCandidate as 1 | 2 | 3 | 4)
      : undefined;

  // Extract coordinates
  const coords = toRecord(location.coordinates);
  const coordinates = coords && typeof coords.lat === 'number' && typeof coords.lng === 'number'
    ? { lat: coords.lat, lng: coords.lng }
    : undefined;

  // Extract images
  const imagesRaw = raw.images ?? agentMetadata.images ?? metadata.images;
  const images = Array.isArray(imagesRaw)
    ? imagesRaw.map(img => asString(img)).filter((img): img is string => Boolean(img))
    : undefined;

  // Get price from recommendation
  const rawPrice = toRecord(raw.price);
  const priceAmount = asNumber(rawPrice.amount) ?? asNumber(metadata.price);
  const price = priceAmount !== undefined ? { amount: priceAmount, currency: 'USD' as const } : undefined;

  return {
    id: String(asString(raw.id) ?? asString(raw.name) ?? cryptoRandomId()),
    name: asString(raw.name) ?? 'Restaurant',
    cuisine:
      asString(agentMetadata.cuisine) ??
      asString(metadata.cuisine) ??
      asString(raw.cuisine) ??
      undefined,
    priceLevel: validPriceLevel,
    openNow: coerceBoolean(metadata.openNow ?? raw.openNow ?? raw.open) ?? undefined,
    distanceMi:
      asNumber(metadata.distanceMi) ??
      asNumber(raw.distanceMi) ??
      asNumber(metadata.distance_mi) ??
      asNumber(raw.distance_mi) ??
      undefined,
    address:
      asString(location.address) ??
      asString(metadata.address) ??
      asString(raw.address) ??
      undefined,
    rating:
      asNumber(rating.score) ??
      asNumber(raw.rating) ??
      asNumber(metadata.rating) ??
      undefined,
    reviewCount:
      asNumber(rating.reviewCount) ??
      asNumber(rating.review_count) ??
      asNumber(metadata.reviewCount) ??
      asNumber(metadata.review_count) ??
      undefined,
    images: images && images.length > 0 ? images : undefined,
    coordinates,
    googlePlaceId:
      asString(externalIds.providerId) ??
      asString(externalIds.googlePlaceId) ??
      asString(metadata.placeId) ??
      undefined,
    price,
  };
}

function ensureMoney(value: unknown, currency: Money['currency']): Money | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { amount: value, currency };
  }

  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^0-9.]/g, ''));
    if (!Number.isNaN(numeric)) {
      return { amount: numeric, currency };
    }
  }

  if (isRecord(value)) {
    const amount = asNumber(value.amount) ?? asNumber(value.total) ?? asNumber(value.value);
    if (typeof amount === 'number') {
      const detectedCurrency = asString(value.currency) ?? currency;
      return { amount, currency: detectedCurrency as Money['currency'] };
    }
  }

  return undefined;
}

function dedupeFlights(flights: Flight[]): Flight[] {
  const map = new Map<string, Flight>();
  for (const flight of flights) {
    const key = `${flight.carrier}-${flight.flightNo}`.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, flight);
      continue;
    }
    if ((flight.price?.amount ?? Infinity) < (existing.price?.amount ?? Infinity)) {
      map.set(key, flight);
    }
  }
  return Array.from(map.values());
}

function pickFirst<T>(value: unknown, mapper: (item: Json) => T | null): T | undefined {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      if (!isRecord(candidate)) continue;
      const mapped = mapper(candidate);
      if (mapped) return mapped;
    }
    return undefined;
  }

  if (isRecord(value)) {
    return mapper(value) ?? undefined;
  }

  return undefined;
}

function stringifyLocation(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (isRecord(value)) {
    if (typeof value.name === 'string') return value.name;
    if (typeof value.city === 'string' && typeof value.country === 'string') {
      return `${value.city}, ${value.country}`;
    }
    if (typeof value.city === 'string') return value.city;
  }
  return undefined;
}

function extractTravelers(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value || 1;
  }

  if (isRecord(value)) {
    if (typeof value.count === 'number') {
      return value.count || 1;
    }

    const adults = asNumber(value.adults) ?? 0;
    const children = asNumber(value.children) ?? 0;
    const infants = asNumber(value.infants) ?? 0;
    const total = adults + children + infants;
    return total > 0 ? total : 1;
  }

  return 1;
}

function detectCurrency(raw: Json): Money['currency'] {
  const direct = asString(raw.currency);
  if (direct) return direct as Money['currency'];

  const preferences = toRecord(raw.preferences);
  const preferenceBudget = toRecord(preferences.budget);
  const preferenceCurrency = asString(preferenceBudget.currency);
  if (preferenceCurrency) return preferenceCurrency as Money['currency'];

  const budget = toRecord(raw.budget);
  const budgetCurrency = asString(budget.currency);
  if (budgetCurrency) return budgetCurrency as Money['currency'];

  return 'USD';
}

function toStringArray(value: unknown): string[] {
  if (!value && value !== 0) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item) ?? String(item))
      .filter((part) => Boolean(part.trim()));
  }

  if (typeof value === 'string') {
    return value.split('→').map((part) => part.trim()).filter(Boolean);
  }

  return [String(value)];
}

function ensureSelectionsDefaults(trip: Trip): Trip {
  return {
    ...trip,
    selections: {
      flight: trip.selections.flight,
      stay: trip.selections.stay,
      transit: trip.selections.transit,
      restaurants: trip.selections.restaurants ?? [],
    },
  };
}

function firstToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.split(' ')[0];
}

function lastToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parts = value.split(' ');
  return parts[parts.length - 1];
}

function estimateDurationISO(start: string, end: string): string {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '';
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return '';

  const minutes = Math.round(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) return `PT${hours}H${remainingMinutes}M`;
  if (hours) return `PT${hours}H`;
  return `PT${remainingMinutes}M`;
}

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null;
}

function toRecord(value: unknown): Json {
  return isRecord(value) ? (value as Json) : {};
}

function toRecords(value: unknown): Json[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord) as Json[];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(lowered)) return true;
    if (['false', 'no', 'n', '0'].includes(lowered)) return false;
  }
  return undefined;
}

function cryptoRandomId(): string {
  const { crypto } = globalThis as typeof globalThis & { crypto?: Crypto };
  if (crypto && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}
