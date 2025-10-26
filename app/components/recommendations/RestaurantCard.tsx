'use client';

import { UtensilsCrossed, Star, MapPin, DollarSign } from 'lucide-react';
import { MouseEvent } from 'react';
import { formatMoney, stars as formatStars, priceLevel as formatPriceLevel } from '../../lib/formatters';
import type { Restaurant } from '../../lib/types';
import {
  BaseRecommendationCard,
  CardHeader,
  CardMeta,
  CardFooter,
  type MetaRow,
} from './BaseRecommendationCard';

export interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRerun?: () => void;
}

export function RestaurantCard({ restaurant, isSelected, onSelect, onRerun }: RestaurantCardProps) {
  const handleActionClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSelect(restaurant.id);
  };

  // Check if this is a placeholder/generic restaurant
  const isGeneric =
    !restaurant.name ||
    restaurant.name === 'Restaurant' ||
    restaurant.name.toLowerCase().includes('restaurant recommendation');

  const displayName = isGeneric ? 'Name unavailable' : restaurant.name;

  // Build metadata
  const meta: MetaRow[] = [];

  // Add rating if available
  if (typeof restaurant.rating === 'number') {
    meta.push({
      label: 'Rating',
      value: `${formatStars(restaurant.rating)}${
        restaurant.reviewCount ? ` (${restaurant.reviewCount})` : ''
      }`,
      icon: <Star className="h-4 w-4 text-amber-500" />,
    });
  }

  // Add cuisine if available
  if (restaurant.cuisine) {
    meta.push({
      label: 'Cuisine',
      value: restaurant.cuisine,
      icon: <UtensilsCrossed className="h-4 w-4 text-slate-500" />,
    });
  }

  // Add price level if available
  if (restaurant.priceLevel) {
    meta.push({
      label: 'Price level',
      value: formatPriceLevel(restaurant.priceLevel),
      icon: <DollarSign className="h-4 w-4 text-slate-500" />,
    });
  }

  // Add address if available
  if (restaurant.address) {
    meta.push({
      label: 'Address',
      value: restaurant.address,
      icon: <MapPin className="h-4 w-4 text-slate-500" />,
    });
  }

  // Add distance if available
  if (typeof restaurant.distanceMi === 'number') {
    meta.push({
      label: 'Distance',
      value: `${restaurant.distanceMi.toFixed(1)} mi away`,
      icon: <MapPin className="h-4 w-4 text-slate-500" />,
    });
  }

  // Generate Google Maps link
  let mapsUrl: string | undefined;
  if (restaurant.googlePlaceId) {
    mapsUrl = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${restaurant.googlePlaceId}`;
  } else if (restaurant.coordinates) {
    mapsUrl = `https://www.google.com/maps/search/?api=1&query=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`;
  }

  return (
    <BaseRecommendationCard
      id={restaurant.id}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <CardHeader
        icon={<UtensilsCrossed className="h-5 w-5" />}
        title={displayName}
        subtitle={restaurant.address}
        isSelected={isSelected}
      />

      <CardMeta items={meta} />

      <CardFooter
        price={restaurant.price ? formatMoney(restaurant.price) : undefined}
        footerNote={restaurant.openNow ? 'Open now' : undefined}
        actionLabel={isSelected ? 'Saved to eats' : 'Save restaurant'}
        isSelected={isSelected}
        onActionClick={handleActionClick}
        bookingUrl={mapsUrl}
        bookingLabel="View on map"
        onRerun={onRerun}
      />
    </BaseRecommendationCard>
  );
}
