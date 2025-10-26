'use client';

import { useState, useEffect, useCallback, forwardRef } from 'react';
import { flightService } from '../../lib/api';
import { FlightCard } from './FlightCard';
import { SectionHeader } from '../SectionHeader';
import { SkeletonStack } from '../Skeleton';
import { ErrorMessage } from '../ErrorMessage';
import { EmptyState } from '../EmptyState';
import { FiltersBar, type Filters, type FlightSort } from '../FiltersBar';
import type { Flight } from '../../lib/types';

interface FlightsSectionProps {
  tripId: string;
  selectedFlightId?: string;
  onSelectFlight: (flight: Flight) => void;
}

const DEFAULT_FILTERS: Filters = {
  nonstop: false,
  carryOn: false,
};

const DEFAULT_SORT: FlightSort = 'price-asc';

export const FlightsSection = forwardRef<HTMLElement, FlightsSectionProps>(
  ({ tripId, selectedFlightId, onSelectFlight }, ref) => {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [sort, setSort] = useState<FlightSort>(DEFAULT_SORT);

    const fetchFlights = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await flightService.getRecommendations(tripId);
        setFlights(response.recommendations || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load flights';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }, [tripId]);

    useEffect(() => {
      fetchFlights();
    }, [fetchFlights]);

    const handleRerun = async () => {
      try {
        await flightService.rerunRecommendations(tripId);
        await fetchFlights();
      } catch (err) {
        console.error('Failed to rerun flights:', err);
      }
    };

    const handleToggleFilter = (filter: keyof Filters) => {
      setFilters((prev) => ({
        ...prev,
        [filter]: !prev[filter],
      }));
    };

    const handleClearFilters = () => {
      setFilters(DEFAULT_FILTERS);
    };

    // Apply filters and sorting
    const filteredAndSortedFlights = flights
      .filter((flight) => {
        if (filters.nonstop && flight.stops !== 0) return false;
        if (filters.carryOn && !flight.baggage?.carryOn) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sort) {
          case 'price-asc':
            return (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity);
          case 'price-desc':
            return (b.price?.amount ?? 0) - (a.price?.amount ?? 0);
          case 'duration':
            return (
              new Date(a.arrive).getTime() - new Date(a.depart).getTime() -
              (new Date(b.arrive).getTime() - new Date(b.depart).getTime())
            );
          case 'depart':
            return new Date(a.depart).getTime() - new Date(b.depart).getTime();
          default:
            return 0;
        }
      });

    const hasActiveFilters = filters.nonstop || filters.carryOn;

    return (
      <section ref={ref} id="flights">
        <SectionHeader
          title="Flights"
          description="Choose your ride to the destination."
        />
        <div className="mt-4 space-y-2.5">
          {isLoading && <SkeletonStack count={3} />}

          {error && (
            <ErrorMessage
              title="Failed to load flights"
              message={error}
              onRetry={fetchFlights}
            />
          )}

          {!isLoading && !error && flights.length === 0 && (
            <EmptyState
              icon="inbox"
              title="No flights available"
              message="We're still searching for the best flight options. Check back in a moment."
            />
          )}

          {!isLoading && !error && flights.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <FiltersBar
                  filters={filters}
                  sort={sort}
                  onToggleFilter={handleToggleFilter}
                  onSortChange={setSort}
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-150"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {filteredAndSortedFlights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  isSelected={selectedFlightId === flight.id}
                  onSelect={() => onSelectFlight(flight)}
                  onRerun={handleRerun}
                />
              ))}
            </>
          )}
        </div>
      </section>
    );
  }
);

FlightsSection.displayName = 'FlightsSection';
