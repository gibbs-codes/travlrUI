'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Car, UtensilsCrossed } from 'lucide-react';
import { Background } from '../../../components/Background';
import { TopBar } from '../../../components/Navigation';
import { ResultCard } from '../../../components/ResultCard';
import {
  FiltersBar,
  type Filters,
  type FlightSort,
} from '../../../components/FiltersBar';
import { SectionHeader } from '../../../components/SectionHeader';
import { StickyTripSummary } from '../../../components/StickyTripSummary';
import { LockedSection } from '../../../components/LockedSection';
import { SkeletonStack as BaseSkeletonStack } from '../../../components/Skeleton';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { EmptyState as BaseEmptyState } from '../../../components/EmptyState';
import { tripAPI } from '../../../lib/api';
import {
  normalizeTripResponse,
  type NormalizedTrip,
  estimateTripTotal,
} from '../../../lib/tripAdapters';
import { formatMoney } from '../../../lib/formatters';
import type { Flight, Restaurant, Stay, Transit } from '../../../lib/types';

type SelectionKind = 'flight' | 'stay' | 'transit' | 'restaurant';

const DEFAULT_FILTERS: Filters = {
  nonstop: false,
  carryOn: false,
};

const DEFAULT_SORT: FlightSort = 'price-asc';

export default function Recommendations() {
  // We reuse the normalized trip shape so cards + summary stay in sync across routes.
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [data, setData] = useState<NormalizedTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<FlightSort>(DEFAULT_SORT);

  const isMounted = useRef(true);

  const flightRef = useRef<HTMLDivElement | null>(null);
  const stayRef = useRef<HTMLDivElement | null>(null);
  const transitRef = useRef<HTMLDivElement | null>(null);
  const restaurantsRef = useRef<HTMLDivElement | null>(null);

  const fetchTrip = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tripAPI.get(tripId);
      if (!isMounted.current) return;
      const normalized = normalizeTripResponse(response.data);
      setData(normalized);
    } catch (error: unknown) {
      if (!isMounted.current) return;
      const message = error instanceof Error ? error.message : 'Failed to load recommendations.';
      setError(message);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
    return () => {
      isMounted.current = false;
    };
  }, [fetchTrip]);

  const flights = useMemo(() => {
    if (!data) return [];
    return applyFlightFilters(data.flights, filters, sort);
  }, [data, filters, sort]);

  const select = (
    kind: SelectionKind,
    item: Flight | Stay | Transit | Restaurant
  ) => {
    // Toggle logic mirrors original behavior but runs on the normalized Trip selection state.
    setData((current) => {
      if (!current) return current;
      const nextSelections = {
        ...current.trip.selections,
        restaurants: [...current.trip.selections.restaurants],
      };

      if (kind === 'restaurant') {
        const existingIndex = nextSelections.restaurants.findIndex(
          (restaurant) => restaurant.id === item.id
        );
        if (existingIndex >= 0) {
          nextSelections.restaurants.splice(existingIndex, 1);
        } else {
          nextSelections.restaurants.push(item as Restaurant);
        }
      } else {
        if (kind === 'flight') {
          nextSelections.flight =
            nextSelections.flight?.id === item.id
              ? undefined
              : (item as Flight);
        } else if (kind === 'stay') {
          // When changing hotel, reset transit and restaurants
          const isChangingHotel = nextSelections.stay?.id !== item.id && nextSelections.stay !== undefined;
          if (isChangingHotel) {
            nextSelections.transit = undefined;
            nextSelections.restaurants = [];
          }
          nextSelections.stay =
            nextSelections.stay?.id === item.id
              ? undefined
              : (item as Stay);
        } else if (kind === 'transit') {
          nextSelections.transit =
            nextSelections.transit?.id === item.id
              ? undefined
              : (item as Transit);
        }
      }

      return {
        ...current,
        trip: {
          ...current.trip,
          selections: nextSelections,
        },
      };
    });
  };

  // Sequential selection helpers
  const isStaySelected = !!data?.trip.selections.stay;
  const isTransitUnlocked = isStaySelected;
  const isRestaurantsUnlocked = isStaySelected;

  const handleToggleFilter = (filter: keyof Filters) => {
    setFilters((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleEdit = (
    kind: 'flight' | 'stay' | 'transit' | 'restaurants'
  ) => {
    const target =
      kind === 'flight'
        ? flightRef.current
        : kind === 'stay'
        ? stayRef.current
        : kind === 'transit'
        ? transitRef.current
        : restaurantsRef.current;

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSaveSelections = async () => {
    if (!data) return;
    setActionError(null);
    setIsSaving(true);

    try {
      await tripAPI.selectRecommendations(tripId, {
        selections: {
          flight: data.trip.selections.flight
            ? [data.trip.selections.flight.id]
            : [],
          accommodation: data.trip.selections.stay
            ? [data.trip.selections.stay.id]
            : [],
          transportation: data.trip.selections.transit
            ? [data.trip.selections.transit.id]
            : [],
          restaurant: data.trip.selections.restaurants.map(
            (restaurant) => restaurant.id
          ),
        },
        selectedBy: 'traveler@travlr.app',
      });
      router.push(`/trip/${tripId}/overview`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not save selections.';
      setActionError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const total = data ? estimateTripTotal(data.trip) : null;

  return (
    <>
      <Background />
      <TopBar logo="Travlr" navText="home" />

      <main className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 lg:px-6">
          {/* Two-column grid keeps the summary in view on desktop while preserving a single column on mobile. */}
          <header className="mb-8 space-y-1.5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Trip curation studio
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">
              Tune your itinerary
            </h1>
            <p className="text-sm text-gray-600">
              Pick the flight, stay, transit, and eats that feel right. We&apos;ll
              keep the total updated on the fly.
            </p>
          </header>

          {error && !data && (
            <ErrorMessage
              title="Unable to load recommendations"
              message={error}
              onRetry={fetchTrip}
            />
          )}

          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_360px] lg:gap-5">
            <div className="space-y-8">
              <section ref={flightRef} id="flights">
                <SectionHeader
                  title="Flights"
                  description="Choose the vibe that gets you there."
                  actions={
                    <FiltersBar
                      sort={sort}
                      filters={filters}
                      onSortChange={setSort}
                      onToggleFilter={handleToggleFilter}
                    />
                  }
                />

                <div className="mt-4 space-y-2.5">
                  {isLoading && <BaseSkeletonStack count={3} />}
                  {!isLoading && flights.length === 0 && (
                    <BaseEmptyState
                      icon="search"
                      title="No flights found"
                      message="Try adjusting your filters or check back later for more options."
                      action={{
                        label: 'Clear filters',
                        onClick: handleClearFilters,
                      }}
                    />
                  )}
                  {!isLoading &&
                    flights.map((flight) => (
                      <ResultCard
                        key={flight.id}
                        kind="flight"
                        data={flight}
                        isSelected={
                          data?.trip.selections.flight?.id === flight.id
                        }
                        onSelect={() => select('flight', flight)}
                      />
                    ))}
                </div>
              </section>

              <section ref={stayRef} id="stays">
                <SectionHeader
                  title="Stay vibes"
                  description="A cozy home-base to match the mood."
                />
                <div className="mt-4 space-y-2.5">
                  {isLoading && <BaseSkeletonStack count={3} />}
                  {!isLoading &&
                    data?.stays.map((stay) => (
                      <ResultCard
                        key={stay.id}
                        kind="stay"
                        data={stay}
                        isSelected={data.trip.selections.stay?.id === stay.id}
                        onSelect={() => select('stay', stay)}
                      />
                    ))}
                  {!isLoading && (data?.stays.length ?? 0) === 0 && (
                    <BaseEmptyState
                      icon="inbox"
                      title="No accommodations available"
                      message="We're still searching for the perfect places to stay. Check back in a moment."
                    />
                  )}
                </div>
              </section>

              <section ref={transitRef} id="transit">
                {!isTransitUnlocked ? (
                  <LockedSection
                    title="Getting around"
                    message="Select a hotel first to unlock transit recommendations near your stay"
                    icon={<Car size={24} className="text-slate-500" />}
                  />
                ) : (
                  <>
                    <SectionHeader
                      title="Getting around"
                      description="Pick the transit plan that feels easy."
                    />
                    <div className="mt-4 space-y-2.5">
                      {isLoading && <BaseSkeletonStack count={2} />}
                      {!isLoading &&
                        data?.transit.map((option) => (
                          <ResultCard
                            key={option.id}
                            kind="transit"
                            data={option}
                            isSelected={
                              data.trip.selections.transit?.id === option.id
                            }
                            onSelect={() => select('transit', option)}
                          />
                        ))}
                      {!isLoading && (data?.transit.length ?? 0) === 0 && (
                        <BaseEmptyState
                          icon={<Car className="h-12 w-12 text-gray-400" />}
                          title="No transit options yet"
                          message="We're looking for the best ways to get around. Transit options will appear here soon."
                        />
                      )}
                    </div>
                  </>
                )}
              </section>

              <section ref={restaurantsRef} id="restaurants">
                {!isRestaurantsUnlocked ? (
                  <LockedSection
                    title="Food & sips"
                    message="Select a hotel first to see restaurants nearby"
                    icon={<UtensilsCrossed size={24} className="text-slate-500" />}
                  />
                ) : (
                  <>
                    <SectionHeader
                      title="Food & sips"
                      description="Save the spots you want to taste."
                    />
                    <div className="mt-4 space-y-2.5">
                      {isLoading && <BaseSkeletonStack count={4} />}
                      {!isLoading &&
                        data?.restaurants.map((restaurant) => (
                          <ResultCard
                            key={restaurant.id}
                            kind="food"
                            data={restaurant}
                            isSelected={data.trip.selections.restaurants.some(
                              (saved) => saved.id === restaurant.id
                            )}
                            onSelect={() => select('restaurant', restaurant)}
                          />
                        ))}
                      {!isLoading && (data?.restaurants.length ?? 0) === 0 && (
                        <BaseEmptyState
                          icon={<UtensilsCrossed className="h-12 w-12 text-gray-400" />}
                          title="No restaurants yet"
                          message="We're finding the best places to eat nearby. Your dining options will appear here soon."
                        />
                      )}
                    </div>
                  </>
                )}
              </section>

              <footer className="rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm">
                {actionError && (
                  <p className="mb-3 text-sm text-red-600">{actionError}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {total && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      Estimated total · {formatMoney(total)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSelections}
                    disabled={isSaving || !data}
                    className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
                  >
                    {isSaving ? 'Saving...' : 'Save & view overview'}
                  </button>
                </div>
              </footer>
            </div>

            <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
              {data ? (
                <StickyTripSummary
                  trip={data.trip}
                  onEdit={handleEdit}
                  onPrint={handlePrint}
                />
              ) : (
                <SummarySkeleton />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function applyFlightFilters(
  flights: Flight[],
  filters: Filters,
  sort: FlightSort
): Flight[] {
  const filtered = flights.filter((flight) => {
    if (filters.nonstop && flight.stops > 0) return false;
    if (filters.carryOn && !flight.baggage?.carryOn) return false;
    return true;
  });

  const sorter = createFlightComparator(sort);
  return [...filtered].sort(sorter);
}

function createFlightComparator(sort: FlightSort) {
  switch (sort) {
    case 'price-asc':
      return (a: Flight, b: Flight) =>
        (a.price?.amount ?? Number.POSITIVE_INFINITY) -
        (b.price?.amount ?? Number.POSITIVE_INFINITY);
    case 'price-desc':
      return (a: Flight, b: Flight) =>
        (b.price?.amount ?? Number.NEGATIVE_INFINITY) -
        (a.price?.amount ?? Number.NEGATIVE_INFINITY);
    case 'duration':
      return (a: Flight, b: Flight) =>
        durationMinutes(a.durationISO) - durationMinutes(b.durationISO);
    case 'depart':
      return (a: Flight, b: Flight) =>
        departureValue(a.depart) - departureValue(b.depart);
    default:
      return () => 0;
  }
}

function durationMinutes(iso: string | undefined) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return Number.POSITIVE_INFINITY;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  return hours * 60 + minutes;
}

function departureValue(iso: string | undefined) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

function SummarySkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-lg border border-gray-200/70 bg-white/60 p-3"
          >
            <div className="h-8 w-8 rounded-full bg-slate-200" />
            <div className="h-3 flex-1 animate-pulse rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-lg bg-slate-900/10 p-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-300" />
      </div>
    </div>
  );
}
