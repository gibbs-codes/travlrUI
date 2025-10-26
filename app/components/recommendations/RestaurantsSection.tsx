'use client';

import { useState, useEffect, useCallback, forwardRef } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { restaurantService } from '../../lib/api';
import { RestaurantCard } from './RestaurantCard';
import { SectionHeader } from '../SectionHeader';
import { SkeletonStack } from '../Skeleton';
import { ErrorMessage } from '../ErrorMessage';
import { EmptyState } from '../EmptyState';
import { LockedSection } from '../LockedSection';
import type { Restaurant } from '../../lib/types';

interface RestaurantsSectionProps {
  tripId: string;
  selectedRestaurantIds: string[];
  onSelectRestaurant: (restaurant: Restaurant) => void;
  isUnlocked: boolean;
}

export const RestaurantsSection = forwardRef<HTMLElement, RestaurantsSectionProps>(
  ({ tripId, selectedRestaurantIds, onSelectRestaurant, isUnlocked }, ref) => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRestaurants = useCallback(async () => {
      if (!isUnlocked) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await restaurantService.getRecommendations(tripId);
        setRestaurants(response.recommendations || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load restaurants';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }, [tripId, isUnlocked]);

    useEffect(() => {
      if (isUnlocked) {
        fetchRestaurants();
      }
    }, [isUnlocked, fetchRestaurants]);

    const handleRerun = async () => {
      try {
        await restaurantService.rerunRecommendations(tripId);
        await fetchRestaurants();
      } catch (err) {
        console.error('Failed to rerun restaurants:', err);
      }
    };

    if (!isUnlocked) {
      return (
        <section ref={ref} id="restaurants">
          <LockedSection
            title="Food & sips"
            message="Select a hotel first to see restaurants nearby"
            icon={<UtensilsCrossed size={24} className="text-slate-500" />}
          />
        </section>
      );
    }

    return (
      <section ref={ref} id="restaurants">
        <SectionHeader
          title="Food & sips"
          description="Save the spots you want to taste."
        />
        <div className="mt-4 space-y-2.5">
          {isLoading && <SkeletonStack count={4} />}

          {error && (
            <ErrorMessage
              title="Failed to load restaurants"
              message={error}
              onRetry={fetchRestaurants}
            />
          )}

          {!isLoading && !error && restaurants.length === 0 && (
            <EmptyState
              icon={<UtensilsCrossed className="h-12 w-12 text-gray-400" />}
              title="No restaurants yet"
              message="We're searching for great places to eat nearby. Restaurant recommendations will appear here soon."
            />
          )}

          {!isLoading &&
            !error &&
            restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isSelected={selectedRestaurantIds.includes(restaurant.id)}
                onSelect={() => onSelectRestaurant(restaurant)}
                onRerun={handleRerun}
              />
            ))}
        </div>
      </section>
    );
  }
);

RestaurantsSection.displayName = 'RestaurantsSection';
