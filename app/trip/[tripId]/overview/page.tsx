'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Square } from 'lucide-react';
import { Background } from '../../../components/Background';
import { TopBar } from '../../../components/Navigation';
import { StickyTripSummary } from '../../../components/StickyTripSummary';
import { SectionHeader } from '../../../components/SectionHeader';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { tripAPI } from '../../../lib/api';
import {
  normalizeTripResponse,
  type NormalizedTrip,
  estimateTripTotal,
} from '../../../lib/tripAdapters';
import {
  formatDateTime,
  formatDuration,
  formatMoney,
  formatRoute,
  priceLevel,
  stars,
} from '../../../lib/formatters';
import type { Flight, Restaurant, Stay, Transit } from '../../../lib/types';

export default function Overview() {
  // This page stays as the authoritative “receipt”, so we normalize data once and
  // feed it through consistent helpers/components used by recommendations too.
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [data, setData] = useState<NormalizedTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

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
      const message =
        error instanceof Error ? error.message : 'Failed to load your trip overview.';
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

  const handleEdit = (kind: 'flight' | 'stay' | 'transit' | 'restaurants') => {
    const anchor =
      kind === 'flight'
        ? '#flights'
        : kind === 'stay'
        ? '#stays'
        : kind === 'transit'
        ? '#transit'
        : '#restaurants';
    router.push(`/trip/${tripId}/recommendations${anchor}`);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const trip = data?.trip;
  const selections = trip?.selections;
  const total = trip ? estimateTripTotal(trip) : null;
  const hasAnySelection =
    Boolean(selections?.flight) ||
    Boolean(selections?.stay) ||
    Boolean(selections?.transit);
  const grandTotalLabel =
    total && total.amount > 0
      ? formatMoney(total)
      : hasAnySelection
      ? 'Pending total'
      : total
      ? formatMoney(total)
      : '—';

  return (
    <>
      <Background />
      <TopBar logo="Travlr" navText="home" />

      <main className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 lg:px-6">
          {/* Layout note: two-column grid mirrors recommendations so the summary stays anchored. */}
          <header className="mb-10 space-y-2">
            <p className="text-sm uppercase tracking-wide text-slate-500">
              Trip overview
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Your curated itinerary
            </h1>
            <p className="text-sm text-slate-500">
              A quick snapshot of what&apos;s locked in and what&apos;s still open.
            </p>
          </header>

          {error && !trip && (
            <div className="mb-10">
              <ErrorMessage
                title="Unable to load trip overview"
                message={error}
                onRetry={fetchTrip}
              />
            </div>
          )}

          <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">
            <div className="space-y-12">
              <section>
                <SectionHeader
                  title="Seating chart for your trip"
                  description="Everything you&apos;ve selected so far."
                />
                <div className="mt-5 space-y-4">
                  {isLoading && <OverviewSkeleton />}
                  {!isLoading && trip && selections && (
                    <ul className="space-y-3">
                      <ChecklistItem
                        checked={Boolean(selections.flight)}
                        label={
                          selections.flight
                            ? describeFlight(selections.flight)
                            : 'Flight: choose the option that fits best.'
                        }
                        prefix="Flight"
                        onEdit={() => handleEdit('flight')}
                      />
                      <ChecklistItem
                        checked={Boolean(selections.stay)}
                        label={
                          selections.stay
                            ? describeStay(selections.stay)
                            : 'Stay: pick a place to land.'
                        }
                        prefix="Stay"
                        onEdit={() => handleEdit('stay')}
                      />
                      <ChecklistItem
                        checked={Boolean(selections.transit)}
                        label={
                          selections.transit
                            ? describeTransit(selections.transit)
                            : 'Transit: add a getting-around plan when you&apos;re ready.'
                        }
                        prefix="Transit"
                        onEdit={() => handleEdit('transit')}
                      />
                      <ChecklistItem
                        checked={selections.restaurants.length > 0}
                        label={
                          selections.restaurants.length > 0
                            ? describeRestaurants(selections.restaurants)
                            : 'Restaurants: nothing saved yet.'
                        }
                        prefix="Restaurants"
                        onEdit={() => handleEdit('restaurants')}
                      />
                    </ul>
                  )}
                </div>
              </section>

              <section>
                <SectionHeader
                  title="Trip basics"
                  description="Quick facts you can share."
                />
                <div className="mt-5 grid gap-3 rounded-lg border border-gray-200 bg-white/80 p-6 shadow-sm md:grid-cols-2">
                  {isLoading && <BasicsSkeleton />}
                  {!isLoading && trip && (
                    <>
                      <Detail label="Destination" value={trip.destination} />
                      <Detail label="Depart" value={formatDateTime(trip.start)} />
                      <Detail label="Origin" value={trip.origin} />
                      <Detail label="Return" value={formatDateTime(trip.end)} />
                      <Detail
                        label="Travelers"
                        value={`${trip.travelers} traveler${
                          trip.travelers === 1 ? '' : 's'
                        }`}
                      />
                    </>
                  )}
                </div>
              </section>

              {selections && selections.restaurants.length > 0 && (
                <section>
                  <SectionHeader
                    title="Saved restaurants"
                    description="Your edible must-haves."
                  />
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {selections.restaurants.map((restaurant) => (
                      <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
              {trip ? (
                <StickyTripSummary
                  trip={trip}
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

function describeFlight(flight: Flight) {
  return `Flight: ${flight.carrier} ${flight.flightNo} · ${formatDateTime(
    flight.depart
  )} → ${formatDateTime(flight.arrive)} · ${formatDuration(
    flight.durationISO
  )} · ${formatMoney(flight.price)}`;
}

function describeStay(stay: Stay) {
  const parts = [
    stay.name,
    `${stay.nights} night${stay.nights === 1 ? '' : 's'}`,
    stay.freeCancel ? 'Free cancel' : null,
    stay.rating ? stars(stay.rating) : null,
    formatMoney(stay.total),
  ].filter(Boolean);
  return `Stay: ${parts.join(' · ')}`;
}

function describeTransit(transit: Transit) {
  const parts = [
    formatRoute(transit.chain),
    formatDuration(transit.durationISO),
    transit.fare ? formatMoney(transit.fare) : null,
  ].filter(Boolean);
  return `Transit: ${parts.join(' · ')}`;
}

function describeRestaurants(restaurants: Restaurant[]) {
  return `Restaurants: ${restaurants.length} saved · ${restaurants
    .slice(0, 3)
    .map((restaurant) => restaurant.name)
    .join(', ')}`;
}

function ChecklistItem({
  checked,
  label,
  prefix,
  onEdit,
}: {
  checked: boolean;
  label: string;
  prefix: string;
  onEdit: () => void;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm">
      {checked ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-gray-400" />
      ) : (
        <Square className="mt-0.5 h-5 w-5 text-gray-400" />
      )}
      <div className="flex-1 space-y-1">
        <p className="text-sm text-gray-900">{label}</p>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
        >
          Edit {prefix.toLowerCase()}
        </button>
      </div>
    </li>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  // Check if this is a placeholder/generic restaurant
  const isGeneric =
    !restaurant.name ||
    restaurant.name === 'Restaurant' ||
    restaurant.name.toLowerCase().includes('restaurant recommendation');

  const displayName = isGeneric ? 'Name unavailable' : restaurant.name;

  // Build details line
  const details = [
    restaurant.rating ? stars(restaurant.rating) : null,
    restaurant.reviewCount ? `${restaurant.reviewCount} reviews` : null,
    restaurant.cuisine,
    priceLevel(restaurant.priceLevel),
  ].filter(Boolean);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{displayName}</p>
      {details.length > 0 && (
        <p className="text-xs text-slate-500">{details.join(' · ')}</p>
      )}
      {restaurant.address && (
        <p className="text-xs text-slate-400">{restaurant.address}</p>
      )}
      {typeof restaurant.distanceMi === 'number' && (
        <p className="text-xs text-slate-400">
          {restaurant.distanceMi.toFixed(1)} mi away
        </p>
      )}
      {restaurant.googlePlaceId && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${restaurant.googlePlaceId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-blue-600 hover:text-blue-700 hover:underline"
        >
          View on Google Maps →
        </a>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg border border-gray-200 bg-white/50"
        />
      ))}
    </div>
  );
}

function BasicsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg border border-gray-200 bg-white/50"
        />
      ))}
    </div>
  );
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
