'use client';

import { useState, useEffect, useCallback, forwardRef } from 'react';
import { hotelService } from '../../lib/api';
import { HotelCard } from './HotelCard';
import { SectionHeader } from '../SectionHeader';
import { SkeletonStack } from '../Skeleton';
import { ErrorMessage } from '../ErrorMessage';
import { EmptyState } from '../EmptyState';
import type { Stay } from '../../lib/types';

interface HotelsSectionProps {
  tripId: string;
  selectedHotelId?: string;
  onSelectHotel: (hotel: Stay) => void;
}

export const HotelsSection = forwardRef<HTMLElement, HotelsSectionProps>(
  ({ tripId, selectedHotelId, onSelectHotel }, ref) => {
    const [hotels, setHotels] = useState<Stay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHotels = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await hotelService.getRecommendations(tripId);
        setHotels(response.recommendations || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load hotels';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }, [tripId]);

    useEffect(() => {
      fetchHotels();
    }, [fetchHotels]);

    const handleRerun = async () => {
      try {
        await hotelService.rerunRecommendations(tripId);
        await fetchHotels();
      } catch (err) {
        console.error('Failed to rerun hotels:', err);
      }
    };

    return (
      <section ref={ref} id="stays">
        <SectionHeader
          title="Stay vibes"
          description="A cozy home-base to match the mood."
        />
        <div className="mt-4 space-y-2.5">
          {isLoading && <SkeletonStack count={3} />}

          {error && (
            <ErrorMessage
              title="Failed to load accommodations"
              message={error}
              onRetry={fetchHotels}
            />
          )}

          {!isLoading && !error && hotels.length === 0 && (
            <EmptyState
              icon="inbox"
              title="No accommodations available"
              message="We're still searching for the perfect places to stay. Check back in a moment."
            />
          )}

          {!isLoading &&
            !error &&
            hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                stay={hotel}
                isSelected={selectedHotelId === hotel.id}
                onSelect={() => onSelectHotel(hotel)}
                onRerun={handleRerun}
              />
            ))}
        </div>
      </section>
    );
  }
);

HotelsSection.displayName = 'HotelsSection';
