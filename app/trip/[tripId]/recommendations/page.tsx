'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Background } from '../../../components/Background';
import { TopBar } from '../../../components/Navigation';
import {
  FlightsSection,
  HotelsSection,
  ExperiencesSection,
  RestaurantsSection,
} from '../../../components/recommendations';
import { StickyTripSummary } from '../../../components/StickyTripSummary';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { tripService } from '../../../lib/api';
import { formatMoney } from '../../../lib/formatters';
import type { Flight, Restaurant, Stay, Transit, Trip } from '../../../lib/types';

interface TripSummary {
  tripId: string;
  destination: string;
  origin: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  selections: {
    flight?: Flight;
    stay?: Stay;
    transit?: Transit;
    restaurants: Restaurant[];
  };
}

export default function Recommendations() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  // Trip summary state (lightweight - just basic info and selections)
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isMounted = useRef(true);

  // Refs for scrolling
  const flightRef = useRef<HTMLElement>(null);
  const stayRef = useRef<HTMLElement>(null);
  const transitRef = useRef<HTMLElement>(null);
  const restaurantsRef = useRef<HTMLElement>(null);

  // Fetch trip summary (basic info + selections only)
  const fetchTripSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const response = await tripService.getTripDetails(tripId);
      if (!isMounted.current) return;

      // Extract just the summary info we need
      const summary: TripSummary = {
        tripId: response.tripId || tripId,
        destination: response.destination || '',
        origin: response.origin || '',
        departureDate: response.departureDate || '',
        returnDate: response.returnDate || '',
        travelers: typeof response.travelers === 'number' ? response.travelers : response.travelers?.count || 1,
        selections: {
          flight: response.selectedRecommendations?.flight?.[0] as Flight | undefined,
          stay: response.selectedRecommendations?.accommodation?.[0] as Stay | undefined,
          transit: response.selectedRecommendations?.activity?.[0] as Transit | undefined,
          restaurants: (response.selectedRecommendations?.restaurant || []) as Restaurant[],
        },
      };

      setTripSummary(summary);
    } catch (error: unknown) {
      if (!isMounted.current) return;
      const message = error instanceof Error ? error.message : 'Failed to load trip summary.';
      setSummaryError(message);
    } finally {
      if (isMounted.current) {
        setIsLoadingSummary(false);
      }
    }
  }, [tripId]);

  useEffect(() => {
    fetchTripSummary();
    return () => {
      isMounted.current = false;
    };
  }, [fetchTripSummary]);

  // Selection handlers - update local state and save to backend
  const handleSelectFlight = async (flight: Flight) => {
    if (!tripSummary) return;

    // Toggle selection
    const isCurrentlySelected = tripSummary.selections.flight?.id === flight.id;
    const newFlight = isCurrentlySelected ? undefined : flight;

    // Optimistic update
    setTripSummary({
      ...tripSummary,
      selections: {
        ...tripSummary.selections,
        flight: newFlight,
      },
    });
  };

  const handleSelectHotel = async (hotel: Stay) => {
    if (!tripSummary) return;

    // Toggle selection
    const isCurrentlySelected = tripSummary.selections.stay?.id === hotel.id;
    const newStay = isCurrentlySelected ? undefined : hotel;

    // If changing hotels, clear transit and restaurants
    const isChangingHotel = tripSummary.selections.stay && !isCurrentlySelected;

    // Optimistic update
    setTripSummary({
      ...tripSummary,
      selections: {
        ...tripSummary.selections,
        stay: newStay,
        transit: isChangingHotel ? undefined : tripSummary.selections.transit,
        restaurants: isChangingHotel ? [] : tripSummary.selections.restaurants,
      },
    });
  };

  const handleSelectTransit = async (transit: Transit) => {
    if (!tripSummary) return;

    // Toggle selection
    const isCurrentlySelected = tripSummary.selections.transit?.id === transit.id;
    const newTransit = isCurrentlySelected ? undefined : transit;

    // Optimistic update
    setTripSummary({
      ...tripSummary,
      selections: {
        ...tripSummary.selections,
        transit: newTransit,
      },
    });
  };

  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    if (!tripSummary) return;

    // Toggle selection (restaurants can have multiple)
    const currentRestaurants = tripSummary.selections.restaurants;
    const isCurrentlySelected = currentRestaurants.some((r) => r.id === restaurant.id);

    const newRestaurants = isCurrentlySelected
      ? currentRestaurants.filter((r) => r.id !== restaurant.id)
      : [...currentRestaurants, restaurant];

    // Optimistic update
    setTripSummary({
      ...tripSummary,
      selections: {
        ...tripSummary.selections,
        restaurants: newRestaurants,
      },
    });
  };

  // Save selections to backend
  const handleSaveSelections = async () => {
    if (!tripSummary) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await tripService.selectRecommendations(tripId, {
        selections: {
          flight: tripSummary.selections.flight ? [tripSummary.selections.flight.id] : [],
          accommodation: tripSummary.selections.stay ? [tripSummary.selections.stay.id] : [],
          transportation: tripSummary.selections.transit ? [tripSummary.selections.transit.id] : [],
          restaurant: tripSummary.selections.restaurants.map((r) => r.id),
        },
        selectedBy: 'user',
      });

      // Navigate to overview
      router.push(`/trip/${tripId}/overview`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save selections.';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (kind: 'flight' | 'stay' | 'transit' | 'restaurants') => {
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

  // Convert TripSummary to Trip for StickyTripSummary
  const convertToTrip = (summary: TripSummary) => ({
    id: summary.tripId,
    origin: summary.origin,
    destination: summary.destination,
    start: summary.departureDate,
    end: summary.returnDate,
    travelers: summary.travelers,
    currency: 'USD' as const,
    selections: summary.selections,
  });

  // Calculate if sections are unlocked
  const isStaySelected = !!tripSummary?.selections.stay;
  const isTransitUnlocked = isStaySelected;
  const isRestaurantsUnlocked = isStaySelected;

  // Calculate estimated total
  const estimatedTotal = tripSummary
    ? (tripSummary.selections.flight?.price?.amount || 0) +
      (tripSummary.selections.stay?.total?.amount || 0) +
      (tripSummary.selections.transit?.fare?.amount || 0)
    : 0;

  if (summaryError) {
    return (
      <div>
        <TopBar />
        <Background />
        <div className="min-h-screen px-4 pb-20 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <ErrorMessage
              title="Failed to load trip"
              message={summaryError}
              onRetry={fetchTripSummary}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar />
      <Background />

      <div className="min-h-screen px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main content */}
          <div className="space-y-10">
            {saveError && (
              <ErrorMessage title="Failed to save selections" message={saveError} />
            )}

            <FlightsSection
              ref={flightRef}
              tripId={tripId}
              selectedFlightId={tripSummary?.selections.flight?.id}
              onSelectFlight={handleSelectFlight}
            />

            <HotelsSection
              ref={stayRef}
              tripId={tripId}
              selectedHotelId={tripSummary?.selections.stay?.id}
              onSelectHotel={handleSelectHotel}
            />

            <ExperiencesSection
              ref={transitRef}
              tripId={tripId}
              selectedTransitId={tripSummary?.selections.transit?.id}
              onSelectTransit={handleSelectTransit}
              isUnlocked={isTransitUnlocked}
            />

            <RestaurantsSection
              ref={restaurantsRef}
              tripId={tripId}
              selectedRestaurantIds={tripSummary?.selections.restaurants.map((r) => r.id) || []}
              onSelectRestaurant={handleSelectRestaurant}
              isUnlocked={isRestaurantsUnlocked}
            />
          </div>

          {/* Sticky summary */}
          {tripSummary && !isLoadingSummary && (
            <aside className="hidden lg:block">
              <StickyTripSummary
                trip={convertToTrip(tripSummary)}
                onEdit={handleEdit}
                onPrint={handlePrint}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
